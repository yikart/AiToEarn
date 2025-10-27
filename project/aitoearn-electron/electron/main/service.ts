/*
 * @Author: nevin
 * @Date: 2025-01-24 17:10:35
 * @LastEditors: nevin
 * @Description: 应用的服务
 */
import { app } from 'electron';
import { Injectable } from './core/decorators';
import os from 'os';

@Injectable()
export class AppService {
  getAppInfo() {
    const platform = os.platform();
    return {
      version: app.getVersion(),
      platform: platform,
    };
  }
}
