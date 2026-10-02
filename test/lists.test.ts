import { describe, expect, it } from "vitest";
import { asShared, findShared, fromShared, newList, replacedBy, withSigns, withoutSign, type List } from "../src/lib/lists";

const a = { slug: "a", name: "a" };
const b = { slug: "b", name: "b" };
const c = { slug: "c", name: "c" };
const mine: List = { id: "mine", name: "Morgens", signs: [a, b] };

describe("lists", () => {
  it("starts empty under a fresh id", () => {
    const one = newList("Abends");
    expect(one).toMatchObject({ name: "Abends", signs: [] });
    expect(one.id).not.toBe(newList("Abends").id);
  });

  it("adds only signs that are not in yet, and keeps nothing but slug and name", () => {
    const more = withSigns(mine, [b, { ...c, cardPath: "x" } as typeof c]);
    expect(more.signs).toEqual([a, b, c]);
  });

  it("takes a sign out", () => {
    expect(withoutSign(mine, "a").signs).toEqual([b]);
  });

  it("replaces the signs, keeps the name and remembers where they came from", () => {
    const replaced = replacedBy(mine, { name: "Anders", signs: [c, a], id: "theirs" });
    expect(replaced).toEqual({ id: "mine", name: "Morgens", signs: [c, a], origin: "theirs" });
  });

  it("takes a shared list over under a free name", () => {
    const taken = fromShared({ name: "Morgens", signs: [c], id: "theirs" }, [mine]);
    expect(taken).toMatchObject({ name: "Morgens (2)", signs: [c], origin: "theirs" });
  });
});

describe("recognising a shared list", () => {
  const imported: List = { id: "copy", name: "Umbenannt", signs: [a], origin: "theirs" };

  it("by id, however it was renamed", () => {
    expect(findShared([mine, imported], { name: "Morgens", signs: [], id: "theirs" })).toBe(imported);
  });

  it("when one's own list comes back", () => {
    expect(findShared([mine], { name: "Anders", signs: [], id: "mine" })).toBe(mine);
  });

  it("by name when the link carries no id", () => {
    expect(findShared([mine], { name: "Morgens", signs: [] })).toBe(mine);
    expect(findShared([mine], { name: "Abends", signs: [] })).toBeNull();
  });

  it("is passed on under the id it was first shared with", () => {
    expect(asShared(imported).id).toBe("theirs");
    expect(asShared(mine).id).toBe("mine");
  });
});
