import { registerAs } from '@nestjs/config';

export default registerAs('tiktok', () => ({
  // TikTok开发者平台的客户端密钥
  clientId: process.env.TIKTOK_CLIENT_ID || '',
  clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
  redirectUri: process.env.TIKTOK_REDIRECT_URI || 'https://platapi.aitoearn.cn',

  // TikTok API基础URL
  apiBaseUrl: 'https://open.tiktokapis.com',

  // TikTok OAuth 2.0终端点
  authUrl: 'https://www.tiktok.com/v2/auth/authorize',
  tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
  revokeUrl: 'https://open.tiktokapis.com/v2/oauth/revoke/',
  refreshTokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',

  // TikTok API终端点
  // videosListUrl: 'https://open.tiktokapis.com/v2/video/list/',
  videoUploadUrl: 'https://open-upload.tiktokapis.com/v2',
  // videoPublishUrl: 'https://open.tiktokapis.com/v2/video/publish/',

  // API版本
  apiVersion: 'v2',

  // 需要的权限范围
  scopes: [
    'user.info.basic',
    'user.info.open_id',
    'user.info.profile',
    'user.info.stats',
    'video.list',
    'video.upload',
    'video.publish',
  ].join(','),
}));
