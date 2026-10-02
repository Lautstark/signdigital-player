<script lang="ts">
  import type { Searcher } from "./searcher.svelte";

  let { value = $bindable(), placeholder, search }: { value: string; placeholder: string; search: Searcher } = $props();

  function clear() {
    value = "";
    search.now("");
  }
</script>

<form class="field" role="search" onsubmit={(e) => (e.preventDefault(), search.now(value))}>
  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
  <input
    type="search"
    {placeholder}
    autocomplete="off"
    autocapitalize="off"
    enterkeyhint="search"
    bind:value
    oninput={() => search.typed(value)}
  />
  {#if value}
    <button type="button" class="clear" aria-label="Suche leeren" onclick={clear}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
    </button>
  {/if}
</form>

<style>
  .clear {
    border: 0;
    background: none;
    color: var(--text-3);
    width: 36px;
    height: 36px;
    margin-right: -8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  input::-webkit-search-cancel-button {
    display: none;
  }
</style>
