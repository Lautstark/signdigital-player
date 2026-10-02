import type { Sign } from "./signdigital";
import { api } from "./store.svelte";
import { thumbnails } from "./thumbs";

/**
 * One search field's state: what it found, their pictures, whether it is
 * busy. The Suchen tab and the search inside a list each have one.
 */
export class Searcher {
  results = $state.raw<Sign[]>([]);
  thumbs = $state.raw(new Map<string, string>());
  busy = $state.raw(false);
  error = $state.raw<string | null>(null);
  /** The word the shown results are for; empty before the first search. */
  searched = $state.raw("");

  /* Each run carries a number, so a slow answer to an old word cannot
     overwrite the answer to the word now in the field. */
  private run = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;

  /** Searches after a short pause in typing. */
  typed(query: string) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.now(query), 350);
  }

  async now(query: string) {
    clearTimeout(this.timer);
    const word = query.trim();
    const mine = ++this.run;
    if (!word) {
      this.results = [];
      this.searched = "";
      this.busy = false;
      this.error = null;
      return;
    }
    this.busy = true;
    this.error = null;
    try {
      const found = await api.search(word);
      if (mine !== this.run) return;
      this.results = found;
      this.searched = word;
      const thumbs = await thumbnails(found);
      if (mine === this.run) this.thumbs = thumbs;
    } catch (e) {
      if (mine === this.run) this.error = e instanceof Error ? e.message : String(e);
    } finally {
      if (mine === this.run) this.busy = false;
    }
  }
}
