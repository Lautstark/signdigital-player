/** "1 Gebärde", "4 Gebärden". */
export function signCount(n: number): string {
  return n === 1 ? "1 Gebärde" : `${n} Gebärden`;
}

/** What to show for something that went wrong. */
export function message(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
