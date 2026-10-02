import type { Sign } from "./signdigital";
import { api } from "./store.svelte";

/** Card-picture links for a batch of signs, in one request, keyed by slug. */
export async function thumbnails(signs: Sign[]): Promise<Map<string, string>> {
  const withCard = signs.filter((s) => s.cardPath);
  const links = await api.links(withCard.map((s) => s.cardPath!));
  return new Map(withCard.map((s, i) => [s.slug, links[i]]));
}
