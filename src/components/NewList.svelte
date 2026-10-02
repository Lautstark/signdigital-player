<script lang="ts">
  import type { List } from "../lib/lists";
  import { lists } from "../state/lists.svelte";
  import Icon from "./Icon.svelte";

  /* The field that makes a list, under Listen and in the add-to-list sheet. */
  let { created }: { created?: (list: List) => void } = $props();
  let name = $state("");

  function create(e: SubmitEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const list = lists.add(trimmed);
    name = "";
    created?.(list);
  }
</script>

<form class="inline" onsubmit={create}>
  <input placeholder="Neue Liste" bind:value={name} enterkeyhint="done" />
  <button class="icon add" type="submit" aria-label="Liste anlegen"><Icon name="plus" /></button>
</form>

<style>
  .add {
    width: 46px;
    height: 46px;
    border-radius: 12px;
    color: var(--on-accent);
    background: var(--accent);
  }
</style>
