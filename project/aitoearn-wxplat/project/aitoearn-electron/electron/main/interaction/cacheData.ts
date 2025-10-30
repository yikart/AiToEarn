import { GlobleCache } from '../../global/cache';

// 0 进行中 1 完成 2 错误
export enum AutoInteractionCacheStatus {
  DOING = 0,
  DONE = 1,
  REEOR = 2,
}

export type AutoReplyCacheData = {
  status: AutoInteractionCacheStatus;
  message: string;
  createTime?: number;
  updateTime?: number;
  title: string;
  dataId?: string;
};

export class AutoInteractionCache {
  static cacheKey = 'OneKeyInteractionWorksCacheKey';
  constructor(data: { title: string }) {
    const cacheData = {
      status: AutoInteractionCacheStatus.DOING,
      message: '进行中',
      updateTime: new Date().getTime(),
      createTime:
        (
          GlobleCache.getCache(
            AutoInteractionCache.cacheKey,
          ) as AutoReplyCacheData
        )?.createTime || new Date().getTime(),
      ...data,
    };

    GlobleCache.setCache(AutoInteractionCache.cacheKey, cacheData, 60 * 30); // 设置缓存
  }

  // 获取信息
  static getInfo() {
    return GlobleCache.getCache(
      AutoInteractionCache.cacheKey,
    ) as AutoReplyCacheData | null;
  }

  // 延长ttl
  extendTTL() {
    GlobleCache.updateCacheTTL(AutoInteractionCache.cacheKey, 60 * 30); // 重设缓存时间
  }

  // 更新状态
  updateStatus(status: AutoInteractionCacheStatus, message?: string) {
    const cacheData = GlobleCache.getCache(AutoInteractionCache.cacheKey);
    if (cacheData) {
      GlobleCache.setCache(AutoInteractionCache.cacheKey, {
        ...cacheData,
        status,
        message,
        updateTime: new Date().getTime(),
      });
    }
  }

  //   删除
  delete() {
    GlobleCache.delCache(AutoInteractionCache.cacheKey);
  }
}
