const PREFIX = 'arbor_'

function makeStore(store: Storage) {
  return {
    set(key: string, value: unknown): void {
      try {
        store.setItem(PREFIX + key, JSON.stringify(value))
      } catch {
        // ignore quota errors
      }
    },
    get<T>(key: string): T | null {
      try {
        const item = store.getItem(PREFIX + key)
        return item ? (JSON.parse(item) as T) : null
      } catch {
        return null
      }
    },
    remove(key: string): void {
      store.removeItem(PREFIX + key)
    },
    clear(): void {
      Object.keys(store)
        .filter(k => k.startsWith(PREFIX))
        .forEach(k => store.removeItem(k))
    },
  }
}

/** Session-scoped store (cleared when the tab closes) — used for auth tokens */
export const storage = makeStore(sessionStorage)

/** Persistent store (survives refresh + navigation) — used for real envelopes */
export const localStore = makeStore(localStorage)
