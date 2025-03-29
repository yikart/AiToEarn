import NodeCache from 'node-cache';

class Cache {
  private static instance: Cache;
  private cache: NodeCache;

  private constructor() {
    this.cache = new NodeCache();
  }

  public static getInstance(): Cache {
    if (!Cache.instance) Cache.instance = new Cache();
    return Cache.instance;
  }

  /**
   * 缓存数据
   * @param key 缓存key
   * @param value 缓存值
   * @param ttl 缓存时间 秒
   */
  public setCache(key: string, value: any, ttl?: number) {
    if (ttl) {
      this.cache.set(key, value, ttl);
    } else {
      this.cache.set(key, value);
    }
  }

  public getCache(key: string) {
    return this.cache.get(key);
  }

  public delCache(key: string) {
    return this.cache.del(key);
  }

  public clearCache() {
    return this.cache.flushAll();
  }

  // 更改TTL
  public updateCacheTTL(key: string, ttl: number) {
    this.cache.ttl(key, ttl);
  }

  // 设置多个缓存
  public setMultiCache(list: { key: string; val: any; ttl?: number }[]) {
    this.cache.mset(list);
  }
}

export const GlobleCache = Cache.getInstance();
