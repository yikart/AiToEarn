/*
 * @Author: nevin
 * @Date: 2022-01-20 11:05:02
 * @LastEditors: nevin
 * @LastEditTime: 2025-02-25 15:03:36
 * @Description: B站配置
 */
export default () => ({
  BILIBILI_CONFIG: {
    CLIENT_NAME: process.env.BILIBILI_CLIENT_NAME || '',
    CLIENT_ID: process.env.BILIBILI_CLIENT_ID || '',
    CLIENT_SECRET: process.env.BILIBILI_CLIENT_SECRET || '',
    AUTH_BACK_URL: process.env.BILIBILI_AUTH_BACK_URL || '',
  },
});
