<script lang="ts">
  import type { Lernliste } from "../lib/signdigital";
  import { lists } from "../state/lists.svelte";
  import Icon from "./Icon.svelte";

  /* The field that makes a Lernliste in the account, under Listen and in the
     add-to-list sheet. The name stays in the field until the site has the list. */
  let { created }: { created?: (list: Lernliste) => void } = $props();
  let name = $state("");

  async function create(e: SubmitEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const list = await lists.create(trimmed);
    if (!list) return;
    name = "";
    created?.(list);
  }
</script>

<form class="inline" onsubmit={create}>
  <input placeholder="Neue Liste" bind:value={name} enterkeyhint="done" />
  <button class="icon add" type="submit" disabled={lists.busy} aria-label="Liste anlegen"><Icon name="plus" /></button>
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
