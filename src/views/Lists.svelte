<script lang="ts">
  import type { Sign } from "../signdigital";
  import { api, app } from "../store.svelte";
  import { thumbnails } from "../thumbs";
  import Thumb from "../Thumb.svelte";
  import SearchField from "../SearchField.svelte";
  import SearchResults from "../SearchResults.svelte";
  import { Searcher } from "../searcher.svelte";
  import NewList from "../NewList.svelte";
  import { listFromLink, shareLink } from "../share";
  import { appUrl, isApple } from "../platform";
  import { GEAR } from "../icons";

  let editing = $state(false);
  let thumbs = $state.raw(new Map<string, string>());

  /* A search of the list's own: + puts a hit straight at the end of this list. */
  const search = new Searcher();
  let query = $state("");

  function leave() {
    app.openList = null;
    editing = false;
    query = "";
    search.now("");
  }

  const list = $derived(app.lists.find((l) => l.id === app.openList) ?? null);

  /* The phone's own share menu, which has "Kopieren" in it too. A browser
     without one gets the link copied instead. */
  let copied = $state(false);
  async function share() {
    if (!list) return;
    const url = shareLink(list, appUrl);
    if (navigator.share) {
      await navigator.share({ title: list.name, text: `Gebärden-Liste „${list.name}“`, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      copied = true;
      setTimeout(() => (copied = false), 2000);
    }
  }

  /* The clipboard is read inside the tap, which is the only time iOS allows
     it (and then asks with "Einsetzen"). Without a list link in it, the sheet
     asks for one. */
  function openImport() {
    app.importing = { list: null };
    navigator.clipboard
      ?.readText()
      .then((text) => {
        const found = listFromLink(text);
        if (found && app.importing && !app.importing.list) app.importing = { list: found };
      })
      .catch(() => {});
  }

  /* Pictures for the open list. A list keeps slugs and names only; the
     pictures are looked up each time, because their links expire. */
  $effect(() => {
    const slugs = list?.signs.map((s) => s.slug) ?? [];
    let stale = false;
    (async () => {
      const signs = (await Promise.all(slugs.map((s) => api.sign(s).catch(() => null)))).filter(
        (s): s is Sign => s !== null,
      );
      const found = await thumbnails(signs).catch(() => new Map<string, string>());
      if (!stale) thumbs = found;
    })();
    return () => (stale = true);
  });

  function remove() {
    if (!list) return;
    const n = list.signs.length;
    const inside = n === 0 ? "" : n === 1 ? " mit einer Gebärde" : ` mit ${n} Gebärden`;
    if (!confirm(`Liste „${list.name}“${inside} löschen?`)) return;
    app.deleteList(list.id);
    leave();
  }

  function rename() {
    if (!list) return;
    const name = prompt("Neuer Name", list.name)?.trim();
    if (name) app.renameList(list.id, name);
  }
</script>

<div class="page">
  {#if list}
    <div class="header">
      <button class="icon" aria-label="Zurück zu den Listen" onclick={leave}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
      </button>
      <h1>{list.name}</h1>
      <button class="icon" aria-label={copied ? "Link kopiert" : "Liste teilen"} onclick={share}>
        {#if copied}
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
        {:else if isApple}
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4M6 11H5v10h14V11h-1" /></svg>
        {:else}
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" /></svg>
        {/if}
      </button>
      <button class="icon" class:on={editing} aria-label={editing ? "Fertig" : "Liste bearbeiten"} aria-pressed={editing} onclick={() => (editing = !editing)}>
        {#if editing}
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
        {:else}
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d={GEAR} /></svg>
        {/if}
      </button>
    </div>

    {#if !editing}
      <SearchField bind:value={query} placeholder="Gebärde hinzufügen" {search} />

      <SearchResults {search}>
        {#snippet action(sign: Sign)}
          {#if list.signs.some((s) => s.slug === sign.slug)}
            <span class="icon" aria-label="{sign.name} ist in der Liste">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
            </span>
          {:else}
            <button class="icon" aria-label="{sign.name} zu {list.name}" onclick={() => app.addToList(list.id, sign)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            </button>
          {/if}
        {/snippet}
      </SearchResults>
      {#if search.results.length > 0}
        <p class="section">In der Liste</p>
      {/if}
    {/if}

    {#if list.signs.length === 0}
      <p class="note">Noch leer. Such oben eine Gebärde und leg sie mit + hinein.</p>
    {/if}

    <ul class="rows">
      {#each list.signs as sign (sign.slug)}
        <li class="row">
          <button class="main" disabled={editing} onclick={() => app.play(sign, list.id)}>
            <Thumb src={thumbs.get(sign.slug)} />
            <span class="name">{sign.name}</span>
          </button>
          {#if editing}
            <button class="icon danger" aria-label="{sign.name} entfernen" onclick={() => app.removeFromList(list.id, sign.slug)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          {/if}
        </li>
      {/each}
    </ul>

    {#if editing}
      <div class="actions">
        <button class="button" onclick={rename}>Umbenennen</button>
        <button class="button danger" onclick={remove}>Liste löschen</button>
      </div>
    {/if}
  {:else}
    <h1>Listen</h1>
    <ul class="rows">
      {#each app.lists as l (l.id)}
        <li class="row">
          <button class="main" onclick={() => (app.openList = l.id)}>
            <span class="name">{l.name}</span>
            <span class="count">{l.signs.length}</span>
            <svg class="chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </li>
      {/each}
    </ul>
    <NewList />
    <button class="button import" onclick={openImport}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M8 11l4 4 4-4M5 21h14" /></svg>
      Liste importieren
    </button>
  {/if}
</div>

<style>
  .icon.on {
    color: var(--accent);
  }
  .import {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    margin-top: 12px;
  }
</style>
