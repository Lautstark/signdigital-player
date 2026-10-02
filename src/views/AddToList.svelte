<script lang="ts">
  import type { SignRef } from "../signdigital";
  import { app } from "../store.svelte";

  let { sign, close }: { sign: SignRef; close: () => void } = $props();
  let newName = $state("");

  function into(id: string) {
    app.addToList(id, sign);
    close();
  }

  function create(e: SubmitEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    into(app.addList(name).id);
  }
</script>

<div class="scrim" role="presentation" onclick={close}></div>
<div class="sheet" role="dialog" aria-label="In eine Liste">
  <p class="sheet-title">„{sign.name}“ in eine Liste</p>
  <ul class="rows">
    {#each app.lists as list (list.id)}
      {@const inside = list.signs.some((s) => s.slug === sign.slug)}
      <li class="row">
        <button class="main" disabled={inside} onclick={() => into(list.id)}>
          <span class="name">{list.name}</span>
          {#if inside}<span class="count">schon drin</span>{/if}
        </button>
      </li>
    {/each}
  </ul>
  <form class="inline" onsubmit={create}>
    <input placeholder="Neue Liste" bind:value={newName} enterkeyhint="done" />
    <button class="button" type="submit">Anlegen</button>
  </form>
</div>
