import http from "@/utils/request";
import { request } from "@/utils/request";

// 获取 YouTube 授权 URL
export const getYouTubeAuthUrlApi = (mail: string) => {
  return request({
    url: 'plat/youtube/auth/url',
    method: 'GET',
    params: { type: 'pc' },
  });
};


/**
 * 获取youtube授权状态
 * @param taskId 任务ID
 * @returns
 */
export const apiCheckYoutubeAuth = (taskId: string) => {
  return http.post<{ code: number; data: any }>(
    `plat/youtube/auth/create-account/${taskId}`,
  );
};

export const checkYouTubeAuthApi = ( data:any ) => {
  return request({
    url: `plat/youtube/auth/status/${data.accountId}`,
    method: 'GET',
  });
};

export const uploadYouTubeVideoApi = (data: FormData) => {
  return request({
    url: 'plat/youtube/videos/upload',
    method: 'POST',
    body: data,
  });
};


export const uploadYouTubeVideoSmallApi = (data: FormData) => {
  return request({
    url: 'plat/youtube/video/upload/small',
    method: 'POST',
    body: data,
  });
};

export const getYouTubeListApi = (data: any) => {
  return request({
    url: 'plat/youtube/videos/list',
    method: 'GET',
    params: data,
  });
};

export const getYouTubeChannelSectionsApi = (data: any) => {
  return request({
    url: 'plat/youtube/video/categories',
    method: 'GET',
    params: data,
  });
};


/**
 * 获取facebook授权状态
 * @param taskId 任务ID
 * @returns
 */
export const getFacebookAuthUrlApi = (mail: string) => {
  return request({
    url: 'plat/meta/auth/url',
    method: 'POST',
    data: {
      platform: 'facebook',
    },
  });
};




export const checkMetaAuthApi = ( taskId:any ) => {
  return request({
    url: `plat/meta/auth/info/${taskId}`,
    method: 'GET',
  });
};


/**
 * 获取instagram授权状态
 * @param taskId 任务ID
 * @returns
 */
export const getInstagramAuthUrlApi = (mail: string) => {
  return request({
    url: 'plat/meta/auth/url',
    method: 'POST',
    data: {
      platform: 'instagram',
    },
  });
};



/**
 * 获取threads授权状态
 * @param taskId 任务ID
 * @returns
 */
export const getThreadsAuthUrlApi = (mail: string) => {
  return request({
    url: 'plat/meta/auth/url',
    method: 'POST',
    data: {
      platform: 'threads',
    },
  });
};


/**
 * 获取tiktok授权状态
 * @param taskId 任务ID
 * @returns
 */
export const getTiktokAuthUrlApi = (mail: string) => {
  return request({
    url: 'plat/tiktok/auth/url',
    method: 'POST', 
    data: { type: 'pc' },
  });
};

export const checkTiktokAuthApi = ( taskId:any ) => {
  return request({
    url: `plat/tiktok/auth/info/${taskId}`,
    method: 'GET',
  });
};


// 微信授权
export const getWxGzhAuthUrlApi = (mail: string) => {
  return request({
    url: 'plat/wxGzh/auth/url/pc',
    method: 'GET', 
    params: { type: 'pc' },
  });
};

export const checkWxGzAuthApi = ( taskId:any ) => {
  return request({
    url: `plat/wxGzh/auth/create-account/${taskId}`,
    method: 'GET',
  });
};


/**
 * 获取facebook授权状态
 * @param taskId 任务ID
 * @returns
 */
export const getPinterestAuthUrlApi = (mail: string) => {
  return request({
    url: 'plat/pinterest/getAuth',
    method: 'GET',
  });
};


export const checkPinterestAuthApi = ( taskId:any ) => {
  return request({
    url: `plat/pinterest/checkAuth`,
    method: 'GET',
    params: {
      taskId: taskId,
    },
  });
};
