import type { StateStorage } from 'zustand/middleware'
import { clear, del, get, set } from 'idb-keyval'

class IndexedDBStorage implements StateStorage {
  public async getItem(name: string): Promise<string | null> {
    try {
      const value = (await get(name)) || localStorage.getItem(name)
      return value
    }
    catch (error) {
      console.error(error)
      return localStorage.getItem(name)
    }
  }

  public async setItem(name: string, value: string): Promise<void> {
    try {
      const _value = JSON.parse(value)
      if (!_value?.state?._hasHydrated) {
        console.warn('skip setItem', name)
        return
      }
      await set(name, value)
    }
    catch (error) {
      console.error(error)
      if (typeof window !== 'undefined') {
        localStorage.setItem(name, value)
      }
    }
  }

  public async removeItem(name: string): Promise<void> {
    try {
      await del(name)
    }
    catch (error) {
      console.error(error)
      localStorage.removeItem(name)
    }
  }

  public async clear(): Promise<void> {
    try {
      await clear()
    }
    catch (error) {
      console.error(error)
      localStorage.clear()
    }
  }
}

export const indexedDBStorage = new IndexedDBStorage()
