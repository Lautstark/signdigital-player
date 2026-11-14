<script lang="ts">
  import type { Searcher } from "../state/searcher.svelte";
  import Icon from "./Icon.svelte";

  let { value = $bindable(), placeholder, search }: { value: string; placeholder: string; search: Searcher } = $props();
  let input: HTMLInputElement;

  // The keyboard stays up: the × never takes focus, and the field gets it back
  // in case the tap blurred it anyway.
  function clear() {
    value = "";
    search.now("");
    input.focus();
  }
</script>

<form class="field" role="search" onsubmit={(e) => (e.preventDefault(), search.now(value))}>
  <Icon name="search" />
  <input
    bind:this={input}
    type="search"
    {placeholder}
    autocomplete="off"
    autocapitalize="off"
    enterkeyhint="search"
    bind:value
    oninput={() => search.typed(value)}
  />
  {#if value}
    <button type="button" class="clear" aria-label="Suche leeren" onpointerdown={(e) => e.preventDefault()} onclick={clear}>
      <Icon name="close" />
    </button>
  {/if}
</form>

<style>
  .field {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 14px;
    height: 52px;
    border-radius: 14px;
    background: var(--plane-1);
    border: 1px solid var(--line);
    margin: 8px 0 12px;
    color: var(--text-3);
  }
  .field :global(svg) {
    flex-shrink: 0;
  }
  .field:focus-within {
    border-color: var(--accent);
  }
  input {
    flex: 1;
    min-width: 0;
    height: 100%;
    border: 0;
    background: none;
    font: inherit;
    font-size: 18px;
    color: var(--text);
    outline: none;
  }
  input::-webkit-search-cancel-button {
    display: none;
  }
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
</style>
