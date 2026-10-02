<script lang="ts">
  import type { Sign } from "../signdigital";
  import { api, app } from "../store.svelte";
  import { thumbnails } from "../thumbs";
  import Thumb from "../Thumb.svelte";

  let newName = $state("");
  let editing = $state(false);
  let thumbs = $state.raw(new Map<string, string>());

  const list = $derived(app.lists.find((l) => l.id === app.openList) ?? null);

  function create(e: SubmitEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    app.addList(name);
    newName = "";
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
    if (!confirm(`Liste „${list.name}“ löschen?`)) return;
    app.deleteList(list.id);
    app.openList = null;
    editing = false;
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
      <button class="icon" aria-label="Zurück zu den Listen" onclick={() => ((app.openList = null), (editing = false))}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
      </button>
      <h1>{list.name}</h1>
      <button class="text" onclick={() => (editing = !editing)}>{editing ? "Fertig" : "Bearbeiten"}</button>
    </div>

    {#if list.signs.length === 0}
      <p class="note">Noch leer. Unter Suchen legst du Gebärden mit + hier hinein.</p>
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
    <form class="inline" onsubmit={create}>
      <input placeholder="Neue Liste" bind:value={newName} enterkeyhint="done" />
      <button class="button" type="submit">Anlegen</button>
    </form>
  {/if}
</div>
