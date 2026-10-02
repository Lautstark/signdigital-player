<script lang="ts">
  import type { SignRef } from "../signdigital";
  import { app } from "../store.svelte";
  import { Searcher } from "../searcher.svelte";
  import Thumb from "../Thumb.svelte";
  import SearchField from "../SearchField.svelte";
  import AddToList from "./AddToList.svelte";

  const search = new Searcher();
  let adding = $state.raw<SignRef | null>(null);

  // Coming back to the tab with a word still in the field shows its results again.
  if (app.query.trim()) search.now(app.query);
</script>

<div class="page">
  <SearchField bind:value={app.query} placeholder="Gebärde suchen" {search} />

  {#if search.error}
    <p class="note error">{search.error}</p>
  {:else if search.busy && search.results.length === 0}
    <p class="note">Suche …</p>
  {:else if search.searched && search.results.length === 0}
    <p class="note">Keine Gebärde „{search.searched}“ gefunden.</p>
  {/if}

  <ul class="rows">
    {#each search.results as sign (sign.slug)}
      <li class="row">
        <button class="main" onclick={() => app.play(sign)}>
          <Thumb src={search.thumbs.get(sign.slug)} />
          <span class="name">{sign.name}</span>
        </button>
        <button class="icon" aria-label="{sign.name} in eine Liste" onclick={() => (adding = sign)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      </li>
    {/each}
  </ul>

  {#if search.hasMore}
    <button class="button more" disabled={search.busy} onclick={() => search.more()}>
      {search.busy ? "Lädt …" : `Mehr anzeigen (${search.total - search.results.length} weitere)`}
    </button>
  {/if}
</div>

{#if adding}
  <AddToList sign={adding} close={() => (adding = null)} />
{/if}
