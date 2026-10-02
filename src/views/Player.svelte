<script lang="ts">
  import { api } from "../lib/api";
  import type { SignRef } from "../lib/signdigital";
  import { nextRate, rateLabel, SPEEDS } from "../lib/speed";
  import { message } from "../lib/words";
  import { lists } from "../state/lists.svelte";
  import { player } from "../state/player.svelte";
  import Icon from "../components/Icon.svelte";

  let { sign }: { sign: SignRef } = $props();

  let src = $state<string | null>(null);
  let paused = $state(false);
  let muted = $state(false);
  let error = $state<string | null>(null);
  let video = $state<HTMLVideoElement>();

  /* Started from a list: the signs before and after this one there, offered
     while paused. Started from the search: none. */
  const neighbours = $derived.by(() => {
    const signs = lists.get(player.fromList)?.signs ?? [];
    const i = signs.findIndex((s) => s.slug === sign.slug);
    return i < 0 ? { before: null, after: null } : { before: signs[i - 1] ?? null, after: signs[i + 1] ?? null };
  });

  const speedName = $derived(SPEEDS.find((s) => s.rate === player.speed)?.name ?? "");

  /* The clip comes into memory whole (see api.clip) and its object URL is
     released when the player closes, so nothing outlives watching. */
  $effect(() => {
    let url: string | null = null;
    let gone = false;
    api
      .clip(sign.slug)
      .then((blob) => {
        if (gone) return;
        url = URL.createObjectURL(blob);
        src = url;
      })
      .catch((e) => {
        if (!gone) error = message(e);
      });
    return () => {
      gone = true;
      if (url) URL.revokeObjectURL(url);
    };
  });

  /* With sound when the browser allows it. Safari and Chrome may refuse
     sound without a fresh tap, and the clip arrives after the tap has gone
     stale; then it plays muted and the speaker button turns it on. */
  $effect(() => {
    const v = video;
    if (!v) return;
    v.muted = false;
    v.play().catch(() => {
      muted = v.muted = true;
      v.play().catch(() => (paused = true));
    });
  });

  /* The speed lives in the player state, not here: stepping to the next sign
     of a list builds a new player and the speed goes with it. */
  $effect(() => {
    if (!video) return;
    video.defaultPlaybackRate = video.playbackRate = player.speed;
  });

  function toggle() {
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  }

  function toggleSound() {
    if (!video) return;
    muted = video.muted = !muted;
    if (video.paused) video.play();
  }
</script>

<div class="player" role="dialog" aria-label={sign.name}>
  {#if src}
    <!-- svelte-ignore a11y_media_has_caption -->
    <video
      bind:this={video}
      {src}
      loop
      playsinline
      disablepictureinpicture
      onclick={toggle}
      onplay={() => (paused = false)}
      onpause={() => (paused = true)}
    ></video>
    {#if paused}
      <button class="resume" aria-label="Weiter abspielen" onclick={toggle}><Icon name="play" filled /></button>
      {#if neighbours.before || neighbours.after}
        <div class="steps">
          {@render step(neighbours.before, "vorher")}
          {@render step(neighbours.after, "danach")}
        </div>
      {/if}
    {/if}
  {:else if error}
    <p class="message">{error}</p>
  {:else}
    <span class="ring" aria-label="Lädt"></span>
  {/if}

  <button class="round back" aria-label="Zurück" onclick={() => player.close()}><Icon name="back" /></button>
  {#if src}
    <div class="corner">
      <button class="pill" aria-label="Geschwindigkeit: {speedName}, antippen zum Wechseln" onclick={() => (player.speed = nextRate(player.speed))}>
        {rateLabel(player.speed)}
      </button>
      <button class="round" aria-label={muted ? "Ton an" : "Ton aus"} aria-pressed={!muted} onclick={toggleSound}>
        <Icon name={muted ? "soundOff" : "soundOn"} />
      </button>
    </div>
  {/if}
</div>

<!-- The sign before or after this one in its list; an empty cell keeps "danach" on the right. -->
{#snippet step(to: SignRef | null, label: "vorher" | "danach")}
  {#if to}
    <button class="step" class:after={label === "danach"} onclick={() => player.step(to)}>
      {#if label === "vorher"}<Icon name="back" />{/if}
      <span><small>{label}</small>{to.name}</span>
      {#if label === "danach"}<Icon name="forward" />{/if}
    </button>
  {:else}
    <span></span>
  {/if}
{/snippet}

<style>
  .player {
    position: fixed;
    inset: 0;
    z-index: 10;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  video {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .back,
  .corner {
    position: absolute;
    top: calc(env(safe-area-inset-top) + 12px);
  }
  .corner {
    right: calc(env(safe-area-inset-right) + 12px);
    display: flex;
    gap: 8px;
  }
  .pill {
    height: 44px;
    min-width: 64px;
    padding: 0 14px;
    border: 0;
    border-radius: 22px;
    background: rgb(255 255 255 / 0.16);
    color: #fff;
    font-variant-numeric: tabular-nums;
  }
  .round {
    width: 44px;
    height: 44px;
    padding: 0;
    flex-shrink: 0;
    aspect-ratio: 1;
    border-radius: 50%;
    border: 0;
    background: rgb(255 255 255 / 0.16);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .back {
    left: calc(env(safe-area-inset-left) + 12px);
  }
  .resume {
    position: absolute;
    width: 88px;
    height: 88px;
    border-radius: 50%;
    border: 0;
    background: rgb(0 0 0 / 0.5);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .resume :global(svg) {
    width: 40px;
    height: 40px;
  }
  .steps {
    position: absolute;
    left: 0;
    right: 0;
    bottom: calc(env(safe-area-inset-bottom) + 20px);
    padding: 0 max(12px, env(safe-area-inset-left));
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }
  .step {
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 48%;
    min-height: 56px;
    padding: 8px 14px;
    border: 0;
    border-radius: 16px;
    background: rgb(255 255 255 / 0.16);
    color: #fff;
    text-align: left;
  }
  .step.after {
    text-align: right;
  }
  .step :global(svg) {
    flex-shrink: 0;
  }
  .step span {
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .step small {
    font-size: 12px;
    color: rgb(255 255 255 / 0.7);
  }
  .message {
    color: #ddd;
    padding: 24px;
    text-align: center;
  }
  .ring {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 3px solid rgb(255 255 255 / 0.2);
    border-top-color: #fff;
    animation: spin 0.9s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(1turn);
    }
  }
</style>
