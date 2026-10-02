import { type KeyValueStore, type SignRef, SignDigital } from "./signdigital";

/**
 * localStorage, which can throw (blocked site data, a private window). A store
 * that throws reads as empty and writes as nothing, so the app still opens.
 */
const local: KeyValueStore = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  put(key, value) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      /* nothing to keep it in */
    }
  },
};

export const api = new SignDigital(local);

export interface List {
  id: string;
  name: string;
  signs: SignRef[];
}

export type Tab = "search" | "lists" | "account";

const KEY_LISTS = "lists";
const KEY_PLACE = "place";

/** Where the app was left: tab, open list, search word. Restored on the next open. */
interface Place {
  tab: Tab;
  openList: string | null;
  query: string;
}

function readPlace(): Place {
  const fallback: Place = { tab: "search", openList: null, query: "" };
  try {
    return { ...fallback, ...JSON.parse(local.get(KEY_PLACE) ?? "{}") };
  } catch {
    return fallback;
  }
}

const place = readPlace();

function readLists(): List[] {
  try {
    const parsed = JSON.parse(local.get(KEY_LISTS) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** What the screen shows. Replaced whole on every change, never mutated in place. */
class App {
  loggedIn = $state.raw(api.loggedIn);
  email = $state.raw(api.email);
  tab = $state.raw<Tab>(place.tab);
  lists = $state.raw<List[]>(readLists());
  /** The list open under the Listen tab, by id; a list deleted since reads as none. */
  openList = $state.raw<string | null>(this.lists.some((l) => l.id === place.openList) ? place.openList : null);
  /** The sign playing full screen, if any. */
  playing = $state.raw<SignRef | null>(null);
  /** The list it was started from; its neighbours there are offered on pause. */
  playingFrom = $state.raw<string | null>(null);
  query = $state.raw(place.query);

  refreshLogin() {
    this.loggedIn = api.loggedIn;
    this.email = api.email;
  }

  private saveLists(lists: List[]) {
    this.lists = lists;
    local.put(KEY_LISTS, JSON.stringify(lists));
  }

  addList(name: string): List {
    const list = { id: crypto.randomUUID(), name, signs: [] };
    this.saveLists([...this.lists, list]);
    return list;
  }

  renameList(id: string, name: string) {
    this.saveLists(this.lists.map((l) => (l.id === id ? { ...l, name } : l)));
  }

  deleteList(id: string) {
    this.saveLists(this.lists.filter((l) => l.id !== id));
  }

  addToList(id: string, sign: SignRef) {
    this.saveLists(
      this.lists.map((l) =>
        l.id === id && !l.signs.some((s) => s.slug === sign.slug)
          ? { ...l, signs: [...l.signs, { slug: sign.slug, name: sign.name }] }
          : l,
      ),
    );
  }

  removeFromList(id: string, slug: string) {
    this.saveLists(this.lists.map((l) => (l.id === id ? { ...l, signs: l.signs.filter((s) => s.slug !== slug) } : l)));
  }

  /** Opens the player and gives it a history entry, so the phone's back gesture closes it. */
  play(sign: SignRef, fromList: string | null = null) {
    history.pushState({ playing: true }, "");
    this.playing = sign;
    this.playingFrom = fromList;
  }

  /** Moves to another sign of the same list, in place: no new history entry. */
  step(sign: SignRef) {
    this.playing = sign;
  }

  closePlayer() {
    if (history.state?.playing) history.back();
    else this.playing = null;
  }
}

export const app = new App();

$effect.root(() => {
  $effect(() => {
    local.put(KEY_PLACE, JSON.stringify({ tab: app.tab, openList: app.openList, query: app.query } satisfies Place));
  });
});

addEventListener("popstate", () => {
  app.playing = null;
});
