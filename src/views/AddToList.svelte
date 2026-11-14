<script lang="ts">
  import type { Sign } from "../lib/signdigital";
  import { lists } from "../state/lists.svelte";
  import NewList from "../components/NewList.svelte";
  import Sheet from "../components/Sheet.svelte";

  let { sign, close }: { sign: Sign; close: () => void } = $props();

  async function into(id: string) {
    await lists.addSign(id, sign);
    if (!lists.error) close();
  }
</script>

<Sheet title="„{sign.name}“ in eine Liste" {close}>
  {#if lists.error}
    <p class="note error">{lists.error}</p>
  {/if}
  <ul class="rows">
    {#each lists.all as list (list.id)}
      {@const inside = list.signs.some((s) => s.id === sign.id)}
      <li class="row">
        <button class="main" disabled={inside || lists.busy} onclick={() => into(list.id)}>
          <span class="name">{list.name}</span>
          {#if inside}<span class="count">schon drin</span>{/if}
        </button>
      </li>
    {/each}
  </ul>
  <NewList created={(list) => into(list.id)} />
</Sheet>
