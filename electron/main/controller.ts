/*
 * @Author: nevin
 * @Date: 2025-01-20 22:02:54
 * @LastEditTime: 2025-02-21 21:16:01
 * @LastEditors: nevin
 * @Description:
 */
import { Controller, Icp, Inject } from './core/decorators';
import { AppService } from './service';

@Controller()
export class AppController {
  @Inject(AppService)
  private readonly toolsService!: AppService;

  /**
   * 获取应用信息
   */
  @Icp('ICP_APP_GET_INFO')
  async getAppInfo(event: Electron.IpcMainInvokeEvent) {
    return this.toolsService.getAppInfo();
  }

  /**
   * 指定chromium路径
   */
  @Icp('ICP_SET_CHROMIUM_PATH')
  async setChromiumPath(event: Electron.IpcMainInvokeEvent) {
    return this.toolsService.setChromiumPath();
  }
}
