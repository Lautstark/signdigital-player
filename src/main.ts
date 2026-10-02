import { mount } from "svelte";
import App from "./App.svelte";
import { registerServiceWorker } from "./lib/pwa";
import { nav } from "./state/nav.svelte";
import { player } from "./state/player.svelte";
import "./style.css";

/* Everything that listens to the browser is wired here, once, rather than
   when a module happens to be imported. */
nav.remember();
nav.openSharedLink();
addEventListener("hashchange", () => nav.openSharedLink());
addEventListener("popstate", () => player.closed());

mount(App, { target: document.getElementById("app")! });
registerServiceWorker();
