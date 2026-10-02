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
  /** How many signs match in all; more than `results` holds means there is a next page. */
  total = $state.raw(0);

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
      this.total = 0;
      this.busy = false;
      this.error = null;
      return;
    }
    this.busy = true;
    this.error = null;
    try {
      const page = await api.search(word);
      if (mine !== this.run) return;
      this.results = page.signs;
      this.total = page.total;
      this.searched = word;
      const thumbs = await thumbnails(page.signs);
      if (mine === this.run) this.thumbs = thumbs;
    } catch (e) {
      if (mine === this.run) this.error = e instanceof Error ? e.message : String(e);
    } finally {
      if (mine === this.run) this.busy = false;
    }
  }

  get hasMore() {
    return this.results.length < this.total;
  }

  /** The next page of the same word, added below what is shown. */
  async more() {
    if (this.busy || !this.hasMore) return;
    const mine = this.run;
    this.busy = true;
    try {
      const page = await api.search(this.searched, this.results.length);
      if (mine !== this.run) return;
      const shown = new Set(this.results.map((s) => s.slug));
      const added = page.signs.filter((s) => !shown.has(s.slug));
      this.results = [...this.results, ...added];
      // A page that adds nothing would offer "more" forever.
      this.total = added.length === 0 ? this.results.length : page.total;
      const thumbs = await thumbnails(added);
      if (mine === this.run) this.thumbs = new Map([...this.thumbs, ...thumbs]);
    } catch (e) {
      if (mine === this.run) this.error = e instanceof Error ? e.message : String(e);
    } finally {
      if (mine === this.run) this.busy = false;
    }
  }
}
