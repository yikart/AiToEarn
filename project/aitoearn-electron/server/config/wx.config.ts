/*
 * @Author: nevin
 * @Date: 2022-01-20 11:05:02
 * @LastEditors: nevin
 * @LastEditTime: 2025-02-25 15:03:36
 * @Description: 微信配置
 */
import * as fs from 'fs';
import { join } from 'path';

export default () => ({
  WX_CONFIG: {
    APP_ID: process.env.WX_APP_ID || '',
    APP_SECRET: process.env.WX_APP_SECRET || '',
    MCH_ID: process.env.WX_MCH_ID || '',
    PUBLIC_KEY: fs.readFileSync(
      join(__dirname, '..', 'src/files/wxcert/apiclient_cert.pem'),
    ),
    PRIVATE_KEY: fs.readFileSync(
      join(__dirname, '..', 'src/files/wxcert/apiclient_key.pem'),
    ),
    KEY: process.env.WX_KEY || '',
    NOTIFY_URL: process.env.WX_NOTIFY_URL || '',
  },
  WX_GZH: {
    WX_GZH_ID: process.env.WX_GZH_ID || '',
    WX_GZH_SECRET: process.env.WX_GZH_SECRET || '',
    WX_GZH_TOKEN: process.env.WX_GZH_TOKEN || '',
    WX_GZH_AES_KEY: process.env.WX_GZH_AES_KEY || '',
  },
});
