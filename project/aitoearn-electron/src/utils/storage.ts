import { StateStorage } from 'zustand/middleware';

/**
 * 这里重写了 zustand 的读写逻辑
 * 使其存储依托于 electron-store
 */
class IndexedDBStorage implements StateStorage {
  public async getItem(name: string): Promise<string | null> {
    return window.ipcRenderer.getStoreValue(name);
  }

  public async setItem(name: string, value: string): Promise<void> {
    window.ipcRenderer.setStoreValue(name, value);
  }

  public async removeItem(name: string): Promise<void> {
    window.ipcRenderer.setStoreValue(name, '{}');
  }

  public async clear(): Promise<void> {}
}

export const indexedDBStorage = new IndexedDBStorage();
