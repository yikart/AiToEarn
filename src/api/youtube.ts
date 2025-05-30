import sxRequest from "@/utils/request";

// 获取 YouTube 授权 URL
export const getYouTubeAuthUrlApi = (mail: string) => {
  return sxRequest.get<{ url: string }>(`plat/youtube/auth/url?mail=${mail}`);
}; 