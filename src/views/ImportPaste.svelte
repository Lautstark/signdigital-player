<script lang="ts">
  import { listFromLink } from "../lib/share";
  import { nav } from "../state/nav.svelte";
  import Sheet from "../components/Sheet.svelte";

  let { close }: { close: () => void } = $props();

  let pasted = $state("");
  const wrong = $derived(pasted.trim() !== "" && listFromLink(pasted) === null);

  function paste() {
    const found = listFromLink(pasted);
    if (found) nav.importing = { list: found };
  }
</script>

<Sheet title="Liste importieren" {close}>
  <!-- svelte-ignore a11y_autofocus -->
  <input
    type="url"
    placeholder="lautstark.tech/signdigital-player/#liste=…"
    autocomplete="off"
    autofocus
    bind:value={pasted}
    oninput={paste}
  />
  {#if wrong}<p class="note error">Das ist kein Link zu einer Liste.</p>{/if}
  <button class="text" onclick={close}>Abbrechen</button>
</Sheet>

<style>
  input,
  button {
    display: block;
    width: 100%;
  }
  input {
    font-size: 15px;
  }
  button {
    margin-top: 8px;
  }
</style>
