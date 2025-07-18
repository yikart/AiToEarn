// 渠道数据
import http from "@/utils/request";

/**
 * 获取账号统计数据
 * @returns
 */
export const apiGetAccountDataCube = (accountId: string) => {
  return http.get<{ code: number; data: any }>(
    `channel/dataCube/accountDataCube/${accountId}`,
  );
};

/**
 * 获取账号增量数据
 * @returns
 */
export const apiGetAccountDataBulk = (accountId: string) => {
  return http.get<{ code: number; data: any }>(
    `channel/dataCube/getAccountDataBulk/${accountId}`,
  );
};