/*
 * @Author: nevin
 * @Date: 2025-01-24 17:10:35
 * @LastEditors: nevin
 * @Description: 应用的服务
 */
import { app } from 'electron';
import { Injectable } from './core/decorators';
import { getChromiumPath, setChromiumPath } from '../util/chromium';

@Injectable()
export class AppService {
  getAppInfo() {
    return {
      version: app.getVersion(),
      chromiumPath: getChromiumPath(),
    };
  }

  // 设置chrome路径
  async setChromiumPath() {
    await setChromiumPath();
  }
}
