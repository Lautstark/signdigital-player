import { describe, expect, it } from "vitest";
import { decodeList, freeName, listFromLink, newSigns, sameSigns, shareLink } from "../src/share";

const MORGENS = {
  name: "Morgens ☀️",
  id: "4f0c-list",
  signs: [
    { slug: "aufstehen", name: "aufstehen" },
    { slug: "zaehne-putzen", name: "Zähne putzen" },
  ],
};

describe("sharing a list", () => {
  it("comes back from its link as it went in, umlauts and emoji included", () => {
    const link = shareLink(MORGENS, "https://lautstark.tech/signdigital-player/");
    expect(link.startsWith("https://lautstark.tech/signdigital-player/#liste=")).toBe(true);
    expect(listFromLink(link)).toEqual(MORGENS);
  });

  it("puts nothing in the part a server sees", () => {
    const url = new URL(shareLink(MORGENS, "https://lautstark.tech/signdigital-player/"));
    expect(url.pathname + url.search).toBe("/signdigital-player/");
  });

  it("reads links from before lists had an id", () => {
    const old = btoa(JSON.stringify({ n: "Abends", s: ["schlafen"] }));
    expect(listFromLink(`#liste=${old}`)).toEqual({ name: "Abends", signs: [{ slug: "schlafen", name: "schlafen" }] });
  });

  it("finds the link inside a message pasted whole", () => {
    const link = shareLink(MORGENS, "https://lautstark.tech/signdigital-player/");
    expect(listFromLink(`Hier unsere Liste: ${link} bis später`)?.name).toBe("Morgens ☀️");
  });

  it("refuses what is not a list", () => {
    expect(listFromLink("https://lautstark.tech/signdigital-player/")).toBeNull();
    expect(listFromLink("#liste=kaputt")).toBeNull();
    expect(decodeList(btoa(JSON.stringify({ n: "", s: [] })))).toBeNull();
    expect(decodeList(btoa(JSON.stringify({ n: "x", s: [42] })))).toBeNull();
  });
});

describe("freeName", () => {
  it("numbers a name that is taken", () => {
    expect(freeName("Morgens", ["Abends"])).toBe("Morgens");
    expect(freeName("Morgens", ["Morgens"])).toBe("Morgens (2)");
    expect(freeName("Morgens", ["Morgens", "Morgens (2)"])).toBe("Morgens (3)");
  });
});

describe("comparing with a list already there", () => {
  const a = { slug: "a", name: "a" };
  const b = { slug: "b", name: "b" };
  const c = { slug: "c", name: "c" };

  it("names the signs that are new, in the shared order", () => {
    expect(newSigns([a], [c, a, b])).toEqual([c, b]);
    expect(newSigns([a, b], [b, a])).toEqual([]);
  });

  it("tells a different order apart", () => {
    expect(sameSigns([a, b], [a, b])).toBe(true);
    expect(sameSigns([a, b], [b, a])).toBe(false);
    expect(sameSigns([a], [a, b])).toBe(false);
  });
});
