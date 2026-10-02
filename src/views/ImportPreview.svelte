<script lang="ts">
  import type { List } from "../lib/lists";
  import { appUrl, isApple, isInstalled } from "../lib/platform";
  import { newSigns, sameSigns, shareLink, type SharedList } from "../lib/share";
  import type { SignRef } from "../lib/signdigital";
  import { signCount } from "../lib/words";
  import { lists } from "../state/lists.svelte";
  import { nav } from "../state/nav.svelte";
  import Sheet from "../components/Sheet.svelte";

  let { list, close }: { list: SharedList; close: () => void } = $props();

  const PREVIEW = 8;

  /* The same list may be here already: imported before, or shared back. Then
     the sheet offers its new signs rather than a second copy. */
  const existing = $derived(lists.findShared(list));
  const fresh = $derived(existing ? newSigns(existing.signs, list.signs) : list.signs);
  const differs = $derived(!!existing && !sameSigns(existing.signs, list.signs));

  /* An iPhone opens every link in Safari, never in the app on the home
     screen, and the two keep separate lists. So Safari offers the link to
     copy, and the app takes it from "Liste importieren". */
  const handOver = isApple && !isInstalled;
  let copied = $state(false);

  function show(target: List) {
    nav.showList(target.id);
    close();
  }

  function addFresh(target: List) {
    lists.addSigns(target.id, fresh);
    show(target);
  }

  function replace(target: List) {
    const lost = newSigns(list.signs, target.signs).length;
    const loses = lost === 0 ? "" : ` ${signCount(lost)}, die nur bei dir drin ${lost === 1 ? "ist, fällt" : "sind, fallen"} raus.`;
    if (!confirm(`„${target.name}“ durch die geteilte Liste ersetzen?${loses}`)) return;
    lists.replaceSigns(target.id, list);
    show(target);
  }

  async function copy() {
    await navigator.clipboard.writeText(shareLink(list, appUrl)).catch(() => {});
    copied = true;
  }
</script>

{#snippet chips(signs: SignRef[], added: boolean)}
  <ul class="chips" class:added>
    {#each signs.slice(0, PREVIEW) as sign (sign.slug)}
      <li>{added ? "+ " : ""}{sign.name}</li>
    {/each}
    {#if signs.length > PREVIEW}<li>…</li>{/if}
  </ul>
{/snippet}

<Sheet title="Liste „{list.name}“" {close}>
  {#if handOver || !existing}
    <p class="note">{signCount(list.signs.length)}</p>
    {@render chips(list.signs, false)}
  {:else}
    {@const already = existing.name === list.name ? "Hast du schon." : `Hast du schon als „${existing.name}“.`}
    {#if fresh.length > 0}
      <p class="note">{already} {fresh.length === 1 ? "1 Gebärde ist neu:" : `${fresh.length} Gebärden sind neu:`}</p>
      {@render chips(fresh, true)}
    {:else}
      <p class="note">{already} Alle Gebärden sind schon drin.</p>
    {/if}
  {/if}

  {#if handOver}
    <button class="button primary" onclick={copy}>{copied ? "Link kopiert" : "Link kopieren"}</button>
    <p class="note faint">Dann in der App unter Listen auf „Liste importieren“.</p>
  {:else if !existing}
    <button class="button primary" onclick={() => show(lists.importShared(list))}>Übernehmen</button>
  {:else}
    {#if fresh.length > 0}
      <button class="button primary" onclick={() => addFresh(existing)}>{fresh.length === 1 ? "1 neue hinzufügen" : `${fresh.length} neue hinzufügen`}</button>
    {:else}
      <button class="button primary" onclick={() => show(existing)}>Liste öffnen</button>
    {/if}
    {#if differs}<button class="button" onclick={() => replace(existing)}>Ersetzen</button>{/if}
    <button class="button" onclick={() => show(lists.importShared(list))}>Als eigene Liste</button>
  {/if}
  <button class="text" onclick={close}>Abbrechen</button>
</Sheet>

<style>
  .chips {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0 0 16px;
    padding: 0;
  }
  .chips li {
    padding: 4px 10px;
    border-radius: 8px;
    background: var(--plane-2);
    font-size: 15px;
  }
  .chips.added li {
    color: var(--accent);
  }
  button {
    display: block;
    width: 100%;
  }
  button + button,
  .text {
    margin-top: 8px;
  }
</style>
