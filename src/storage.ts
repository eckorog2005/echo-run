export interface KeyValueStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
}

/** localStorage can throw or be empty (private windows, blocked storage), so every access is guarded. */
export const browserStore: KeyValueStore = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage unavailable; the game still works without saving.
    }
  },
};

export function memoryStore(): KeyValueStore {
  const m = new Map<string, string>();
  return {
    get: (k) => m.get(k) ?? null,
    set: (k, v) => void m.set(k, v),
  };
}
