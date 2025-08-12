import http from "@/utils/request";
import { request } from "@/utils/request";

// 获取 Twitter 授权 URL
export const getTwitterAuthUrlApi = (mail: string) => { 
  return request({
    url: '/plat/twitter/auth/url',
    method: 'POST',
    data: {
    },
  });
};


/**
 * 获取youtube授权状态
 * @param taskId 任务ID
 * @returns
 */
export const apiCheckTwitterAuth = (taskId: string) => {
  return http.get<{ code: number; data: any }>(
    `/plat/twitter/auth/info/${taskId}`,
  );
};


