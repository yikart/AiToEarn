import { request } from '@/utils/request';

// 获取 YouTube 授权 URL
export const getYouTubeAuthUrlApi = (mail: string) => {
  return request({
    url: '/plat/youtube/auth/url',
    method: 'GET',
    params: { mail },
  });
};

export const checkYouTubeAuthApi = ( mail: string) => {
  return request({
    url: '/plat/youtube/auth/check',
    method: 'GET',
    params: { mail },
  });
};

export const uploadYouTubeVideoApi = (data: FormData) => {
  return request({
    url: '/plat/youtube/videos/upload',
    method: 'POST',
    data,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}; 