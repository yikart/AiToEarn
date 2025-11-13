import type { StateStorage } from 'zustand/middleware'

class IndexedDBStorage implements StateStorage {
  public async getItem(name: string): Promise<string | null> {
    if (typeof window === 'undefined')
      return null
    return localStorage.getItem(name)
  }

  public async setItem(name: string, value: string): Promise<void> {
    if (typeof window === 'undefined')
      return
    localStorage.setItem(name, value)
  }

  public async removeItem(name: string): Promise<void> {
    if (typeof window === 'undefined')
      return
    localStorage.removeItem(name)
  }

  public async clear(): Promise<void> {
    // try {
    //   await clear();
    // } catch (error) {
    //   localStorage.clear();
    // }
  }
}

export const indexedDBStorage = new IndexedDBStorage()
