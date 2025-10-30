/*
 * @Author: nevin
 * @Date: 2025-01-20 22:02:54
 * @LastEditTime: 2025-03-31 11:30:32
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
}
