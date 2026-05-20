import type { StateStorage } from 'zustand/middleware'

function getLocalStorage(): Storage | undefined {
  if (typeof window === 'undefined' || !('localStorage' in window)) {
    return undefined
  }

  try {
    return window.localStorage
  }
  catch {
    return undefined
  }
}

class AppLocalStorage implements StateStorage {
  public async getItem(name: string): Promise<string | null> {
    return getLocalStorage()?.getItem(name) ?? null
  }

  public async setItem(name: string, value: string): Promise<void> {
    getLocalStorage()?.setItem(name, value)
  }

  public async removeItem(name: string): Promise<void> {
    getLocalStorage()?.removeItem(name)
  }

  public async clear(): Promise<void> {
    // try {
    //   await clear();
    // } catch (error) {
    //   localStorage.clear();
    // }
  }
}

export const appLocalStorage = new AppLocalStorage()
