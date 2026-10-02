import type { SignRef } from "./signdigital";

/**
 * A list travels as a link: `…/signdigital-player/#liste=<data>`. Everything
 * is in the part after `#`, which a browser never sends to a server, so a
 * shared list reaches nobody but the person it was sent to. It carries the
 * list's name and its signs' slugs and names: no videos, and nothing that
 * works without a SIGNdigital subscription of one's own.
 *
 * <data> is base64url of JSON `{ n: name, s: [slug | [slug, name], …] }`; a
 * sign whose name is its slug is written as the slug alone, to keep links short.
 */

export interface SharedList {
  name: string;
  signs: SignRef[];
}

const KEY = "liste";

export function encodeList(list: SharedList): string {
  const s = list.signs.map((x) => (x.name === x.slug ? x.slug : [x.slug, x.name]));
  const bytes = new TextEncoder().encode(JSON.stringify({ n: list.name, s }));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeList(data: string): SharedList | null {
  try {
    const b64 = data.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const raw = JSON.parse(new TextDecoder().decode(bytes)) as { n?: unknown; s?: unknown };
    if (typeof raw.n !== "string" || !raw.n.trim() || !Array.isArray(raw.s)) return null;
    const signs: SignRef[] = [];
    for (const x of raw.s) {
      if (typeof x === "string" && x) signs.push({ slug: x, name: x });
      else if (Array.isArray(x) && typeof x[0] === "string" && typeof x[1] === "string") signs.push({ slug: x[0], name: x[1] });
      else return null;
    }
    return { name: raw.n.trim(), signs };
  } catch {
    return null;
  }
}

/** The link to send: this app's own address with the list after `#`. */
export function shareLink(list: SharedList, appUrl: string): string {
  const url = new URL(appUrl);
  url.hash = `${KEY}=${encodeList(list)}`;
  return url.toString();
}

/** The list in a pasted link, or in a bare `#liste=…`; null when there is none. */
export function listFromLink(text: string): SharedList | null {
  const match = text.match(new RegExp(`[#&]${KEY}=([A-Za-z0-9_-]+)`));
  return match ? decodeList(match[1]) : null;
}

/** "Morgens", or "Morgens (2)" when that name is taken, and so on. */
export function freeName(name: string, taken: string[]): string {
  if (!taken.includes(name)) return name;
  for (let i = 2; ; i++) if (!taken.includes(`${name} (${i})`)) return `${name} (${i})`;
}
