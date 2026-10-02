<script lang="ts">
  import { ICONS, type IconName } from "../lib/icons";

  let { name, filled = false }: { name: IconName; filled?: boolean } = $props();
</script>

<svg viewBox="0 0 24 24" class:filled aria-hidden="true"><path d={ICONS[name]} /></svg>

<style>
  .filled {
    fill: currentColor;
    stroke: none;
  }
</style>
