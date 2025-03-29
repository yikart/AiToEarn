import NodeCache from 'node-cache';
const GlobleCache = new NodeCache();

/**
 * 缓存数据
 * @param key 缓存key
 * @param value 缓存值
 * @param ttl 缓存时间 秒
 */
export const setCache = (key: string, value: any, ttl?: number) => {
  if (ttl) {
    GlobleCache.set(key, value, ttl);
  } else {
    GlobleCache.set(key, value);
  }
};

export const getCache = (key: string) => {
  return GlobleCache.get(key);
};

export const delCache = (key: string) => {
  return GlobleCache.del(key);
};

export const clearCache = () => {
  return GlobleCache.flushAll();
};

// 更改TTL
export const updateCacheTTL = (key: string, ttl: number) => {
  GlobleCache.ttl(key, ttl);
};

// 设置多个缓存
export const setMultiCache = (
  list: { key: string; val: any; ttl?: number }[],
) => {
  GlobleCache.mset(list);
};
