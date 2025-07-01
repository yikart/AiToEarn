import http from "@/utils/request";

/**
 * 获取快手授权地址
 * @returns
 */
export const getKwaiAuthUrlApi = (
  type: "h5" | "pc",
  redirectUriredirectUri: string,
) => {
  return http.get<string>(`plat/kwai/auth/url`, {
    type,
    redirectUriredirectUri,
  });
};

/**
 * 添加快手账户
 * @param code
 */
export const addKwaiAccountApi = (code: string) => {
  return http.get<string>(`plat/kwai/addAccount`, {
    code,
  });
};
