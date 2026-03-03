const PREFIX = 'arbor_'

export const storage = {
  set(key: string, value: unknown): void {
    try {
      sessionStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch {
      // ignore quota errors
    }
  },
  get<T>(key: string): T | null {
    try {
      const item = sessionStorage.getItem(PREFIX + key)
      return item ? (JSON.parse(item) as T) : null
    } catch {
      return null
    }
  },
  remove(key: string): void {
    sessionStorage.removeItem(PREFIX + key)
  },
  clear(): void {
    Object.keys(sessionStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => sessionStorage.removeItem(k))
  },
}
