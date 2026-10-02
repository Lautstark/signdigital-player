<script lang="ts">
  import type { IconName } from "./lib/icons";
  import { lists } from "./state/lists.svelte";
  import { nav, type Tab } from "./state/nav.svelte";
  import { player } from "./state/player.svelte";
  import { session } from "./state/session.svelte";
  import Icon from "./components/Icon.svelte";
  import ImportSheet from "./views/ImportSheet.svelte";
  import Lists from "./views/Lists.svelte";
  import Login from "./views/Login.svelte";
  import Player from "./views/Player.svelte";
  import Search from "./views/Search.svelte";
  import Settings from "./views/Settings.svelte";

  const tabs: { id: Tab; label: string; icon: IconName }[] = [
    { id: "search", label: "Suchen", icon: "search" },
    { id: "lists", label: "Listen", icon: "list" },
    { id: "settings", label: "Einstellungen", icon: "gear" },
  ];

  /* The very first open has nothing to show but the login, so it gets the
     whole screen. Once there are lists, a logged-out app keeps its tabs and
     the login sits under Einstellungen. */
  const welcome = $derived(!session.loggedIn && lists.all.length === 0);
  const shown = $derived<Tab>(session.loggedIn ? nav.tab : "settings");
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
      <button class:on={shown === t.id} aria-current={shown === t.id ? "page" : undefined} onclick={() => (nav.tab = t.id)}>
        <Icon name={t.icon} />
        {t.label}
      </button>
    {/each}
  </nav>
{/if}

{#if nav.importing}
  <ImportSheet />
{/if}

{#if player.playing}
  {#key player.playing.slug}
    <Player sign={player.playing} />
  {/key}
{/if}

<style>
  .welcome {
    justify-content: center;
    padding-bottom: 15dvh;
  }
  .tabs {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    background: var(--plane-0);
    border-top: 1px solid var(--line);
    padding-bottom: env(safe-area-inset-bottom);
  }
  .tabs button {
    flex: 1;
    border: 0;
    background: none;
    padding: 8px 0 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    font-size: 12px;
    color: var(--text-3);
  }
  .tabs button.on {
    color: var(--accent);
  }
</style>
