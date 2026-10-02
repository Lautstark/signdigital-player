<script lang="ts">
  import { app, type Tab } from "./store.svelte";
  import Search from "./views/Search.svelte";
  import Lists from "./views/Lists.svelte";
  import Account from "./views/Account.svelte";
  import Player from "./views/Player.svelte";

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "search", label: "Suchen", icon: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4" },
    { id: "lists", label: "Listen", icon: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" },
    { id: "account", label: "Konto", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20a8 8 0 0 1 16 0" },
  ];

  /* Without a login only the Konto tab has anything to show. */
  const shown = $derived<Tab>(app.loggedIn ? app.tab : "account");
</script>

<main>
  {#if shown === "search"}
    <Search />
  {:else if shown === "lists"}
    <Lists />
  {:else}
    <Account />
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

{#if app.playing}
  {#key app.playing.slug}
    <Player sign={app.playing} />
  {/key}
{/if}
