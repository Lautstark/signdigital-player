import { listFromLink, type SharedList } from "../lib/share";
import { readJson, writeJson } from "../lib/storage";
import { lists } from "./lists.svelte";

export const TABS = ["search", "lists", "settings"] as const;
export type Tab = (typeof TABS)[number];

const KEY = "place";

/** Where the app was left: tab, open list, search word. Restored on the next open. */
interface Place {
  tab: Tab;
  openList: string | null;
  query: string;
}

const START: Place = { tab: "search", openList: null, query: "" };

function readPlace(): Place {
  const read = { ...START, ...readJson<Partial<Place>>(KEY, {}, (v) => typeof v === "object" && v !== null) };
  return {
    // A tab that no longer exists (Konto became Einstellungen) opens the search.
    tab: TABS.includes(read.tab as Tab) ? read.tab : START.tab,
    // A list deleted since reads as none.
    openList: lists.get(read.openList) ? read.openList : null,
    query: typeof read.query === "string" ? read.query : "",
  };
}

/** Which screen shows what, and the import sheet over it. */
class Nav {
  #place = readPlace();
  tab = $state.raw<Tab>(this.#place.tab);
  /** The list open under the Listen tab, by id. */
  openList = $state.raw<string | null>(this.#place.openList);
  /** The word in the Suchen field. */
  query = $state.raw(this.#place.query);
  /** The import sheet: closed, asking for a link, or showing a list to take over. */
  importing = $state.raw<{ list: SharedList | null } | null>(null);

  showList(id: string) {
    this.tab = "lists";
    this.openList = id;
  }

  /** Saves the place on every change, for as long as the app runs. */
  remember() {
    $effect.root(() => {
      $effect(() => writeJson(KEY, { tab: this.tab, openList: this.openList, query: this.query } satisfies Place));
    });
  }

  /** Opened from a shared link: show the list, and take the link out of the
      address so a reload or the home screen does not offer it again. */
  openSharedLink() {
    const shared = listFromLink(location.hash);
    if (!shared) return;
    history.replaceState(history.state, "", location.pathname + location.search);
    this.importing = { list: shared };
  }
}

export const nav = new Nav();
