<script lang="ts">
  import type { SignRef } from "../signdigital";
  import { app } from "../store.svelte";
  import Sheet from "../Sheet.svelte";
  import NewList from "../NewList.svelte";

  let { sign, close }: { sign: SignRef; close: () => void } = $props();

  function into(id: string) {
    app.addToList(id, sign);
    close();
  }
</script>

<Sheet title="„{sign.name}“ in eine Liste" {close}>
  <ul class="rows">
    {#each app.lists as list (list.id)}
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
