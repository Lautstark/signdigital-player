<script lang="ts">
  import { nav } from "../state/nav.svelte";
  import ImportPaste from "./ImportPaste.svelte";
  import ImportPreview from "./ImportPreview.svelte";

  /* "Liste importieren" asks for a link until it has a list to show. */
  const list = $derived(nav.importing?.list ?? null);
  const close = () => (nav.importing = null);
</script>

{#if list}
  <ImportPreview {list} {close} />
{:else}
  <ImportPaste {close} />
{/if}
