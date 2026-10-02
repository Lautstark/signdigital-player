<script lang="ts">
  import { api, app } from "../store.svelte";

  let email = $state(api.email ?? "");
  let password = $state("");
  let busy = $state(false);
  let error = $state<string | null>(null);

  async function login(e: SubmitEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      error = "E-Mail und Passwort eingeben.";
      return;
    }
    busy = true;
    error = null;
    try {
      await api.login(email.trim(), password);
      password = "";
      app.refreshLogin();
      app.tab = "search";
    } catch (e) {
      error = e instanceof Error && /^(401|403)/.test(e.message) ? "E-Mail oder Passwort stimmt nicht." : "Anmelden ging nicht. Ist das Handy online?";
    } finally {
      busy = false;
    }
  }

  function logout() {
    if (!confirm("Abmelden? Danach musst du E-Mail und Passwort neu eingeben.")) return;
    api.logout();
    app.refreshLogin();
  }
</script>

<div class="page">
  {#if app.loggedIn}
    <h1>Konto</h1>
    <p class="note">Angemeldet bei SIGNdigital als<br /><strong>{app.email}</strong></p>
    <p class="note faint">Die App merkt sich die Anmeldung auf diesem Handy und meldet sich selbst neu an, wenn SIGNdigital sie abgelaufen sieht.</p>
    <div class="actions">
      <button class="button" onclick={logout}>Abmelden</button>
    </div>
  {:else}
    <h1>Bei SIGNdigital anmelden</h1>
    <p class="note faint">Mit deinem SIGNdigital-Konto. Die Anmeldung bleibt auf diesem Handy und geht nur an sign-digital.de.</p>
    <form class="stack" onsubmit={login}>
      <label>
        E-Mail
        <input type="email" autocomplete="username" bind:value={email} oninput={() => (error = null)} />
      </label>
      <label>
        Passwort
        <input type="password" autocomplete="current-password" bind:value={password} oninput={() => (error = null)} />
      </label>
      {#if error}<p class="note error">{error}</p>{/if}
      <button class="button primary" type="submit" disabled={busy}>{busy ? "Anmelden …" : "Anmelden"}</button>
    </form>
  {/if}
</div>
