// Threads API接口
import http from "@/utils/request";

export interface ThreadsLocationItem {
  id: string;
  label: string;
}

export interface ThreadsLocationsResponse {
  data: ThreadsLocationItem[];
  code: number;
}

/**
 * 获取Threads位置列表
 * @param accountId 账户ID
 * @param keyword 搜索关键词（可选）
 * @returns
 */
export const apiGetThreadsLocations = (accountId: string, keyword?: string) => {
  const params: any = { accountId };
  if (keyword) {
    params.keyword = keyword;
  }
  return http.get<ThreadsLocationsResponse>(
    `plat/meta/threads/locations`,
    params 
  );
};
