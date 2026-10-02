import { type KeyValueStore, type SignRef, SignDigital } from "./signdigital";
import { isRate, type Rate } from "./speed";
import { freeName, listFromLink, newSigns, type SharedList } from "./share";

/** Only slug and name are kept of a sign, whatever else came with it. */
const ref = ({ slug, name }: SignRef): SignRef => ({ slug, name });

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
  /** For a list that was imported, the id of the list it was shared from. */
  origin?: string;
}

/** A list as it is shared: under the id it was first shared with, so a list
    passed on from person to person is still recognised as the same one. */
export function asShared(list: List): SharedList {
  return { name: list.name, signs: list.signs, id: list.origin ?? list.id };
}

export const TABS = ["search", "lists", "settings"] as const;
export type Tab = (typeof TABS)[number];

const KEY_LISTS = "lists";
const KEY_PLACE = "place";
const KEY_SPEED = "speed";

/** Where the app was left: tab, open list, search word. Restored on the next open. */
interface Place {
  tab: Tab;
  openList: string | null;
  query: string;
}

function readPlace(): Place {
  const fallback: Place = { tab: "search", openList: null, query: "" };
  try {
    const read = { ...fallback, ...JSON.parse(local.get(KEY_PLACE) ?? "{}") };
    // A tab that no longer exists (Konto became Einstellungen) opens the search.
    return TABS.includes(read.tab) ? read : { ...read, tab: fallback.tab };
  } catch {
    return fallback;
  }
}

const place = readPlace();

function readSpeed(): Rate {
  const stored = Number(local.get(KEY_SPEED));
  return isRate(stored) ? stored : 1;
}

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
  /** The speed every video starts at; set under Einstellungen. */
  defaultSpeed = $state.raw<Rate>(readSpeed());
  /** The import sheet: closed, asking for a link, or showing a list to take over. */
  importing = $state.raw<{ list: SharedList | null } | null>(null);
  /** The speed of what is playing: the default, until changed in the player. */
  speed = $state.raw<Rate>(this.defaultSpeed);

  refreshLogin() {
    this.loggedIn = api.loggedIn;
    this.email = api.email;
  }

  setDefaultSpeed(rate: Rate) {
    this.defaultSpeed = rate;
    local.put(KEY_SPEED, String(rate));
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
    this.addSigns(id, [sign]);
  }

  /** Appends the signs a list does not have yet. */
  addSigns(id: string, signs: SignRef[]) {
    this.saveLists(
      this.lists.map((l) => (l.id === id ? { ...l, signs: [...l.signs, ...newSigns(l.signs, signs).map(ref)] } : l)),
    );
  }

  /** Makes a list hold exactly the shared signs, in their order; its name stays. */
  replaceSigns(id: string, shared: SharedList) {
    this.saveLists(
      this.lists.map((l) => (l.id === id ? { ...l, signs: shared.signs.map(ref), origin: l.origin ?? shared.id } : l)),
    );
  }

  /** The list a shared one is already here as: by its id, or by name for links without one. */
  findShared(shared: SharedList): List | null {
    const byId = shared.id && this.lists.find((l) => l.id === shared.id || l.origin === shared.id);
    return byId || this.lists.find((l) => l.name === shared.name) || null;
  }

  /** Takes a shared list over as a new one; a name already in use gets a number. */
  importList(shared: SharedList): List {
    const list = {
      id: crypto.randomUUID(),
      name: freeName(shared.name, this.lists.map((l) => l.name)),
      signs: shared.signs.map(ref),
      origin: shared.id,
    };
    this.saveLists([...this.lists, list]);
    return list;
  }

  removeFromList(id: string, slug: string) {
    this.saveLists(this.lists.map((l) => (l.id === id ? { ...l, signs: l.signs.filter((s) => s.slug !== slug) } : l)));
  }

  /** Opens the player and gives it a history entry, so the phone's back gesture closes it. */
  play(sign: SignRef, fromList: string | null = null) {
    history.pushState({ playing: true }, "");
    this.playing = sign;
    this.playingFrom = fromList;
    this.speed = this.defaultSpeed;
  }

  /** Moves to another sign of the same list, in place: no new history entry. The speed stays. */
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

/* Opened from a shared link: show the list, and take the link out of the
   address so a reload or the home screen does not offer it again. */
function openSharedLink() {
  const shared = listFromLink(location.hash);
  if (!shared) return;
  history.replaceState(history.state, "", location.pathname + location.search);
  app.importing = { list: shared };
}
openSharedLink();
addEventListener("hashchange", openSharedLink);

addEventListener("popstate", () => {
  app.playing = null;
});
