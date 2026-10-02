import * as L from "../lib/lists";
import type { SharedList } from "../lib/share";
import type { SignRef } from "../lib/signdigital";
import { readJson, writeJson } from "../lib/storage";

const KEY = "lists";

/** The lists on this phone. Replaced whole on every change and saved with it. */
class Lists {
  all = $state.raw<L.List[]>(readJson(KEY, [], Array.isArray));

  get(id: string | null): L.List | null {
    return this.all.find((l) => l.id === id) ?? null;
  }

  add(name: string): L.List {
    const list = L.newList(name);
    this.save([...this.all, list]);
    return list;
  }

  importShared(shared: SharedList): L.List {
    const list = L.fromShared(shared, this.all);
    this.save([...this.all, list]);
    return list;
  }

  findShared(shared: SharedList): L.List | null {
    return L.findShared(this.all, shared);
  }

  remove(id: string) {
    this.save(this.all.filter((l) => l.id !== id));
  }

  rename(id: string, name: string) {
    this.update(id, (l) => ({ ...l, name }));
  }

  addSigns(id: string, signs: SignRef[]) {
    this.update(id, (l) => L.withSigns(l, signs));
  }

  removeSign(id: string, slug: string) {
    this.update(id, (l) => L.withoutSign(l, slug));
  }

  replaceSigns(id: string, shared: SharedList) {
    this.update(id, (l) => L.replacedBy(l, shared));
  }

  private update(id: string, change: (list: L.List) => L.List) {
    this.save(this.all.map((l) => (l.id === id ? change(l) : l)));
  }

  private save(all: L.List[]) {
    this.all = all;
    writeJson(KEY, all);
  }
}

export const lists = new Lists();
