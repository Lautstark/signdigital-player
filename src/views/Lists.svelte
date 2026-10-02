<script lang="ts">
  import { lists } from "../state/lists.svelte";
  import { nav } from "../state/nav.svelte";
  import ListDetail from "./ListDetail.svelte";
  import ListOverview from "./ListOverview.svelte";

  const open = $derived(lists.get(nav.openList));
</script>

{#if open}
  {#key open.id}
    <ListDetail list={open} />
  {/key}
{:else}
  <ListOverview />
{/if}
