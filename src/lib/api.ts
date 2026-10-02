import { SignDigital } from "./signdigital";
import { local } from "./storage";

/** The one SIGNdigital client; its login is kept in this phone's storage. */
export const api = new SignDigital(local);
