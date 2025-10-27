export const config = {
  imageCDN: 'https://yika-bj.oss-cn-beijing.aliyuncs.com/',
  apiBaseURL: 'https://ttgufwxxqyow.sealosbja.site/api',
};

// 处理图片地址
export const getImageUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${config.imageCDN}${path}`;
};
