<script lang="ts">
  import { app, type List } from "./store.svelte";

  /* The field that makes a list, under Listen and in the add-to-list sheet. */
  let { created }: { created?: (list: List) => void } = $props();
  let name = $state("");

  function create(e: SubmitEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const list = app.addList(trimmed);
    name = "";
    created?.(list);
  }
</script>

<form class="inline" onsubmit={create}>
  <input placeholder="Neue Liste" bind:value={name} enterkeyhint="done" />
  <button class="icon filled" type="submit" aria-label="Liste anlegen">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
  </button>
</form>
