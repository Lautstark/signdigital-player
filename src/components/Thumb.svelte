<script lang="ts">
  /* The card picture beside a sign, from a link that was fetched with it.
     Cards are portrait (320 × 492), so the box is too and the whole card shows.
     A missing picture is an empty box, never a broken-image icon. */
  let { src }: { src: string | null | undefined } = $props();
  let failed = $state(false);
</script>

<span class="thumb" aria-hidden="true">
  {#if src && !failed}
    <img {src} alt="" loading="lazy" onerror={() => (failed = true)} />
  {/if}
</span>

<style>
  .thumb {
    width: 52px;
    height: 80px;
    flex-shrink: 0;
    border-radius: 6px;
    background: var(--plane-2);
    overflow: hidden;
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
</style>
