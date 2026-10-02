<script lang="ts">
  import { app, type Tab } from "./store.svelte";
  import { GEAR } from "./icons";
  import ImportSheet from "./views/ImportSheet.svelte";
  import Search from "./views/Search.svelte";
  import Lists from "./views/Lists.svelte";
  import Settings from "./views/Settings.svelte";
  import Login from "./views/Login.svelte";
  import Player from "./views/Player.svelte";

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "search", label: "Suchen", icon: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4" },
    { id: "lists", label: "Listen", icon: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" },
    { id: "settings", label: "Einstellungen", icon: GEAR },
  ];

  /* The very first open has nothing to show but the login, so it gets the
     whole screen. Once there are lists, a logged-out app keeps its tabs and
     the login sits under Einstellungen. */
  const welcome = $derived(!app.loggedIn && app.lists.length === 0);
  const shown = $derived<Tab>(app.loggedIn ? app.tab : "settings");
</script>

{#if welcome}
  <main class="welcome">
    <div class="page">
      <Login />
    </div>
  </main>
{:else}
  <main>
    {#if shown === "search"}
      <Search />
    {:else if shown === "lists"}
      <Lists />
    {:else}
      <Settings />
    {/if}
  </main>

  <nav class="tabs">
    {#each tabs as t (t.id)}
      <button class:on={shown === t.id} aria-current={shown === t.id ? "page" : undefined} onclick={() => (app.tab = t.id)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={t.icon} /></svg>
        {t.label}
      </button>
    {/each}
  </nav>
{/if}

{#if app.importing}
  <ImportSheet />
{/if}

{#if app.playing}
  {#key app.playing.slug}
    <Player sign={app.playing} />
  {/key}
{/if}

<style>
  .welcome {
    display: flex;
    align-items: center;
    padding-bottom: 15dvh;
  }
  .welcome .page {
    width: 100%;
  }
</style>
