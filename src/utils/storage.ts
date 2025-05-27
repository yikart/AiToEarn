import { StateStorage } from "zustand/middleware";

class IndexedDBStorage implements StateStorage {
  public async getItem(name: string): Promise<string | null> {
    return localStorage.getItem(name);
  }

  public async setItem(name: string, value: string): Promise<void> {
    localStorage.setItem(name, value);
  }

  public async removeItem(name: string): Promise<void> {
    localStorage.removeItem(name);
  }

  public async clear(): Promise<void> {
    // try {
    //   await clear();
    // } catch (error) {
    //   localStorage.clear();
    // }
  }
}

export const indexedDBStorage = new IndexedDBStorage();
