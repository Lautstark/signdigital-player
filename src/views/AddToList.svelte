<script lang="ts">
  import type { SignRef } from "../lib/signdigital";
  import { lists } from "../state/lists.svelte";
  import NewList from "../components/NewList.svelte";
  import Sheet from "../components/Sheet.svelte";

  let { sign, close }: { sign: SignRef; close: () => void } = $props();

  function into(id: string) {
    lists.addSigns(id, [sign]);
    close();
  }
</script>

<Sheet title="„{sign.name}“ in eine Liste" {close}>
  <ul class="rows">
    {#each lists.all as list (list.id)}
      {@const inside = list.signs.some((s) => s.slug === sign.slug)}
      <li class="row">
        <button class="main" disabled={inside} onclick={() => into(list.id)}>
          <span class="name">{list.name}</span>
          {#if inside}<span class="count">schon drin</span>{/if}
        </button>
      </li>
    {/each}
  </ul>
  <NewList created={(list) => into(list.id)} />
</Sheet>
