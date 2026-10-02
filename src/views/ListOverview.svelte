<script lang="ts">
  import { listFromLink } from "../lib/share";
  import { lists } from "../state/lists.svelte";
  import { nav } from "../state/nav.svelte";
  import Icon from "../components/Icon.svelte";
  import NewList from "../components/NewList.svelte";

  /* The clipboard is read inside the tap, which is the only time iOS allows
     it (and then asks with "Einsetzen"). Without a list link in it, the sheet
     asks for one. */
  function openImport() {
    nav.importing = { list: null };
    navigator.clipboard
      ?.readText()
      .then((text) => {
        const found = listFromLink(text);
        if (found && nav.importing && !nav.importing.list) nav.importing = { list: found };
      })
      .catch(() => {});
  }
</script>

<div class="page">
  <h1>Listen</h1>
  <ul class="rows">
    {#each lists.all as list (list.id)}
      <li class="row">
        <button class="main" onclick={() => (nav.openList = list.id)}>
          <span class="name">{list.name}</span>
          <span class="count">{list.signs.length}</span>
          <span class="chevron"><Icon name="forward" /></span>
        </button>
      </li>
    {/each}
  </ul>
  <NewList />
  <button class="button import" onclick={openImport}>
    <Icon name="download" />
    Liste importieren
  </button>
</div>

<style>
  .chevron {
    display: flex;
    color: var(--text-3);
  }
  .chevron :global(svg) {
    width: 18px;
    height: 18px;
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
