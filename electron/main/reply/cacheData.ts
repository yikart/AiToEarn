import { GlobleCache } from '../../global/cache';

// 0 进行中 1 完成 2 错误
export enum AutorReplyCacheStatus {
  DOING = 0,
  DONE = 1,
  REEOR = 2,
}

export type AutoReplyCacheData = {
  status: AutorReplyCacheStatus;
  message: string;
  createTime?: number;
  updateTime?: number;
  title: string;
  dataId?: string;
};

export class AutoReplyCache {
  static cacheKey = 'OneKeyReplyCommentCacheKey';
  constructor(data: { title: string; dataId?: string }) {
    const cacheData = {
      status: AutorReplyCacheStatus.DOING,
      message: '进行中',
      updateTime: new Date().getTime(),
      createTime:
        (GlobleCache.getCache(AutoReplyCache.cacheKey) as AutoReplyCacheData)
          ?.createTime || new Date().getTime(),
      ...data,
    };

    GlobleCache.setCache(AutoReplyCache.cacheKey, cacheData, 60 * 15); // 设置缓存
  }

  // 获取信息
  static getInfo() {
    return GlobleCache.getCache(
      AutoReplyCache.cacheKey,
    ) as AutoReplyCacheData | null;
  }

  // 延长ttl
  extendTTL() {
    GlobleCache.updateCacheTTL(AutoReplyCache.cacheKey, 60 * 15); // 重设缓存时间
  }

  // 更新状态
  updateStatus(status: AutorReplyCacheStatus, message?: string) {
    const cacheData = GlobleCache.getCache(AutoReplyCache.cacheKey);
    if (cacheData) {
      GlobleCache.setCache(AutoReplyCache.cacheKey, {
        ...cacheData,
        status,
        message,
        updateTime: new Date().getTime(),
      });
    }
  }

  //   删除
  delete() {
    GlobleCache.delCache(AutoReplyCache.cacheKey);
  }
}
