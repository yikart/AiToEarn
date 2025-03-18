/*
 * @Author: nevin
 * @Date: 2025-01-20 22:02:54
 * @LastEditTime: 2025-03-18 22:17:16
 * @LastEditors: nevin
 * @Description: autoRun AutoRun
 */
import { Controller, Icp, Inject } from '../core/decorators';
import { AutoRunService } from './service';
import { AutoRunType } from '../../db/models/autoRun';
import { getUserInfo } from '../user/comment';

@Controller()
export class AutoRunController {
  @Inject(AutoRunService)
  private readonly autoRunService!: AutoRunService;

  /**
   * 创建进程
   */
  @Icp('ICP_AUTO_RUN_CREATE')
  async createAutoRun(
    event: Electron.IpcMainInvokeEvent,
    data: {
      accountId: number;
      type: AutoRunType;
      cycleType: string;
    },
  ) {
    const userInfo = getUserInfo();

    const autoRun = await this.autoRunService.createAutoRun({
      userId: userInfo.id,
      ...data,
    });

    return autoRun;
  }

  /**
   * 进程列表
   */
  @Icp('ICP_AUTO_RUN_LIST')
  async getAutoRunList(event: Electron.IpcMainInvokeEvent) {
    const list = await this.autoRunService.findAutoRunList({});
    return list;
  }

  /**
   * 更新进程状态
   */
  @Icp('ICP_AUTO_RUN_STATUS')
  async updateAutoRunStatus(
    event: Electron.IpcMainInvokeEvent,
    data: { id: number; status: number },
  ) {
    const { id, status } = data;
    const autoRun = await this.autoRunService.updateAutoRunStatus(id, status);

    return autoRun;
  }

  /**
   * 创建进程记录
   */
  @Icp('ICP_AUTO_RUN_RECORD_CREATE')
  async createAutoRunRecord(
    event: Electron.IpcMainInvokeEvent,
    data: {
      accountId: number;
      type: AutoRunType;
    },
  ) {
    const autoRunRecord = await this.autoRunService.createAutoRunRecord(data);

    return autoRunRecord;
  }

  /**
   * 更新进程记录状态
   */
  @Icp('ICP_AUTO_RUN_RECORD_STATUS')
  async updateAutoRunRecordStatus(
    event: Electron.IpcMainInvokeEvent,
    id: number,
    status: number,
  ) {
    const autoRun = await this.autoRunService.updateAutoRunRecordStatus(
      id,
      status,
    );

    return autoRun;
  }

  /**
   * 获取进程记录列表
   */
  @Icp('ICP_AUTO_RUN_RECORD_LIST')
  async getCommentList(event: Electron.IpcMainInvokeEvent): Promise<any> {
    const list = await this.autoRunService.findAutoRunRecordList({});

    return list;
  }
}
