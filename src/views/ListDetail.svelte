<script lang="ts">
  import { api } from "../lib/api";
  import type { Lernliste } from "../lib/signdigital";
  import { nav } from "../state/nav.svelte";
  import { player } from "../state/player.svelte";
  import Icon from "../components/Icon.svelte";
  import Thumb from "../components/Thumb.svelte";

  let { list }: { list: Lernliste } = $props();

  let thumbs = $state.raw(new Map<string, string>());

  /* Pictures for the list, signed fresh each time, because their links expire. */
  $effect(() => {
    let stale = false;
    api
      .cardLinks(list.signs)
      .then((found) => {
        if (!stale) thumbs = found;
      })
      .catch(() => {});
    return () => (stale = true);
  });
</script>

<div class="page">
  <div class="header">
    <button class="icon" aria-label="Zurück zu den Listen" onclick={() => (nav.openList = null)}><Icon name="back" /></button>
    <h1>{list.name}</h1>
  </div>

  {#if list.signs.length === 0}
    <p class="note">Diese Lernliste ist leer. Füll sie auf sign-digital.de.</p>
  {/if}

  <ul class="rows">
    {#each list.signs as sign (sign.slug)}
      <li class="row">
        <button class="main" onclick={() => player.play(sign, list.id)}>
          <Thumb src={thumbs.get(sign.slug)} />
          <span class="name">{sign.name}</span>
        </button>
      </li>
    {/each}
  </ul>
</div>
