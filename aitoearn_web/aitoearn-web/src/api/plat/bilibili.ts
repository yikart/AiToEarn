// 创建或更新账户
import http from "@/utils/request";
import { BiblPartItem } from "@/components/PublishDialog/publishDialog.type";

/**
 *  获取B站登录地址
 * @returns
 */
export const apiGetBilibiliLoginUrl = (type: "h5" | "pc") => {
  return http.get<{ code: number; data: { taskId: string; url: string } }>(
    `plat/bilibili/auth/url/${type}`,
  );
};

/**
 * 检查B站授权状态
 * @param accointId 账号ID
 * @returns
 */
export const apiCheckAccountAuthStatus = (accointId: string) => {
  return http.get<{ code: number; data: boolean }>(
    `plat/bilibili/auth/status/${accointId}`,
  );
};

/**
 * 获取B站授权状态
 * @param taskId 任务ID
 * @returns
 */
export const apiCheckBilibiliAuth = (taskId: string) => {
  return http.post<{ code: number; data: any }>(
    `plat/bilibili/auth/create-account/${taskId}`,
  );
};

/**
 * 获取B站分区列表
 * @param accountId 账户ID
 * @returns
 */
export const apiGetBilibiliPartitions = (accountId: string) => {
  return http.get<BiblPartItem[]>(
    `plat/bilibili/archive/type/list/${accountId}`,
  );
};
