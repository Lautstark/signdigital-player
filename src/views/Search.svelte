<script lang="ts">
  import { nav } from "../state/nav.svelte";
  import { Searcher } from "../state/searcher.svelte";
  import SearchField from "../components/SearchField.svelte";
  import SearchResults from "../components/SearchResults.svelte";

  const search = new Searcher();

  // Coming back to the tab with a word still in the field shows its results again.
  if (nav.query.trim()) search.now(nav.query);
</script>

<div class="page">
  <SearchField bind:value={nav.query} placeholder="Gebärde suchen" {search} />
  <SearchResults {search} />
</div>
