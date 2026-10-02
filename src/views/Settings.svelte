<script lang="ts">
  import { api, app } from "../store.svelte";
  import { SPEEDS, rateLabel } from "../speed";
  import Login from "./Login.svelte";

  const built = new Date(__BUILD__.time).toLocaleString("de-DE", {
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  let reloading = $state(false);

  /* An app started from the iPhone home screen has no reload of its own.
     Pages are fetched network-first by the service worker, so a reload is
     enough to get the newest version; the worker is asked to update first
     so its next start is current too. */
  async function reload() {
    reloading = true;
    await navigator.serviceWorker
      ?.getRegistration()
      .then((r) => r?.update())
      .catch(() => {});
    location.reload();
  }

  function logout() {
    if (!confirm("Abmelden? Danach musst du E-Mail und Passwort neu eingeben.")) return;
    api.logout();
    app.refreshLogin();
  }
</script>

<div class="page">
  <h1>Einstellungen</h1>

  <p class="section" id="speed-label">Geschwindigkeit, mit der Videos starten</p>
  <div class="segments" role="radiogroup" aria-labelledby="speed-label">
    {#each SPEEDS as s (s.rate)}
      <button
        role="radio"
        aria-checked={app.defaultSpeed === s.rate}
        aria-label={s.name}
        class:on={app.defaultSpeed === s.rate}
        onclick={() => app.setDefaultSpeed(s.rate)}
      >
        {rateLabel(s.rate)}
      </button>
    {/each}
  </div>

  <p class="section">SIGNdigital</p>
  {#if app.loggedIn}
    <div class="card">
      <div class="card-row">
        <small>Angemeldet als</small>
        <span class="email">{app.email}</span>
      </div>
      <button class="card-row danger" onclick={logout}>Abmelden</button>
    </div>
  {:else}
    <Login title={false} />
  {/if}

  <div class="version">
    <span>Version {built} · {__BUILD__.commit}</span>
    <button class="text" disabled={reloading} onclick={reload}>{reloading ? "Lädt …" : "Neu laden"}</button>
  </div>
</div>

<style>
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
    margin-top: 32px;
    font-size: 13px;
    color: var(--text-3);
  }
  .version button {
    flex-shrink: 0;
    white-space: nowrap;
  }
</style>
