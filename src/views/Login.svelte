<script lang="ts">
  import { api, app } from "../store.svelte";

  /* On its own the login has a heading; under Einstellungen the section names it. */
  let { title = true }: { title?: boolean } = $props();

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
</script>

{#if title}
  <h1>Bei SIGNdigital anmelden</h1>
  <p class="note faint">Mit deinem SIGNdigital-Konto. Die Anmeldung bleibt auf diesem Handy und geht nur an sign-digital.de.</p>
{/if}
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
