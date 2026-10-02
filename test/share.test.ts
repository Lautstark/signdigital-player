import { describe, expect, it } from "vitest";
import { decodeList, freeName, listFromLink, shareLink } from "../src/share";

const MORGENS = {
  name: "Morgens ☀️",
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
