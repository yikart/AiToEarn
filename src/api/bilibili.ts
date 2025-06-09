// 创建或更新账户
import sxRequest from "@/utils/request";

/**
 *  获取B站登录地址
 * @returns
 */
export const apiGetBilibiliLoginUrl = (type: "h5" | "pc") => {
  return sxRequest.get<{ code: number; data: { taskId: string; url: string } }>(
    `plat/bilibili/auth/url/${type}`,
  );
};

/**
 * 检查B站授权状态
 * @param taskId 任务ID
 * @returns
 */
export const apiCheckBilibiliAuth = (taskId: string) => {
  return sxRequest.post<{ code: number; data: any }>(
    `plat/bilibili/auth/create-account/${taskId}`,
  );
}; 
