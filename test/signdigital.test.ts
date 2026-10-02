import { describe, expect, it } from "vitest";
import { type KeyValueStore, Refused, SignDigital, slugCandidates } from "../src/signdigital";

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
    expect(sign).toEqual({ slug: "schmutzig", name: "schmutzig", videoPath: "files/d.mp4", cardPath: "files/schmutzig_sb.jpg" });
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

  it("asks for links in one request, in order", async () => {
    const store = new MemoryStore();
    store.put("signdigital.token", "t1");
    const { seen, fetchFn } = server(() => [201, ["https://x/1", "https://x/2"]]);

    const links = await new SignDigital(store, fetchFn).links(["a", "b"]);

    expect(links).toEqual(["https://x/1", "https://x/2"]);
    expect(seen[0].body).toEqual([{ file: "a" }, { file: "b" }]);
  });
});

describe("slugCandidates", () => {
  it("spells out umlauts as a second guess", () => {
    expect(slugCandidates("  Zähne putzen ")).toEqual(["zähne-putzen", "zaehne-putzen"]);
    expect(slugCandidates("schmutzig")).toEqual(["schmutzig"]);
    expect(slugCandidates("   ")).toEqual([]);
  });
});
