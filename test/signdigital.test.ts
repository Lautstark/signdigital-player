import { describe, expect, it } from "vitest";
import { type KeyValueStore, Refused, SignDigital } from "../src/lib/signdigital";

class MemoryStore implements KeyValueStore {
  readonly values = new Map<string, string>();
  get(key: string) {
    return this.values.get(key) ?? null;
  }
  put(key: string, value: string | null) {
    if (value === null) this.values.delete(key);
    else this.values.set(key, value);
  }
}

interface Seen {
  method: string;
  url: string;
  auth: string | null;
  body: unknown;
}

/** A fake server: answers from a table, and records what it was asked. */
function server(answer: (seen: Seen) => [number, unknown]) {
  const seen: Seen[] = [];
  const fetchFn = async (url: string, init?: RequestInit) => {
    const headers = (init?.headers ?? {}) as Record<string, string>;
    const s: Seen = {
      method: init?.method ?? "GET",
      url,
      auth: headers.Authorization ?? null,
      body: init?.body ? JSON.parse(init.body as string) : undefined,
    };
    seen.push(s);
    const [status, json] = answer(s);
    return new Response(JSON.stringify(json), { status });
  };
  return { seen, fetchFn };
}

const SCHMUTZIG = {
  name: "schmutzig",
  slug: "schmutzig",
  edge: {
    signBox: { tiny: "files/schmutzig_sb.jpg" },
    signVideo: { watermarked: "files/w.mp4", default: "files/d.mp4" },
  },
};

describe("SignDigital", () => {
  it("logs in and keeps the login", async () => {
    const store = new MemoryStore();
    const { seen, fetchFn } = server(() => [201, { accessToken: "t1" }]);
    const api = new SignDigital(store, fetchFn);

    await api.login("a@b.de", "pw");

    expect(seen[0]).toMatchObject({
      method: "POST",
      url: "https://sign-digital.de/api/authentication",
      body: { strategy: "local", email: "a@b.de", password: "pw" },
    });
    expect(api.loggedIn).toBe(true);
    expect(api.email).toBe("a@b.de");
  });

  it("prefers the subscriber's video and the smallest card", async () => {
    const store = new MemoryStore();
    store.put("signdigital.token", "t1");
    const { seen, fetchFn } = server(() => [200, { data: [SCHMUTZIG] }]);

    const sign = await new SignDigital(store, fetchFn).sign("schmutzig");

    expect(seen[0].auth).toBe("t1");
    expect(sign).toEqual({ id: "", slug: "schmutzig", name: "schmutzig", videoPath: "files/d.mp4", cardPath: "files/schmutzig_sb.jpg" });
  });

  it("logs in again, once, when the token has run out", async () => {
    const store = new MemoryStore();
    store.put("signdigital.email", "a@b.de");
    store.put("signdigital.password", "pw");
    store.put("signdigital.token", "old");
    const { seen, fetchFn } = server((s) => {
      if (s.url.endsWith("/api/authentication")) return [201, { accessToken: "new" }];
      return s.auth === "new" ? [200, { data: [SCHMUTZIG] }] : [401, {}];
    });

    const sign = await new SignDigital(store, fetchFn).sign("schmutzig");

    expect(sign?.slug).toBe("schmutzig");
    expect(seen.map((s) => s.auth)).toEqual(["old", null, "new"]);
    expect(store.get("signdigital.token")).toBe("new");
  });

  it("gives up when there is no saved login to retry with", async () => {
    const { fetchFn } = server(() => [401, {}]);
    await expect(new SignDigital(new MemoryStore(), fetchFn).sign("x")).rejects.toBeInstanceOf(Refused);
  });

  it("forgets everything on logout", async () => {
    const store = new MemoryStore();
    const { fetchFn } = server(() => [201, { accessToken: "t1" }]);
    const api = new SignDigital(store, fetchFn);
    await api.login("a@b.de", "pw");

    api.logout();

    expect(store.values.size).toBe(0);
    expect(api.loggedIn).toBe(false);
  });

  it("searches the way the site does, a page at a time", async () => {
    const store = new MemoryStore();
    store.put("signdigital.token", "t1");
    const { seen, fetchFn } = server(() => [200, { total: 32, data: [SCHMUTZIG] }]);

    const page = await new SignDigital(store, fetchFn).search("schmu tzig", 30, 30);

    const url = new URL(seen[0].url);
    expect(url.pathname).toBe("/search/query");
    expect(Object.fromEntries(url.searchParams)).toEqual({ text: "schmu tzig", categories: "alle", $skip: "30", $limit: "30" });
    expect(page.total).toBe(32);
    expect(page.signs.map((s) => s.slug)).toEqual(["schmutzig"]);
  });

  it("asks for links in one request, in order", async () => {
    const store = new MemoryStore();
    store.put("signdigital.token", "t1");
    const { seen, fetchFn } = server(() => [201, ["https://x/1", "https://x/2"]]);

    const links = await new SignDigital(store, fetchFn).links(["a", "b"]);

    expect(links).toEqual(["https://x/1", "https://x/2"]);
    expect(seen[0].body).toEqual([{ file: "a" }, { file: "b" }]);
  });

  it("fetches a clip whole, past the browser's cache", async () => {
    const store = new MemoryStore();
    store.put("signdigital.token", "t1");
    const inits: (RequestInit | undefined)[] = [];
    const fetchFn = async (url: string, init?: RequestInit) => {
      inits.push(init);
      if (url.includes("/api/signs")) return new Response(JSON.stringify({ data: [SCHMUTZIG] }));
      if (url.endsWith("/cargo/presigned-url")) return new Response(JSON.stringify(["https://x/clip.mp4"]));
      return new Response("video-bytes");
    };

    const clip = await new SignDigital(store, fetchFn).clip("schmutzig");

    expect(await clip.text()).toBe("video-bytes");
    expect(inits[2]).toEqual({ cache: "no-store" });
  });

  it("says so when a sign has no video", async () => {
    const store = new MemoryStore();
    store.put("signdigital.token", "t1");
    const { fetchFn } = server(() => [200, { data: [{ name: "x", slug: "x", edge: {} }] }]);
    await expect(new SignDigital(store, fetchFn).clip("x")).rejects.toThrow("kein Video");
  });

  it("asks for all card pictures in one request, keyed by slug", async () => {
    const store = new MemoryStore();
    store.put("signdigital.token", "t1");
    const { seen, fetchFn } = server(() => [201, ["https://x/card.jpg"]]);
    const signs = [
      { id: "1", slug: "a", name: "a", videoPath: null, cardPath: "files/a.jpg" },
      { id: "2", slug: "b", name: "b", videoPath: null, cardPath: null },
    ];

    const links = await new SignDigital(store, fetchFn).cardLinks(signs);

    expect(seen).toHaveLength(1);
    expect([...links]).toEqual([["a", "https://x/card.jpg"]]);
  });
  it("reads the account's Lernlisten, newest first, a page at a time", async () => {
    const store = new MemoryStore();
    // A token whose payload says sub "u1", the way the site signs it.
    store.put("signdigital.token", `h.${btoa(JSON.stringify({ sub: "u1" }))}.s`);
    const { seen, fetchFn } = server((s) => {
      const skip = new URL(s.url).searchParams.get("$skip");
      if (skip === "0") return [200, { total: 2, data: [{ _id: "l1", name: "Halloween", signs: [SCHMUTZIG, { name: "ohne Slug" }] }] }];
      return [200, { total: 2, data: [{ _id: "l2", name: "", signs: [] }, { name: "ohne Id" }] }];
    });

    const lists = await new SignDigital(store, fetchFn).lists();

    expect(seen.every((s) => s.method === "GET")).toBe(true);
    const url = new URL(seen[0].url);
    expect(url.pathname).toBe("/api/lists");
    expect(Object.fromEntries(url.searchParams)).toMatchObject({ owner: "u1", ownerType: "users", "$sort[updatedAt]": "-1" });
    expect(lists.map((l) => [l.id, l.name, l.signs.map((s) => s.slug)])).toEqual([
      ["l1", "Halloween", ["schmutzig"]],
      ["l2", "Lernliste", []],
    ]);
  });
  const DOC = {
    _id: "l1",
    name: "Halloween",
    node: "n1",
    owner: "u1",
    signs: [{ _id: "s1", slug: "a", name: "a" }, { _id: "s2", name: "ohne Slug" }, { _id: "s3", slug: "c", name: "c" }],
    learnedSigns: [{ _id: "s1" }],
  };
  const sign = (id: string, slug: string) => ({ id, slug, name: slug, videoPath: null, cardPath: null });

  it("changes the signs with one PATCH of the whole, freshly read document, then reads it back", async () => {
    const store = new MemoryStore();
    store.put("signdigital.token", "t1");
    const { seen, fetchFn } = server((s) => (s.method === "GET" ? [200, DOC] : [200, {}]));

    const changed = await new SignDigital(store, fetchFn).changeSigns("l1", (signs) => [...signs.filter((s) => s.id !== "s1"), sign("s4", "d")]);

    expect(seen.map((s) => [s.method, new URL(s.url).pathname])).toEqual([
      ["GET", "/api/lists/l1"],
      ["PATCH", "/api/lists/l1"],
      ["GET", "/api/lists/l1"],
    ]);
    // s2 cannot be shown but stays in place; s4 goes at the end; ids only.
    expect(seen[1].body).toMatchObject({ _id: "l1", node: "n1", owner: "u1", name: "Halloween", signs: ["s2", "s3", "s4"], learnedSigns: ["s1"] });
    // What shows is what the site holds afterwards (here: the fake's unchanged DOC).
    expect(changed.signs.map((s) => s.id)).toEqual(["s1", "s3"]);
  });

  it("renames with the name alone, as the site does", async () => {
    const store = new MemoryStore();
    store.put("signdigital.token", "t1");
    const { seen, fetchFn } = server((s) => (s.method === "GET" ? [200, { ...DOC, name: "Herbst" }] : [200, {}]));

    const renamed = await new SignDigital(store, fetchFn).renameList("l1", "Herbst");

    expect(seen[0]).toMatchObject({ method: "PATCH", body: { name: "Herbst" } });
    expect(renamed.name).toBe("Herbst");
  });

  it("makes a list the way the site does: folder entry, list, entry pointing back", async () => {
    const store = new MemoryStore();
    store.put("signdigital.token", `h.${btoa(JSON.stringify({ sub: "u1" }))}.s`);
    const node = { _id: "n9", name: "Neu", nodeType: "file", path: ",user_u1,", fileType: "lists" };
    const { seen, fetchFn } = server((s) => {
      const path = new URL(s.url).pathname;
      if (s.method === "POST" && path === "/api/file-nodes") return [201, node];
      if (s.method === "POST" && path === "/api/lists") return [201, { _id: "l9" }];
      if (s.method === "GET") return [200, { _id: "l9", name: "Neu", node: "n9", signs: [] }];
      return [200, {}];
    });

    const made = await new SignDigital(store, fetchFn).createList("Neu");

    expect(seen.map((s) => [s.method, new URL(s.url).pathname])).toEqual([
      ["POST", "/api/file-nodes"],
      ["POST", "/api/lists"],
      ["PATCH", "/api/file-nodes/n9"],
      ["GET", "/api/lists/l9"],
    ]);
    expect(seen[0].body).toEqual({ name: "Neu", nodeType: "file", path: ",user_u1,", fileType: "lists", fileDetails: {} });
    expect(seen[1].body).toEqual({ ownerType: "users", owner: "u1", author: "u1", name: "Neu", node: "n9" });
    expect(seen[2].body).toMatchObject({ _id: "n9", file: "l9" });
    expect(made).toEqual({ id: "l9", name: "Neu", signs: [] });
  });

  it("takes the folder entry back when the list itself could not be made", async () => {
    const store = new MemoryStore();
    store.put("signdigital.token", `h.${btoa(JSON.stringify({ sub: "u1" }))}.s`);
    const { seen, fetchFn } = server((s) => {
      const path = new URL(s.url).pathname;
      if (path === "/api/file-nodes") return [201, { _id: "n9" }];
      if (path === "/api/lists") return [500, {}];
      return [200, {}];
    });

    await expect(new SignDigital(store, fetchFn).createList("Neu")).rejects.toThrow();
    expect(seen.at(-1)).toMatchObject({ method: "DELETE", url: "https://sign-digital.de/api/file-nodes/n9" });
  });

  it("deletes a list by its folder entry", async () => {
    const store = new MemoryStore();
    store.put("signdigital.token", "t1");
    const { seen, fetchFn } = server((s) => (s.method === "GET" ? [200, DOC] : [200, {}]));

    await new SignDigital(store, fetchFn).deleteList("l1");

    expect(seen.map((s) => [s.method, new URL(s.url).pathname])).toEqual([
      ["GET", "/api/lists/l1"],
      ["DELETE", "/api/file-nodes/n1"],
    ]);
  });

  it("deletes nothing when the list has no folder entry", async () => {
    const store = new MemoryStore();
    store.put("signdigital.token", "t1");
    const { seen, fetchFn } = server(() => [200, { ...DOC, node: undefined }]);

    await expect(new SignDigital(store, fetchFn).deleteList("l1")).rejects.toThrow();
    expect(seen.every((s) => s.method === "GET")).toBe(true);
  });
});
