/* The service worker keeps the app itself, so it opens without a network.
   It never keeps anything from SIGNdigital: see public/sw.js. */
export function registerServiceWorker(): void {
  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  }
}

/**
 * An app started from the iPhone home screen has no reload of its own.
 * Pages are fetched network-first by the service worker, so a reload brings
 * the newest version; the worker is asked to update first so that its next
 * start is current too.
 */
export async function reloadNewest(): Promise<void> {
  await navigator.serviceWorker
    ?.getRegistration()
    .then((r) => r?.update())
    .catch(() => {});
  location.reload();
}
