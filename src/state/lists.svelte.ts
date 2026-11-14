import { api } from "../lib/api";
import type { Lernliste, Sign } from "../lib/signdigital";
import { local, readJson, writeJson } from "../lib/storage";
import { message } from "../lib/words";

const KEY = "lernlisten";

/**
 * The account's Lernlisten. They live on sign-digital.de: every change here
 * goes there first and shows once the site has taken it. The last good load
 * is kept, so the lists stand without a network and open at once.
 */
class Lists {
  all = $state.raw<Lernliste[]>(readJson(KEY, [], Array.isArray));
  busy = $state.raw(false);
  error = $state.raw<string | null>(null);

  get(id: string | null): Lernliste | null {
    return this.all.find((l) => l.id === id) ?? null;
  }

  async load() {
    await this.run(async () => this.save(await api.lists()));
  }

  /** The new list, or null when the site did not take it (the reason is in `error`). */
  async create(name: string): Promise<Lernliste | null> {
    let made: Lernliste | null = null;
    await this.run(async () => {
      const list = await api.createList(name);
      this.save([list, ...this.all]);
      made = list;
    });
    return made;
  }

  async rename(id: string, name: string) {
    await this.replace(id, () => api.renameList(id, name));
  }

  async addSign(id: string, sign: Sign) {
    await this.replace(id, () => api.changeSigns(id, (signs) => (signs.some((s) => s.id === sign.id) ? signs : [...signs, sign])));
  }

  async removeSign(id: string, sign: Sign) {
    await this.replace(id, () => api.changeSigns(id, (signs) => signs.filter((s) => s.id !== sign.id)));
  }

  /** Deletes the list in the account, for good. */
  async remove(id: string) {
    await this.run(async () => {
      await api.deleteList(id);
      this.save(this.all.filter((l) => l.id !== id));
    });
  }

  /** Another account's lists have no place on this phone. */
  forget() {
    this.all = [];
    this.error = null;
    local.put(KEY, null);
  }

  /** Puts the list as the site now holds it in place of the one shown. */
  private async replace(id: string, write: () => Promise<Lernliste>) {
    await this.run(async () => {
      const changed = await write();
      this.save(this.all.map((l) => (l.id === id ? changed : l)));
    });
  }

  #queue: Promise<void> = Promise.resolve();
  #waiting = 0;

  /* One request at a time, in the order they were asked for, so two quick
     taps never send two versions of the same list. A failure is shown and
     the lists stay as the site last said. */
  private run(work: () => Promise<void>): Promise<void> {
    this.#waiting++;
    this.busy = true;
    this.#queue = this.#queue.then(async () => {
      this.error = null;
      try {
        await work();
      } catch (e) {
        this.error = message(e);
      } finally {
        this.busy = --this.#waiting > 0;
      }
    });
    return this.#queue;
  }

  private save(all: Lernliste[]) {
    this.all = all;
    writeJson(KEY, all);
  }
}

export const lists = new Lists();
