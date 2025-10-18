import http from "@/utils/request";
import { GetKwaiAuthStatusRes } from "@/api/plat/types/kwai.types";

/**
 * 创建快手授权
 * @param type 授权类型
 * @param spaceId 空间ID（可选）
 * @returns
 */
export const createKwaiAuth = (type: "h5" | "pc", spaceId?: string) => {
  const params = spaceId ? { spaceId } : {};
  return http.get<{
    url: string;
    taskId: string;
  }>(`plat/kwai/auth/url/${type}`, params);
};

// 获取账号授权状态
export const getKwaiAuthStatus = (taskId: string) => {
  return http.post<GetKwaiAuthStatusRes>(
    `plat/kwai/auth/create-account/${taskId}`,
  );
};
