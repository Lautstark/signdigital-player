import type { SignRef } from "./signdigital";
import { freeName, newSigns, type SharedList } from "./share";

/**
 * The family's lists of signs, as plain data and pure functions over it. The
 * reactive copy that the screens read and that is saved lives in
 * state/lists.svelte.ts; everything that decides something lives here.
 */
export interface List {
  id: string;
  name: string;
  signs: SignRef[];
  /** For a list that was imported, the id of the list it was shared from. */
  origin?: string;
}

/** Only slug and name are kept of a sign, whatever else came with it. */
const ref = ({ slug, name }: SignRef): SignRef => ({ slug, name });

export function newList(name: string): List {
  return { id: crypto.randomUUID(), name, signs: [] };
}

/** Appends the signs the list does not have yet. */
export function withSigns(list: List, signs: SignRef[]): List {
  return { ...list, signs: [...list.signs, ...newSigns(list.signs, signs).map(ref)] };
}

export function withoutSign(list: List, slug: string): List {
  return { ...list, signs: list.signs.filter((s) => s.slug !== slug) };
}

/** The list holding exactly the shared signs, in their order; its name stays. */
export function replacedBy(list: List, shared: SharedList): List {
  return { ...list, signs: shared.signs.map(ref), origin: list.origin ?? shared.id };
}

/** A shared list taken over as a new one; a name already in use gets a number. */
export function fromShared(shared: SharedList, lists: List[]): List {
  return {
    id: crypto.randomUUID(),
    name: freeName(shared.name, lists.map((l) => l.name)),
    signs: shared.signs.map(ref),
    origin: shared.id,
  };
}

/** A list as it is shared: under the id it was first shared with, so a list
    passed on from person to person is still recognised as the same one. */
export function asShared(list: List): SharedList {
  return { name: list.name, signs: list.signs, id: list.origin ?? list.id };
}

/** The list a shared one is already here as: by its id, or by name for links without one. */
export function findShared(lists: List[], shared: SharedList): List | null {
  const byId = shared.id ? lists.find((l) => l.id === shared.id || l.origin === shared.id) : undefined;
  return byId ?? lists.find((l) => l.name === shared.name) ?? null;
}
