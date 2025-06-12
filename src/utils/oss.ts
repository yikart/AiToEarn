// 获取OSS域名
const OSS_DOMAIN = 'https://ai-to-earn.oss-cn-beijing.aliyuncs.com';

// 获取完整的OSS URL
export const getOssUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${OSS_DOMAIN}/${path}`;
}; 