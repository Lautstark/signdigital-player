<script lang="ts">
  import { lists } from "../state/lists.svelte";
  import { nav } from "../state/nav.svelte";
  import Icon from "../components/Icon.svelte";

  /* The lists live in the account; each visit asks again, and the kept copy
     stands until the answer is there. */
  lists.load();
</script>

<div class="page">
  <h1>Listen</h1>

  {#if lists.error}
    <p class="note error">
      {lists.all.length > 0 ? `Nicht neu geladen (${lists.error}). Hier steht der letzte Stand.` : lists.error}
    </p>
  {/if}

  {#if lists.all.length === 0}
    <p class="note">
      {lists.busy ? "Lädt …" : "In deinem Konto gibt es noch keine Lernliste. Leg eine auf sign-digital.de an, dann steht sie hier."}
    </p>
  {/if}

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

  <p class="note">Listen legst du auf sign-digital.de als Lernliste an und änderst sie dort.</p>
  <button class="button reload" disabled={lists.busy} onclick={() => lists.load()}>
    {lists.busy ? "Lädt …" : "Neu laden"}
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
  .reload {
    display: block;
    width: 100%;
    margin-top: 12px;
  }
</style>
