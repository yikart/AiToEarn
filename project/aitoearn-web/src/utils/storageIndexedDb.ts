import type { StateStorage } from 'zustand/middleware'

/**
 * 检查是否在浏览器环境中
 * 用于避免在 SSR 环境下访问浏览器 API
 */
const isBrowser = typeof window !== 'undefined' && typeof indexedDB !== 'undefined'

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

/**
 * 动态导入 idb-keyval，仅在浏览器环境中使用
 * 避免 SSR 时报错：indexedDB is not defined
 */
async function getIdbKeyval() {
  if (!isBrowser) {
    return null
  }
  return import('idb-keyval')
}

/**
 * IndexedDB 存储类
 * 实现 zustand 的 StateStorage 接口
 * 在 SSR 环境下会 fallback 到 localStorage 或返回空值
 */
class IndexedDBStorage implements StateStorage {
  public async getItem(name: string): Promise<string | null> {
    // SSR 环境下直接返回 null
    if (!isBrowser) {
      return null
    }

    try {
      const idb = await getIdbKeyval()
      if (idb) {
        const value = (await idb.get(name)) || getLocalStorage()?.getItem(name)
        return value
      }
      return getLocalStorage()?.getItem(name) ?? null
    }
    catch (error) {
      console.error('[IndexedDBStorage] getItem error:', error)
      return getLocalStorage()?.getItem(name) ?? null
    }
  }

  public async setItem(name: string, value: string): Promise<void> {
    // SSR 环境下不执行存储操作
    if (!isBrowser) {
      return
    }

    try {
      const _value = JSON.parse(value)
      if (!_value?.state?._hasHydrated) {
        return
      }
      const idb = await getIdbKeyval()
      if (idb) {
        await idb.set(name, value)
      }
    }
    catch (error) {
      console.error('[IndexedDBStorage] setItem error:', error)
      getLocalStorage()?.setItem(name, value)
    }
  }

  public async removeItem(name: string): Promise<void> {
    // SSR 环境下不执行删除操作
    if (!isBrowser) {
      return
    }

    try {
      const idb = await getIdbKeyval()
      if (idb) {
        await idb.del(name)
      }
    }
    catch (error) {
      console.error('[IndexedDBStorage] removeItem error:', error)
      getLocalStorage()?.removeItem(name)
    }
  }

  public async clear(): Promise<void> {
    // SSR 环境下不执行清除操作
    if (!isBrowser) {
      return
    }

    try {
      const idb = await getIdbKeyval()
      if (idb) {
        await idb.clear()
      }
    }
    catch (error) {
      console.error('[IndexedDBStorage] clear error:', error)
      getLocalStorage()?.clear()
    }
  }
}

export const indexedDBStorage = new IndexedDBStorage()
