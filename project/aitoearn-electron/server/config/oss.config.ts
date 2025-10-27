/*
 * @Author: nevin
 * @Date: 2022-01-20 11:05:02
 * @LastEditors: nevin
 * @LastEditTime: 2024-06-17 14:24:27
 * @Description: OSS模块配置文件
 */
export default () => ({
  OSS_CONFIG: {
    INIT_OPTION: {
      region: 'oss-cn-beijing',
      accessKeyId: process.env.OSS_KEY_ID || 'xxxx',
      accessKeySecret: process.env.OSS_KEY_SECRET || 'xxxx',
      bucket: process.env.OSS_BUCKET || '',
      secret: process.env.OSS_SECRET === 'true',
    },
    HOST_URL: process.env.OSS_URL || '',
  },
});
