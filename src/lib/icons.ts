/**
 * Every icon in the app, as SVG path data on a 24 × 24 grid. Drawn by
 * Icon.svelte with the stroke style from style.css; `PLAY` is the one filled.
 */
export const ICONS = {
  back: "M15 5l-7 7 7 7",
  forward: "M9 5l7 7-7 7",
  check: "M5 12l5 5 9-10",
  plus: "M12 5v14M5 12h14",
  close: "M6 6l12 12M18 6 6 18",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",
  list: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  /** iOS's share symbol: a box with an arrow out of it. */
  shareApple: "M12 3v12M8 7l4-4 4 4M6 11H5v10h14V11h-1",
  /** Android's: three joined dots. */
  shareAndroid:
    "M20.5 5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM8.5 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM20.5 19a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4",
  download: "M12 3v12M8 11l4 4 4-4M5 21h14",
  play: "M8 5v14l11-7z",
  soundOn: "M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12",
  soundOff: "M4 9v6h4l5 4V5L8 9zM17 9l5 6M22 9l-5 6",
} as const;

export type IconName = keyof typeof ICONS;
