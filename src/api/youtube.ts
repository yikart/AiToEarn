import  sxRequest  from '@/utils/request';

// 获取 YouTube 授权 URL
export const getYouTubeAuthUrlApi = (mail: string) => {
  return sxRequest.get(`plat/youtube/auth/url?mail=${mail}`);
};

export const checkYouTubeAuthApi = (mail: string) => {
  return sxRequest.get(`plat/youtube/auth/check?mail=${mail}`);
}; 