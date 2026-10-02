<script lang="ts">
  import { api, app } from "../store.svelte";
  import { SPEEDS, rateLabel } from "../speed";
  import Login from "./Login.svelte";

  const built = new Date(__BUILD__.time).toLocaleString("de-DE", { dateStyle: "long", timeStyle: "short" });
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

  <p class="section">Geschwindigkeit beim Abspielen</p>
  <ul class="rows" role="radiogroup" aria-label="Geschwindigkeit beim Abspielen">
    {#each SPEEDS as s (s.rate)}
      {@const on = app.defaultSpeed === s.rate}
      <li class="row">
        <button class="main" role="radio" aria-checked={on} onclick={() => app.setDefaultSpeed(s.rate)}>
          <span class="name">{s.name}</span>
          <span class="count">{rateLabel(s.rate)}</span>
          <svg class="check" class:on viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
        </button>
      </li>
    {/each}
  </ul>
  <p class="note faint">Damit startet jedes Video. Im Video selbst stellst du oben rechts um.</p>

  <p class="section">SIGNdigital-Konto</p>
  {#if app.loggedIn}
    <p class="note">Angemeldet als <strong>{app.email}</strong></p>
    <p class="note faint">Die App merkt sich die Anmeldung auf diesem Handy und meldet sich selbst neu an, wenn SIGNdigital sie abgelaufen sieht.</p>
    <div class="actions">
      <button class="button" onclick={logout}>Abmelden</button>
    </div>
  {:else}
    <Login />
  {/if}

  <div class="version">
    <span>Version vom {built} · {__BUILD__.commit}</span>
    <button class="text" disabled={reloading} onclick={reload}>{reloading ? "Lädt …" : "Neu laden"}</button>
  </div>
</div>

<style>
  .version {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 32px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
    font-size: 13px;
    color: var(--text-3);
  }
  .version button {
    flex-shrink: 0;
    white-space: nowrap;
  }
  .check {
    color: var(--accent);
    visibility: hidden;
  }
  .check.on {
    visibility: visible;
  }
</style>
