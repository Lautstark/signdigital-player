/**
 * SIGNdigital, spoken to directly from the page. Their API answers any origin
 * (`access-control-allow-origin: *`, seen 2026-10-02), so there is no server
 * of ours in between: the login, the token and the requests stay on the phone.
 *
 * The endpoints are the ones zeigmal's SignDigitalProvider uses, which are the
 * ones the site's own player uses: `POST /api/authentication` for a token,
 * `GET /api/signs?slug=…` for a sign, `GET /search/query` for the search,
 * `POST /cargo/presigned-url` for links that expire after 60 seconds,
 * `GET /api/lists` for the account's Lernlisten, and the site's own writes to
 * them (measured on 2026-11-08 and 2026-11-14, see `createList` and below).
 *
 * Nothing is written to disk. Their terms allow watching through a
 * subscription and do not allow keeping the file.
 */

export interface KeyValueStore {
  get(key: string): string | null;
  put(key: string, value: string | null): void;
}

/** A sign as the app keeps it: enough to find it again and to name it. */
export interface SignRef {
  slug: string;
  name: string;
}

/** A sign as the server describes it, with the storage paths of its files. */
export interface Sign extends SignRef {
  /** SIGNdigital's own id; a Lernliste holds its signs by it. */
  id: string;
  videoPath: string | null;
  cardPath: string | null;
}

/** One of the account's Lernlisten, as the site keeps it, its signs in its order. */
export interface Lernliste {
  id: string;
  name: string;
  signs: Sign[];
}

/** The server said no: not logged in, or the token has run out. */
export class Refused extends Error {}

const KEY_EMAIL = "signdigital.email";
const KEY_PASSWORD = "signdigital.password";
const KEY_TOKEN = "signdigital.token";

// "default" is what a subscriber's player plays; anonymous users only get
// "watermarked". Same order as zeigmal.
const VIDEO_VARIANTS = ["default", "medium", "original", "small", "watermarked"];
// For a thumbnail: "tiny" is 60 px, too soft on a phone screen, so "small" first.
const CARD_VARIANTS = ["small", "tiny", "default", "original"];

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

export class SignDigital {
  constructor(
    private readonly store: KeyValueStore,
    private readonly fetchFn: Fetch = (input, init) => fetch(input, init),
    private readonly base = "https://sign-digital.de",
  ) {}

  get email(): string | null {
    return this.store.get(KEY_EMAIL);
  }

  get loggedIn(): boolean {
    return this.store.get(KEY_TOKEN) !== null;
  }

  async login(email: string, password: string): Promise<void> {
    const result = (await this.call("POST", "/api/authentication", { strategy: "local", email, password }, null)) as {
      accessToken?: string;
    };
    if (!result.accessToken) throw new Error("Antwort ohne Token");
    this.store.put(KEY_EMAIL, email);
    this.store.put(KEY_PASSWORD, password);
    this.store.put(KEY_TOKEN, result.accessToken);
  }

  logout(): void {
    this.store.put(KEY_EMAIL, null);
    this.store.put(KEY_PASSWORD, null);
    this.store.put(KEY_TOKEN, null);
  }

  /** One sign by its slug, or null when there is none. */
  async sign(slug: string): Promise<Sign | null> {
    const page = (await this.authed("GET", `/api/signs?slug=${encodeURIComponent(slug)}`)) as { data?: unknown[] };
    const raw = page.data?.[0];
    return raw ? toSign(raw) : null;
  }

  /**
   * Signs matching what was typed, the way the site's own search asks
   * (`GET /search/query`, seen 2026-10-02): by part of the name or a keyword,
   * in pages. It answers without a login too.
   */
  async search(query: string, skip = 0, limit = 30): Promise<{ signs: Sign[]; total: number }> {
    const params = new URLSearchParams({ text: query, categories: "alle", $skip: String(skip), $limit: String(limit) });
    const page = (await this.authed("GET", `/search/query?${params}`)) as { data?: unknown[]; total?: number };
    const signs = (page.data ?? []).map(toSign).filter((s) => s.slug);
    return { signs, total: page.total ?? signs.length };
  }

  /**
   * The account's Lernlisten, newest first, the way zeigmal reads them
   * (`GET /api/lists`, measured 2026-11-08): the owner is the token's `sub`,
   * and each list comes with its signs filled in. A sign without a slug
   * cannot be played and is left out.
   */
  async lists(): Promise<Lernliste[]> {
    const lists: Lernliste[] = [];
    for (;;) {
      const owner = ownerOf(this.store.get(KEY_TOKEN));
      const params = new URLSearchParams({
        owner,
        ownerType: "users",
        $limit: "50",
        $skip: String(lists.length),
        "$sort[updatedAt]": "-1",
      });
      const page = (await this.authed("GET", `/api/lists?${params}`)) as { data?: unknown[]; total?: number };
      const found = (page.data ?? []).map(toList).filter((l): l is Lernliste => l !== null);
      lists.push(...found);
      if (found.length === 0 || lists.length >= (page.total ?? 0)) return lists;
    }
  }

  /**
   * Makes an empty Lernliste in the account's own folder, the way the site
   * does it (measured 2026-11-14 with a throwaway list): a folder entry, the
   * list pointing at it, then the entry pointing back at the list. A list
   * that could not be made takes its half-made entry with it.
   */
  async createList(name: string): Promise<Lernliste> {
    const owner = ownerOf(this.store.get(KEY_TOKEN));
    const node = (await this.authed("POST", "/api/file-nodes", {
      name,
      nodeType: "file",
      path: `,user_${owner},`,
      fileType: "lists",
      fileDetails: {},
    })) as Record<string, unknown> & { _id: string };
    try {
      const list = (await this.authed("POST", "/api/lists", { ownerType: "users", owner, author: owner, name, node: node._id })) as {
        _id: string;
      };
      await this.authed("PATCH", `/api/file-nodes/${encodeURIComponent(node._id)}`, { ...node, file: list._id });
      return await this.list(list._id);
    } catch (e) {
      await this.authed("DELETE", `/api/file-nodes/${encodeURIComponent(node._id)}`).catch(() => {});
      throw e;
    }
  }

  /** Renames a Lernliste. The site sends the name alone and renames the folder entry itself. */
  async renameList(id: string, name: string): Promise<Lernliste> {
    await this.authed("PATCH", `/api/lists/${encodeURIComponent(id)}`, { name });
    return this.list(id);
  }

  /**
   * Changes the signs in a Lernliste the way the site does: the whole
   * document goes back with one PATCH, its signs as ids in order. It is read
   * fresh right before, so a change made on the site in the meantime is kept,
   * and only what `edit` added or took out is applied to it. A sign the app
   * cannot show (no slug) stays where it was. The list is read again after,
   * so what shows is what the site now holds.
   */
  async changeSigns(id: string, edit: (signs: Sign[]) => Sign[]): Promise<Lernliste> {
    const path = `/api/lists/${encodeURIComponent(id)}`;
    const doc = (await this.authed("GET", path)) as Record<string, unknown> & { signs?: unknown[]; learnedSigns?: unknown[] };
    const before = toList(doc);
    if (!before) throw new Error("Diese Liste gibt es nicht mehr.");
    const after = edit(before.signs);
    const had = new Set(before.signs.map((s) => s.id));
    const has = new Set(after.map((s) => s.id));
    const signs = [
      ...idsOf(doc.signs).filter((sign) => !had.has(sign) || has.has(sign)),
      ...after.map((s) => s.id).filter((sign) => !had.has(sign)),
    ];
    await this.authed("PATCH", path, { ...doc, signs, learnedSigns: idsOf(doc.learnedSigns) });
    return this.list(id);
  }

  /** One Lernliste as the site holds it now. */
  private async list(id: string): Promise<Lernliste> {
    const list = toList(await this.authed("GET", `/api/lists/${encodeURIComponent(id)}`));
    if (!list) throw new Error("Diese Liste gibt es nicht mehr.");
    return list;
  }

  /**
   * Deletes a Lernliste for good. The site deletes its folder entry
   * (`DELETE /api/file-nodes/<node>`) and the list goes with it; the node is
   * the list's `node` field.
   */
  async deleteList(id: string): Promise<void> {
    const doc = (await this.authed("GET", `/api/lists/${encodeURIComponent(id)}`)) as { node?: unknown };
    if (typeof doc.node !== "string" || !doc.node) throw new Error("Die Liste hat keinen Ordner-Eintrag; nichts gelöscht.");
    await this.authed("DELETE", `/api/file-nodes/${encodeURIComponent(doc.node)}`);
  }

  /** Links for storage paths, in the same order. They expire after 60 seconds. */
  async links(paths: string[]): Promise<string[]> {
    if (paths.length === 0) return [];
    return (await this.authed(
      "POST",
      "/cargo/presigned-url",
      paths.map((file) => ({ file })),
    )) as string[];
  }

  /** Several signs by slug, in that order; one that cannot be found is left out. */
  async signs(slugs: string[]): Promise<Sign[]> {
    const found = await Promise.all(slugs.map((slug) => this.sign(slug).catch(() => null)));
    return found.filter((s): s is Sign => s !== null);
  }

  /** Card-picture links for signs, in one request, keyed by slug. */
  async cardLinks(signs: Sign[]): Promise<Map<string, string>> {
    const withCard = signs.filter((s): s is Sign & { cardPath: string } => s.cardPath !== null);
    const links = await this.links(withCard.map((s) => s.cardPath));
    return new Map(withCard.map((s, i) => [s.slug, links[i]]));
  }

  /**
   * A sign's video, fetched whole into memory. The signed link expires after
   * 60 seconds, and a looping video asks again for parts of the file, Safari
   * especially; played from memory, the expired link is never asked again.
   * `no-store` keeps it out of the browser's cache: nothing outlives watching.
   */
  async clip(slug: string): Promise<Blob> {
    const sign = await this.sign(slug);
    if (!sign?.videoPath) throw new Error("Zu dieser Gebärde gibt es kein Video.");
    const [link] = await this.links([sign.videoPath]);
    const response = await this.fetchFn(link, { cache: "no-store" });
    if (!response.ok) throw new Error(`Video nicht geladen (HTTP ${response.status}).`);
    return response.blob();
  }

  /** Runs a request with the saved token; a refused one logs in again, once. */
  private async authed(method: string, path: string, body?: unknown): Promise<unknown> {
    try {
      return await this.call(method, path, body, this.store.get(KEY_TOKEN));
    } catch (e) {
      if (!(e instanceof Refused)) throw e;
      const email = this.store.get(KEY_EMAIL);
      const password = this.store.get(KEY_PASSWORD);
      if (email === null || password === null) throw e;
      this.store.put(KEY_TOKEN, null);
      await this.login(email, password);
      return this.call(method, path, body, this.store.get(KEY_TOKEN));
    }
  }

  private async call(method: string, path: string, body: unknown, token: string | null): Promise<unknown> {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (token !== null) headers.Authorization = token;
    const response = await this.fetchFn(this.base + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const where = `${method} ${path.split("?")[0]}`;
    if (response.status === 401 || response.status === 403) throw new Refused(`${response.status} für ${where}`);
    if (!response.ok) throw new Error(`HTTP ${response.status} für ${where}`);
    // A write may answer with nothing.
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }
}

function toSign(raw: unknown): Sign {
  const r = raw as { _id?: string; name?: string; slug?: string; edge?: Record<string, Record<string, string> | undefined> };
  return {
    id: r._id ?? "",
    slug: r.slug ?? "",
    name: r.name ?? r.slug ?? "",
    videoPath: pick(r.edge?.signVideo, VIDEO_VARIANTS),
    cardPath: pick(r.edge?.signBox, CARD_VARIANTS),
  };
}

function toList(raw: unknown): Lernliste | null {
  const r = raw as { _id?: string; name?: string; signs?: unknown[] };
  if (!r._id) return null;
  return { id: r._id, name: r.name || "Lernliste", signs: (r.signs ?? []).map(toSign).filter((s) => s.slug) };
}

/** Signs as ids, whether the site sent them filled in or as ids already. */
function idsOf(signs: unknown[] | undefined): string[] {
  return (signs ?? [])
    .map((s) => (typeof s === "string" ? s : (s as { _id?: unknown } | null)?._id))
    .filter((s): s is string => typeof s === "string" && s !== "");
}

/** The user id inside a token, which is what the site asks for lists with. */
function ownerOf(token: string | null): string {
  if (token === null) throw new Refused("nicht angemeldet");
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const sub = (JSON.parse(atob(payload)) as { sub?: unknown }).sub;
    if (typeof sub === "string" && sub) return sub;
  } catch {
    /* falls through */
  }
  throw new Refused("Anmeldung ohne Benutzerkennung");
}

function pick(variants: Record<string, string> | undefined, order: string[]): string | null {
  if (!variants) return null;
  for (const key of order) if (variants[key]) return variants[key];
  return null;
}
