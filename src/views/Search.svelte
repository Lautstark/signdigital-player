<script lang="ts">
  import type { Sign } from "../lib/signdigital";
  import { nav } from "../state/nav.svelte";
  import { Searcher } from "../state/searcher.svelte";
  import Icon from "../components/Icon.svelte";
  import SearchField from "../components/SearchField.svelte";
  import SearchResults from "../components/SearchResults.svelte";
  import AddToList from "./AddToList.svelte";

  const search = new Searcher();
  let adding = $state.raw<Sign | null>(null);

  // Coming back to the tab with a word still in the field shows its results again.
  if (nav.query.trim()) search.now(nav.query);
</script>

<div class="page">
  <SearchField bind:value={nav.query} placeholder="Gebärde suchen" {search} />
  <SearchResults {search}>
    {#snippet action(sign: Sign)}
      <button class="icon" aria-label="{sign.name} in eine Liste" onclick={() => (adding = sign)}><Icon name="plus" /></button>
    {/snippet}
  </SearchResults>
</div>

{#if adding}
  <AddToList sign={adding} close={() => (adding = null)} />
{/if}
