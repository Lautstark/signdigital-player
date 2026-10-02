/** iPhone or iPad, including an iPad that says it is a Mac. */
export const isApple =
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1 && !/Android/.test(navigator.userAgent));

/** Started from the home screen rather than in a browser tab. */
export const isInstalled =
  matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** This app's own address, the base every shared link is built on. */
export const appUrl = new URL(import.meta.env.BASE_URL, location.origin).href;
