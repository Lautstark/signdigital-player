import type { KeyValueStore } from "./signdigital";

/**
 * localStorage, which can throw (blocked site data, a private window). A store
 * that throws reads as empty and writes as nothing, so the app still opens.
 */
export const local: KeyValueStore = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  put(key, value) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      /* nothing to keep it in */
    }
  },
};

/** A stored JSON value, or the fallback when it is missing, unreadable or fails `valid`. */
export function readJson<T>(key: string, fallback: T, valid: (value: unknown) => boolean = () => true): T {
  try {
    const stored = local.get(key);
    if (stored === null) return fallback;
    const value: unknown = JSON.parse(stored);
    return valid(value) ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  local.put(key, JSON.stringify(value));
}
