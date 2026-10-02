<script lang="ts">
  import type { SignRef } from "../signdigital";
  import { api, app } from "../store.svelte";
  import { nextRate, rateLabel, SPEEDS } from "../speed";

  let { sign }: { sign: SignRef } = $props();

  let src = $state<string | null>(null);
  let paused = $state(false);
  let error = $state<string | null>(null);
  let video = $state<HTMLVideoElement>();

  /* Started from a list: the signs before and after this one there, offered
     while paused. Started from the search: none. */
  const neighbours = $derived.by(() => {
    const signs = app.lists.find((l) => l.id === app.playingFrom)?.signs ?? [];
    const i = signs.findIndex((s) => s.slug === sign.slug);
    if (i < 0) return { before: null, after: null };
    return { before: signs[i - 1] ?? null, after: signs[i + 1] ?? null };
  });

  /* The link SIGNdigital signs expires after 60 seconds, and a looping video
     asks again for parts of the file, Safari especially. So the clip is fetched
     once into memory and played from there: the expired link is never asked
     again. `no-store` keeps it out of the browser's cache, and the object URL
     is released when the player closes, so nothing outlives watching. */
  $effect(() => {
    let url: string | null = null;
    let gone = false;
    (async () => {
      try {
        const found = await api.sign(sign.slug);
        if (!found?.videoPath) throw new Error("Zu dieser Gebärde gibt es kein Video.");
        const [link] = await api.links([found.videoPath]);
        const response = await fetch(link, { cache: "no-store" });
        if (!response.ok) throw new Error(`Video nicht geladen (HTTP ${response.status}).`);
        const blob = await response.blob();
        if (gone) return;
        url = URL.createObjectURL(blob);
        src = url;
      } catch (e) {
        if (!gone) error = e instanceof Error ? e.message : String(e);
      }
    })();
    return () => {
      gone = true;
      if (url) URL.revokeObjectURL(url);
    };
  });

  /* With sound when the browser allows it. Safari and Chrome may refuse
     sound without a fresh tap, and the clip arrives after the tap has gone
     stale; then it plays muted and the speaker button turns it on. */
  let muted = $state(false);

  $effect(() => {
    const v = video;
    if (!v) return;
    v.muted = false;
    v.play().catch(() => {
      muted = true;
      v.muted = true;
      v.play().catch(() => (paused = true));
    });
  });

  function toggleSound() {
    if (!video) return;
    muted = !muted;
    video.muted = muted;
    if (video.paused) video.play();
  }

  /* The speed lives in the app, not here: stepping to the next sign of a list
     builds a new player and the speed goes with it. */
  $effect(() => {
    if (!video) return;
    video.defaultPlaybackRate = app.speed;
    video.playbackRate = app.speed;
  });

  const speedName = $derived(SPEEDS.find((s) => s.rate === app.speed)?.name ?? "");

  function toggle() {
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
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
      <button class="resume" aria-label="Weiter abspielen" onclick={toggle}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
      </button>
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

  <button class="round back" aria-label="Zurück" onclick={() => app.closePlayer()}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
  </button>
  {#if src}
    <div class="corner">
      <button class="pill" aria-label="Geschwindigkeit: {speedName}, antippen zum Wechseln" onclick={() => (app.speed = nextRate(app.speed))}>
        {rateLabel(app.speed)}
      </button>
      <button class="round" aria-label={muted ? "Ton an" : "Ton aus"} aria-pressed={!muted} onclick={toggleSound}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 9v6h4l5 4V5L8 9z" />
          {#if muted}<path d="M17 9l5 6M22 9l-5 6" />{:else}<path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />{/if}
        </svg>
      </button>
    </div>
  {/if}
</div>

<!-- The sign before or after this one in its list; an empty cell keeps "danach" on the right. -->
{#snippet step(to: SignRef | null, label: "vorher" | "danach")}
  {#if to}
    <button class="step" class:after={label === "danach"} onclick={() => app.step(to)}>
      {#if label === "vorher"}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>{/if}
      <span><small>{label}</small>{to.name}</span>
      {#if label === "danach"}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>{/if}
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
  .resume svg {
    width: 40px;
    height: 40px;
    fill: currentColor;
    stroke: none;
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
  .step svg {
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
