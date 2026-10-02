<script lang="ts">
  import { app } from "../store.svelte";
  import { listFromLink, shareLink } from "../share";
  import { appUrl, isApple, isInstalled } from "../platform";
  import Sheet from "../Sheet.svelte";

  const PREVIEW = 8;
  const list = $derived(app.importing?.list ?? null);

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

  function take() {
    if (!list) return;
    const made = app.importList(list);
    app.tab = "lists";
    app.openList = made.id;
    close();
  }

  async function copy() {
    if (!list) return;
    await navigator.clipboard.writeText(shareLink(list, appUrl)).catch(() => {});
    copied = true;
  }
</script>

{#if list}
  <Sheet title="Liste „{list.name}“" {close}>
    <p class="note">{list.signs.length === 1 ? "1 Gebärde" : `${list.signs.length} Gebärden`}</p>
    <ul class="chips">
      {#each list.signs.slice(0, PREVIEW) as sign (sign.slug)}
        <li>{sign.name}</li>
      {/each}
      {#if list.signs.length > PREVIEW}<li>…</li>{/if}
    </ul>
    {#if handOver}
      <button class="button primary wide" onclick={copy}>{copied ? "Link kopiert" : "Link kopieren"}</button>
      <p class="note faint">Dann in der App unter Listen auf „Liste importieren“.</p>
    {:else}
      <button class="button primary wide" onclick={take}>Übernehmen</button>
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
  .wide {
    display: block;
    width: 100%;
  }
  .link {
    font-size: 15px;
  }
  .text.wide {
    margin-top: 8px;
  }
</style>
