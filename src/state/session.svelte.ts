import { api } from "../lib/api";

/** Whether this phone is logged in at SIGNdigital, and as whom. */
class Session {
  loggedIn = $state.raw(api.loggedIn);
  email = $state.raw(api.email);

  async login(email: string, password: string) {
    await api.login(email, password);
    this.refresh();
  }

  logout() {
    api.logout();
    this.refresh();
  }

  private refresh() {
    this.loggedIn = api.loggedIn;
    this.email = api.email;
  }
}

export const session = new Session();
