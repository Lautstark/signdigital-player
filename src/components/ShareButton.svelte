<script lang="ts">
  import { asShared, type List } from "../lib/lists";
  import { appUrl, isApple } from "../lib/platform";
  import { shareLink } from "../lib/share";
  import Icon from "./Icon.svelte";

  /* The phone's own share menu, which has "Kopieren" in it too, behind the
     symbol that phone uses. A browser without one gets the link copied. */
  let { list }: { list: List } = $props();
  let copied = $state(false);

  async function share() {
    const url = shareLink(asShared(list), appUrl);
    if (navigator.share) {
      await navigator.share({ title: list.name, text: `Gebärden-Liste „${list.name}“`, url }).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(url).catch(() => {});
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }
</script>

<button class="icon" aria-label={copied ? "Link kopiert" : "Liste teilen"} onclick={share}>
  <Icon name={copied ? "check" : isApple ? "shareApple" : "shareAndroid"} />
</button>
