<script lang="ts">
  import type { IconName } from "./lib/icons";
  import { nav, type Tab } from "./state/nav.svelte";
  import { player } from "./state/player.svelte";
  import { session } from "./state/session.svelte";
  import Icon from "./components/Icon.svelte";
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

  /* Search, lists and videos all need the login, so without one it gets the
     whole screen. */
  const welcome = $derived(!session.loggedIn);
</script>

{#if welcome}
  <main class="welcome">
    <div class="page">
      <Login />
    </div>
  </main>
{:else}
  <main>
    {#if nav.tab === "search"}
      <Search />
    {:else if nav.tab === "lists"}
      <Lists />
    {:else}
      <Settings />
    {/if}
  </main>

  <nav class="tabs">
    {#each tabs as t (t.id)}
      <button class:on={nav.tab === t.id} aria-current={nav.tab === t.id ? "page" : undefined} onclick={() => (nav.tab = t.id)}>
        <Icon name={t.icon} />
        {t.label}
      </button>
    {/each}
  </nav>
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
