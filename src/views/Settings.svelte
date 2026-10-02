<script lang="ts">
  import { reloadNewest } from "../lib/pwa";
  import { SPEEDS, rateLabel } from "../lib/speed";
  import { session } from "../state/session.svelte";
  import { settings } from "../state/settings.svelte";
  import Login from "./Login.svelte";

  const built = new Date(__BUILD__.time).toLocaleString("de-DE", {
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  let reloading = $state(false);

  function reload() {
    reloading = true;
    reloadNewest();
  }

  function logout() {
    if (confirm("Abmelden? Danach musst du E-Mail und Passwort neu eingeben.")) session.logout();
  }
</script>

<div class="page settings">
  <h1>Einstellungen</h1>

  <p class="section">SIGNdigital</p>
  {#if session.loggedIn}
    <div class="card">
      <div class="card-row">
        <small>Angemeldet als</small>
        <span class="email">{session.email}</span>
      </div>
      <button class="card-row danger" onclick={logout}>Abmelden</button>
    </div>
  {:else}
    <Login title={false} />
  {/if}

  <p class="section" id="speed-label">Geschwindigkeit, mit der Videos starten</p>
  <div class="segments" role="radiogroup" aria-labelledby="speed-label">
    {#each SPEEDS as s (s.rate)}
      <button
        role="radio"
        aria-checked={settings.defaultSpeed === s.rate}
        aria-label={s.name}
        class:on={settings.defaultSpeed === s.rate}
        onclick={() => settings.setDefaultSpeed(s.rate)}
      >
        {rateLabel(s.rate)}
      </button>
    {/each}
  </div>

  <div class="version">
    <span>Version {built} · {__BUILD__.commit}</span>
    <button class="text" disabled={reloading} onclick={reload}>{reloading ? "Lädt …" : "Neu laden"}</button>
  </div>
</div>

<style>
  /* The page fills the screen, so the version line can sit at its foot. */
  .settings {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .section {
    margin-bottom: 8px;
  }
  .segments {
    display: flex;
    gap: 4px;
    padding: 4px;
    border-radius: 12px;
    background: var(--plane-1);
  }
  .segments button {
    flex: 1;
    height: 40px;
    border: 0;
    border-radius: 9px;
    background: none;
    color: var(--text-2);
    font-variant-numeric: tabular-nums;
  }
  .segments button.on {
    background: var(--accent);
    color: var(--on-accent);
    font-weight: 600;
  }
  .card {
    border-radius: 12px;
    background: var(--plane-1);
    overflow: hidden;
  }
  .card-row {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
    padding: 12px 14px;
    border: 0;
    background: none;
    text-align: left;
  }
  .card-row + .card-row {
    border-top: 1px solid var(--line);
  }
  .card-row small {
    font-size: 13px;
    color: var(--text-3);
  }
  .email {
    overflow-wrap: anywhere;
  }
  .card-row.danger {
    color: var(--danger);
  }
  .version {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: auto;
    padding-top: 32px;
    font-size: 13px;
    color: var(--text-3);
  }
  .version button {
    flex-shrink: 0;
    white-space: nowrap;
  }
</style>
