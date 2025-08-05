// 获取OSS域名
export const OSS_DOMAIN = 'https://aitoearn.s3.ap-southeast-1.amazonaws.com';

// 获取完整的OSS URL
export const getOssUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${OSS_DOMAIN}/${path}`;
}; 