import { mount } from "svelte";
import App from "./App.svelte";
import "./style.css";

mount(App, { target: document.getElementById("app")! });

/* The service worker keeps the app itself, so it opens without a network.
   It never keeps anything from SIGNdigital: see public/sw.js. */
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
}
