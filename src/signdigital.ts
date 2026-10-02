/**
 * SIGNdigital, spoken to directly from the page. Their API answers any origin
 * (`access-control-allow-origin: *`, seen 2026-10-02), so there is no server
 * of ours in between: the login, the token and the requests stay on the phone.
 *
 * The endpoints are the ones zeigmal's SignDigitalProvider uses, which are the
 * ones the site's own player uses: `POST /api/authentication` for a token,
 * `GET /api/signs?slug=…` for a sign, `GET /search/query` for the search,
 * `POST /cargo/presigned-url` for links that expire after 60 seconds.
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
  videoPath: string | null;
  cardPath: string | null;
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

  /** Links for storage paths, in the same order. They expire after 60 seconds. */
  async links(paths: string[]): Promise<string[]> {
    if (paths.length === 0) return [];
    return (await this.authed(
      "POST",
      "/cargo/presigned-url",
      paths.map((file) => ({ file })),
    )) as string[];
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
    return response.json();
  }
}

function toSign(raw: unknown): Sign {
  const r = raw as { name?: string; slug?: string; edge?: Record<string, Record<string, string> | undefined> };
  return {
    slug: r.slug ?? "",
    name: r.name ?? r.slug ?? "",
    videoPath: pick(r.edge?.signVideo, VIDEO_VARIANTS),
    cardPath: pick(r.edge?.signBox, CARD_VARIANTS),
  };
}

function pick(variants: Record<string, string> | undefined, order: string[]): string | null {
  if (!variants) return null;
  for (const key of order) if (variants[key]) return variants[key];
  return null;
}
