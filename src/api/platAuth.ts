import http from "@/utils/request";
import { request } from "@/utils/request";

// 获取 YouTube 授权 URL
export const getYouTubeAuthUrlApi = (mail: string, spaceId?: string) => {
  const params: any = { type: 'pc' };
  if (spaceId) {
    params.spaceId = spaceId;
  }
  return request({
    url: 'plat/youtube/auth/url',
    method: 'GET',
    params,
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
 * @param mail 邮箱
 * @param spaceId 空间ID（可选）
 * @returns
 */
export const getFacebookAuthUrlApi = (mail: string, spaceId?: string) => {
  const data: any = {
    platform: 'facebook',
  };
  if (spaceId) {
    data.spaceId = spaceId;
  }
  return request({
    url: 'plat/meta/auth/url',
    method: 'POST',
    data,
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
 * @param mail 邮箱
 * @param spaceId 空间ID（可选）
 * @returns
 */
export const getInstagramAuthUrlApi = (mail: string, spaceId?: string) => {
  const data: any = {
    platform: 'instagram',
  };
  if (spaceId) {
    data.spaceId = spaceId;
  }
  return request({
    url: 'plat/meta/auth/url',
    method: 'POST',
    data,
  });
};



/**
 * 获取threads授权状态
 * @param mail 邮箱
 * @param spaceId 空间ID（可选）
 * @returns
 */
export const getThreadsAuthUrlApi = (mail: string, spaceId?: string) => {
  const data: any = {
    platform: 'threads',
  };
  if (spaceId) {
    data.spaceId = spaceId;
  }
  return request({
    url: 'plat/meta/auth/url',
    method: 'POST',
    data,
  });
};

/**
 * 获取linkedin授权链接
 * 逻辑与facebook一致，仅platform传linkedin
 * @param mail 邮箱
 * @param spaceId 空间ID（可选）
 */
export const getLinkedInAuthUrlApi = (mail: string, spaceId?: string) => {
  const data: any = {
    platform: 'linkedin',
  };
  if (spaceId) {
    data.spaceId = spaceId;
  }
  return request({
    url: 'plat/meta/auth/url',
    method: 'POST',
    data,
  });
};


/**
 * 获取tiktok授权状态
 * @param mail 邮箱
 * @param spaceId 空间ID（可选）
 * @returns
 */
export const getTiktokAuthUrlApi = (mail: string, spaceId?: string) => {
  const data: any = { type: 'pc' };
  if (spaceId) {
    data.spaceId = spaceId;
  }
  return request({
    url: 'plat/tiktok/auth/url',
    method: 'POST', 
    data,
  });
};

export const checkTiktokAuthApi = ( taskId:any ) => {
  return request({
    url: `plat/tiktok/auth/info/${taskId}`,
    method: 'GET',
  });
};


// 微信授权
export const getWxGzhAuthUrlApi = (mail: string, spaceId?: string) => {
  const params: any = { type: 'pc' };
  if (spaceId) {
    params.spaceId = spaceId;
  }
  return request({
    url: 'plat/wxGzh/auth/url/pc',
    method: 'GET', 
    params,
  });
};

export const checkWxGzAuthApi = ( taskId:any ) => {
  return request({
    url: `plat/wxGzh/auth/create-account/${taskId}`,
    method: 'GET',
  });
};


/**
 * 获取pinterest授权状态
 * @param mail 邮箱
 * @param spaceId 空间ID（可选）
 * @returns
 */
export const getPinterestAuthUrlApi = (mail: string, spaceId?: string) => {
  const params: any = {};
  if (spaceId) {
    params.spaceId = spaceId;
  }
  return request({
    url: 'plat/pinterest/getAuth',
    method: 'GET',
    params,
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
