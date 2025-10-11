/*
 * @Author: nevin
 * @Date: 2022-01-20 11:05:02
 * @LastEditors: nevin
 * @LastEditTime: 2024-06-17 14:24:40
 * @Description: 服务配置文件
 */
export default () => ({
  SERVER_CONFIG: {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.SERVER_PORT
      ? Number.parseInt(process.env.SERVER_PORT)
      : 7000,
    ENABLE_SWAGGER: process.env.NODE_ENV !== 'production' ? true : false,
  },
});
