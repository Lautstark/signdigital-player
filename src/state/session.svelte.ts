import { api } from "../lib/api";
import { lists } from "./lists.svelte";

/** Whether this phone is logged in at SIGNdigital, and as whom. */
class Session {
  loggedIn = $state.raw(api.loggedIn);
  email = $state.raw(api.email);

  async login(email: string, password: string) {
    await api.login(email, password);
    this.refresh();
    void lists.load();
  }

  logout() {
    api.logout();
    lists.forget();
    this.refresh();
  }

  private refresh() {
    this.loggedIn = api.loggedIn;
    this.email = api.email;
  }
}

export const session = new Session();
