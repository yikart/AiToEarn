// 创建或更新账户
import http from "@/utils/request";
import { request } from '@/utils/request';

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
 * @param taskId 任务ID
 * @returns
 */
export const apiCheckBilibiliAuth = (taskId: string) => {
  return http.post<{ code: number; data: any }>(
    `plat/bilibili/auth/create-account/${taskId}`,
  );
};

/**
 * 初始化视频
 * @param accountId 账户ID
 * @returns
 */
export const apiInitBilibiliVideo = (data: any) => {
  return http.post<{ code: number; data: any }>(
    `plat/bilibili/video/init`,
    data,
  );
};

/**
 * 上传B站视频封面
 * @param accountId 账户ID
 * @param file 封面文件
 * @returns
 */
export const apiUploadBilibiliCover = (accountId: string, data: any) => {
  return request({
    url: 'plat/bilibili/cover/upload',
    method: 'POST',
    body: data,
  });
};

// 上傳視頻到bilibili
export const apiUploadBilibilivideo = (upload_token: string, data: any) => {
  return request({
    url: 'https://openupos.bilivideo.com/video/v2/part/upload?upload_token='+upload_token,
    method: 'POST',
    body: data,
  });
};

/**
 * 提交B站稿件
 * @param accountId 账户ID
 * @param data 稿件数据
 * @returns
 */
export const apiSubmitBilibiliArchive = (
  accountId: string,
  data: {
    title: string;
    cover: string;
    tid: number;
    noReprint: number;
    desc: string;
    tag: string[];
    copyright: number;
    source: string;
  },
) => {
  return http.post<{ code: number; data: any }>(
    `plat/bilibili/archive/add-by-utoken/${accountId}`,
    data,
  );
}; 
