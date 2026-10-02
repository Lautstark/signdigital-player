<script lang="ts">
  import type { Snippet } from "svelte";
  import type { Sign } from "./signdigital";
  import type { Searcher } from "./searcher.svelte";
  import { app } from "./store.svelte";
  import Thumb from "./Thumb.svelte";

  /* What a search found, shared by the Suchen tab and the search in a list.
     Only the button at the end of a row differs, so that is handed in. */
  let { search, action }: { search: Searcher; action: Snippet<[Sign]> } = $props();
</script>

{#if search.error}
  <p class="note error">{search.error}</p>
{:else if search.busy && search.results.length === 0}
  <p class="note">Suche …</p>
{:else if search.searched && search.results.length === 0}
  <p class="note">Keine Gebärde „{search.searched}“ gefunden.</p>
{/if}

{#if search.results.length > 0}
  <ul class="rows">
    {#each search.results as sign (sign.slug)}
      <li class="row">
        <button class="main" onclick={() => app.play(sign)}>
          <Thumb src={search.thumbs.get(sign.slug)} />
          <span class="name">{sign.name}</span>
        </button>
        {@render action(sign)}
      </li>
    {/each}
  </ul>

  {#if search.hasMore}
    <button class="button more" disabled={search.busy} onclick={() => search.more()}>
      {search.busy ? "Lädt …" : `Mehr anzeigen (${search.total - search.results.length} weitere)`}
    </button>
  {/if}
{/if}
