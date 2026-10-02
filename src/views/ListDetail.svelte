<script lang="ts">
  import { api } from "../lib/api";
  import type { List } from "../lib/lists";
  import type { Sign } from "../lib/signdigital";
  import { signCount } from "../lib/words";
  import { lists } from "../state/lists.svelte";
  import { nav } from "../state/nav.svelte";
  import { player } from "../state/player.svelte";
  import { Searcher } from "../state/searcher.svelte";
  import Icon from "../components/Icon.svelte";
  import SearchField from "../components/SearchField.svelte";
  import SearchResults from "../components/SearchResults.svelte";
  import ShareButton from "../components/ShareButton.svelte";
  import Thumb from "../components/Thumb.svelte";

  let { list }: { list: List } = $props();

  let editing = $state(false);
  let thumbs = $state.raw(new Map<string, string>());

  /* A search of the list's own: + puts a hit straight at the end of this list. */
  const search = new Searcher();
  let query = $state("");

  /* Pictures for the list. A list keeps slugs and names only; the pictures
     are looked up each time, because their links expire. */
  $effect(() => {
    const slugs = list.signs.map((s) => s.slug);
    let stale = false;
    api
      .signs(slugs)
      .then((signs) => api.cardLinks(signs))
      .then((found) => {
        if (!stale) thumbs = found;
      })
      .catch(() => {});
    return () => (stale = true);
  });

  const has = (sign: Sign) => list.signs.some((s) => s.slug === sign.slug);

  function remove() {
    const inside = list.signs.length === 0 ? "" : ` mit ${signCount(list.signs.length)}`;
    if (!confirm(`Liste „${list.name}“${inside} löschen?`)) return;
    nav.openList = null;
    lists.remove(list.id);
  }

  function rename() {
    const name = prompt("Neuer Name", list.name)?.trim();
    if (name) lists.rename(list.id, name);
  }
</script>

<div class="page">
  <div class="header">
    <button class="icon" aria-label="Zurück zu den Listen" onclick={() => (nav.openList = null)}><Icon name="back" /></button>
    <h1>{list.name}</h1>
    <ShareButton {list} />
    <button class="icon" class:on={editing} aria-label={editing ? "Fertig" : "Liste bearbeiten"} aria-pressed={editing} onclick={() => (editing = !editing)}>
      <Icon name={editing ? "check" : "gear"} />
    </button>
  </div>

  {#if !editing}
    <SearchField bind:value={query} placeholder="Gebärde hinzufügen" {search} />
    <SearchResults {search}>
      {#snippet action(sign: Sign)}
        {#if has(sign)}
          <span class="icon" aria-label="{sign.name} ist in der Liste"><Icon name="check" /></span>
        {:else}
          <button class="icon" aria-label="{sign.name} zu {list.name}" onclick={() => lists.addSigns(list.id, [sign])}>
            <Icon name="plus" />
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
        <button class="main" disabled={editing} onclick={() => player.play(sign, list.id)}>
          <Thumb src={thumbs.get(sign.slug)} />
          <span class="name">{sign.name}</span>
        </button>
        {#if editing}
          <button class="icon danger" aria-label="{sign.name} entfernen" onclick={() => lists.removeSign(list.id, sign.slug)}>
            <Icon name="close" />
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
</div>

<style>
  .on {
    color: var(--accent);
  }
</style>
