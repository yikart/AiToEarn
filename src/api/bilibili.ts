// 创建或更新账户
import http from "@/utils/request";
import { request } from "@/utils/request";

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
    url: `plat/bilibili/cover/upload/${accountId}`,
    method: "POST",
    body: data,
  });
};

// 上傳視頻到bilibili
export const apiUploadBilibilivideo = (
  accountId: string,
  upload_token: string,
  data: any,
) => {
  return request({
    url: `plat/bilibili/video/upload/${accountId}?uploadToken=${upload_token}`,
    method: "POST",
    body: data,
  });
};

/**
 * 提交B站稿件
 * @param accountId 账户ID
 * @param data 稿件数据
 * @returns
 */
export const apiSubmitBilibiliArchive = (data: any) => {
  return http.post<{ code: number; data: any }>(
    `plat/bilibili/archive/add-by-utoken`,
    data,
  );
};

/**
 * 上传B站视频分片
 * @param accountId 账户ID
 * @param uploadToken 上传token
 * @param partNumber 分片序号
 * @param data 分片数据
 * @returns
 */
export const apiUploadBilibiliVideoPart = (
  accountId: string,
  uploadToken: string,
  partNumber: number,
  data: any,
) => {
  const formData = new FormData();
  formData.append("file", data);

  return request({
    url: `plat/bilibili/video/part/upload/${accountId}`,
    method: "POST",
    body: formData,
    params: {
      uploadToken,
      partNumber,
    },
  });
};

/**
 * 合并B站视频分片
 * @param accountId 账户ID
 * @param uploadToken 上传token
 * @returns
 */
export const apiCompleteBilibiliVideo = (
  accountId: string,
  uploadToken: string,
) => {
  return request({
    url: `plat/bilibili/video/complete/${accountId}`,
    method: "POST",
    data: {
      uploadToken,
    },
  });
};

/**
 * 获取B站分区列表
 * @param accountId 账户ID
 * @returns
 */
export const apiGetBilibiliPartitions = (accountId: string) => {
  return http.get<{ code: number; data: any }>(
    `plat/bilibili/archive/type/list/${accountId}`,
  );
};
