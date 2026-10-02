<script lang="ts">
  import { app, type List } from "../store.svelte";
  import { listFromLink, newSigns, sameSigns, shareLink } from "../share";
  import { appUrl, isApple, isInstalled } from "../platform";
  import Sheet from "../Sheet.svelte";

  const PREVIEW = 8;
  const list = $derived(app.importing?.list ?? null);

  /* The same list may be here already: imported before, or shared back. Then
     the sheet offers its new signs rather than a second copy. */
  const existing = $derived(list ? app.findShared(list) : null);
  const fresh = $derived(list ? (existing ? newSigns(existing.signs, list.signs) : list.signs) : []);
  const differs = $derived(!!list && !!existing && !sameSigns(existing.signs, list.signs));

  const count = (n: number) => (n === 1 ? "1 Gebärde" : `${n} Gebärden`);

  /* An iPhone opens every link in Safari, never in the app on the home
     screen, and the two keep separate lists. So Safari offers the link to
     copy, and the app takes it from "Liste importieren". */
  const handOver = isApple && !isInstalled;

  let pasted = $state("");
  let copied = $state(false);
  const wrong = $derived(pasted.trim() !== "" && listFromLink(pasted) === null);

  function close() {
    app.importing = null;
  }

  function paste() {
    const found = listFromLink(pasted);
    if (found) app.importing = { list: found };
  }

  function show(made: List) {
    app.tab = "lists";
    app.openList = made.id;
    close();
  }

  function take() {
    if (list) show(app.importList(list));
  }

  function addFresh() {
    if (!existing) return;
    app.addSigns(existing.id, fresh);
    show(existing);
  }

  function replace() {
    if (!list || !existing) return;
    const lost = newSigns(list.signs, existing.signs).length;
    const loses = lost === 0 ? "" : ` ${count(lost)}, die nur bei dir drin ${lost === 1 ? "ist, fällt" : "sind, fallen"} raus.`;
    if (!confirm(`„${existing.name}“ durch die geteilte Liste ersetzen?${loses}`)) return;
    app.replaceSigns(existing.id, list);
    show(existing);
  }

  async function copy() {
    if (!list) return;
    await navigator.clipboard.writeText(shareLink(list, appUrl)).catch(() => {});
    copied = true;
  }
</script>

{#snippet already(here: List)}
  {here.name === list?.name ? "Hast du schon." : `Hast du schon als „${here.name}“.`}
{/snippet}

{#snippet chips(signs: { slug: string; name: string }[], added: boolean)}
  <ul class="chips" class:added>
    {#each signs.slice(0, PREVIEW) as sign (sign.slug)}
      <li>{added ? "+ " : ""}{sign.name}</li>
    {/each}
    {#if signs.length > PREVIEW}<li>…</li>{/if}
  </ul>
{/snippet}

{#if list}
  <Sheet title="Liste „{list.name}“" {close}>
    {#if handOver || !existing}
      <p class="note">{count(list.signs.length)}</p>
      {@render chips(list.signs, false)}
    {:else if fresh.length > 0}
      <p class="note">{@render already(existing)} {fresh.length === 1 ? "1 Gebärde ist neu:" : `${fresh.length} Gebärden sind neu:`}</p>
      {@render chips(fresh, true)}
    {:else}
      <p class="note">{@render already(existing)} Alle Gebärden sind schon drin.</p>
    {/if}

    {#if handOver}
      <button class="button primary wide" onclick={copy}>{copied ? "Link kopiert" : "Link kopieren"}</button>
      <p class="note faint">Dann in der App unter Listen auf „Liste importieren“.</p>
    {:else if !existing}
      <button class="button primary wide" onclick={take}>Übernehmen</button>
    {:else}
      {#if fresh.length > 0}
        <button class="button primary wide" onclick={addFresh}>{fresh.length === 1 ? "1 neue hinzufügen" : `${fresh.length} neue hinzufügen`}</button>
      {:else}
        <button class="button primary wide" onclick={() => show(existing)}>Liste öffnen</button>
      {/if}
      {#if differs}<button class="button wide" onclick={replace}>Ersetzen</button>{/if}
      <button class="button wide" onclick={take}>Als eigene Liste</button>
    {/if}
    <button class="text wide" onclick={close}>Abbrechen</button>
  </Sheet>
{:else}
  <Sheet title="Liste importieren" {close}>
    <!-- svelte-ignore a11y_autofocus -->
    <input
      class="wide link"
      type="url"
      placeholder="lautstark.tech/signdigital-player/#liste=…"
      autocomplete="off"
      autofocus
      bind:value={pasted}
      oninput={paste}
    />
    {#if wrong}<p class="note error">Das ist kein Link zu einer Liste.</p>{/if}
    <button class="text wide" onclick={close}>Abbrechen</button>
  </Sheet>
{/if}

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
  .wide {
    display: block;
    width: 100%;
  }
  .button.wide + .button.wide {
    margin-top: 8px;
  }
  .link {
    font-size: 15px;
  }
  .text.wide {
    margin-top: 8px;
  }
</style>
