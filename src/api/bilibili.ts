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
