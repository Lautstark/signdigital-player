<script lang="ts">
  import type { Snippet } from "svelte";

  /* A panel from the bottom over a dimmed page; tapping the page closes it. */
  let { title, close, children }: { title: string; close: () => void; children: Snippet } = $props();
</script>

<div class="scrim" role="presentation" onclick={close}></div>
<div class="sheet" role="dialog" aria-label={title}>
  <p class="sheet-title">{title}</p>
  {@render children()}
</div>
