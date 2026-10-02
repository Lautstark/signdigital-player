<script lang="ts">
  import type { Sign, SignRef } from "../signdigital";
  import { api, app } from "../store.svelte";
  import { thumbnails } from "../thumbs";
  import Thumb from "../Thumb.svelte";
  import AddToList from "./AddToList.svelte";

  let results = $state.raw<Sign[]>([]);
  let thumbs = $state.raw(new Map<string, string>());
  let busy = $state(false);
  let error = $state<string | null>(null);
  let adding = $state.raw<SignRef | null>(null);
  let searched = $state("");

  /* Each run carries a number, so a slow answer to an old word cannot
     overwrite the answer to the word now in the field. */
  let run = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function typed() {
    clearTimeout(timer);
    timer = setTimeout(search, 350);
  }

  async function search() {
    const query = app.query.trim();
    const mine = ++run;
    if (!query) {
      results = [];
      searched = "";
      return;
    }
    busy = true;
    error = null;
    try {
      const found = await api.search(query);
      if (mine !== run) return;
      results = found;
      searched = query;
      thumbs = await thumbnails(found);
    } catch (e) {
      if (mine === run) error = e instanceof Error ? e.message : String(e);
    } finally {
      if (mine === run) busy = false;
    }
  }

  // Coming back to the tab with a word still in the field shows its results again.
  if (app.query.trim()) search();
</script>

<div class="page">
  <form class="field" role="search" onsubmit={(e) => (e.preventDefault(), search())}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
    <input
      type="search"
      placeholder="Gebärde suchen"
      autocomplete="off"
      autocapitalize="off"
      enterkeyhint="search"
      bind:value={app.query}
      oninput={typed}
    />
  </form>

  {#if error}
    <p class="note error">{error}</p>
  {:else if busy && results.length === 0}
    <p class="note">Suche …</p>
  {:else if searched && results.length === 0}
    <p class="note">Keine Gebärde „{searched}“ gefunden.</p>
  {/if}

  <ul class="rows">
    {#each results as sign (sign.slug)}
      <li class="row">
        <button class="main" onclick={() => app.play(sign)}>
          <Thumb src={thumbs.get(sign.slug)} />
          <span class="name">{sign.name}</span>
        </button>
        <button class="icon" aria-label="{sign.name} in eine Liste" onclick={() => (adding = sign)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      </li>
    {/each}
  </ul>

  {#if !searched && !busy}
    <p class="note faint">Vorerst findet die Suche nur das genaue Wort, wie „schmutzig“ oder „Zähne putzen“.</p>
  {/if}
</div>

{#if adding}
  <AddToList sign={adding} close={() => (adding = null)} />
{/if}
