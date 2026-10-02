/** The playback speeds SIGNdigital's own player offers, slowest first. */
export const SPEEDS = [
  { rate: 0.5, name: "Langsam" },
  { rate: 1, name: "Normal" },
  { rate: 1.5, name: "Schnell" },
] as const;

export type Rate = (typeof SPEEDS)[number]["rate"];

export function isRate(value: unknown): value is Rate {
  return SPEEDS.some((s) => s.rate === value);
}

/** The one after this, wrapping from Schnell back to Langsam. */
export function nextRate(rate: Rate): Rate {
  const i = SPEEDS.findIndex((s) => s.rate === rate);
  return SPEEDS[(i + 1) % SPEEDS.length].rate;
}

/** "0,5×", "1×", "1,5×". */
export function rateLabel(rate: Rate): string {
  return `${rate.toLocaleString("de-DE")}×`;
}
