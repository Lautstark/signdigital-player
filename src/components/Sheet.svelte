<script lang="ts">
  import type { Snippet } from "svelte";

  /* A panel from the bottom over a dimmed page; tapping the page closes it. */
  let { title, close, children }: { title: string; close: () => void; children: Snippet } = $props();
</script>

<div class="scrim" role="presentation" onclick={close}></div>
<div class="sheet" role="dialog" aria-label={title}>
  <p class="title">{title}</p>
  {@render children()}
</div>

<style>
  .scrim {
    position: fixed;
    inset: 0;
    background: rgb(0 0 0 / 0.4);
    z-index: 5;
  }
  .sheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 6;
    max-height: 80dvh;
    overflow-y: auto;
    background: var(--plane-0);
    border-radius: 18px 18px 0 0;
    padding: 16px 16px calc(env(safe-area-inset-bottom) + 16px);
  }
  .title {
    font-weight: 600;
    margin: 4px 0 8px;
  }
</style>
