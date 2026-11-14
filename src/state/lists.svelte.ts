import { api } from "../lib/api";
import type { Lernliste } from "../lib/signdigital";
import { local, readJson, writeJson } from "../lib/storage";
import { message } from "../lib/words";

const KEY = "lernlisten";

/**
 * The account's Lernlisten. They are made and changed on sign-digital.de; the
 * app only reads them. The last good load is kept, so the lists stand without
 * a network and open at once.
 */
class Lists {
  all = $state.raw<Lernliste[]>(readJson(KEY, [], Array.isArray));
  busy = $state.raw(false);
  error = $state.raw<string | null>(null);

  get(id: string | null): Lernliste | null {
    return this.all.find((l) => l.id === id) ?? null;
  }

  async load() {
    if (this.busy) return;
    this.busy = true;
    this.error = null;
    try {
      this.all = await api.lists();
      writeJson(KEY, this.all);
    } catch (e) {
      this.error = message(e);
    } finally {
      this.busy = false;
    }
  }

  /** Another account's lists have no place on this phone. */
  forget() {
    this.all = [];
    this.error = null;
    local.put(KEY, null);
  }
}

export const lists = new Lists();
