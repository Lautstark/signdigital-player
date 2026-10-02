<script lang="ts">
  import type { Sign, SignRef } from "../signdigital";
  import { app } from "../store.svelte";
  import { Searcher } from "../searcher.svelte";
  import SearchField from "../SearchField.svelte";
  import SearchResults from "../SearchResults.svelte";
  import AddToList from "./AddToList.svelte";

  const search = new Searcher();
  let adding = $state.raw<SignRef | null>(null);

  // Coming back to the tab with a word still in the field shows its results again.
  if (app.query.trim()) search.now(app.query);
</script>

<div class="page">
  <SearchField bind:value={app.query} placeholder="Gebärde suchen" {search} />
  <SearchResults {search}>
    {#snippet action(sign: Sign)}
      <button class="icon" aria-label="{sign.name} in eine Liste" onclick={() => (adding = sign)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
      </button>
    {/snippet}
  </SearchResults>
</div>

{#if adding}
  <AddToList sign={adding} close={() => (adding = null)} />
{/if}
