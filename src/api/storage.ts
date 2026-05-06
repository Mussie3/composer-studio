const NAMESPACE = 'composer-studio:v1'

export const storage = {
  read<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(`${NAMESPACE}:${key}`)
      if (!raw) return fallback
      return JSON.parse(raw) as T
    } catch {
      return fallback
    }
  },
  write<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`${NAMESPACE}:${key}`, JSON.stringify(value))
    } catch (err) {
      console.warn('storage.write failed', err)
    }
  },
  remove(key: string): void {
    localStorage.removeItem(`${NAMESPACE}:${key}`)
  },
  clearAll(): void {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(`${NAMESPACE}:`))
      .forEach((k) => localStorage.removeItem(k))
  },
}
