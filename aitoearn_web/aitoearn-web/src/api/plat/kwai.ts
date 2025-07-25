import http from "@/utils/request";
import { GetKwaiAuthStatusRes } from "@/api/plat/types/kwai.types";

/**
 * 创建快手授权
 * @returns
 */
export const createKwaiAuth = (type: "h5" | "pc") => {
  return http.get<{
    url: string;
    taskId: string;
  }>(`plat/kwai/auth/url/${type}`);
};

// 获取账号授权状态回调
export const getKwaiAuthStatus = (taskId: string) => {
  return http.post<GetKwaiAuthStatusRes>(
    `plat/kwai/auth/create-account/${taskId}`,
  );
};
