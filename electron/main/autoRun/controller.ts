/*
 * @Author: nevin
 * @Date: 2025-01-20 22:02:54
 * @LastEditTime: 2025-03-19 19:34:24
 * @LastEditors: nevin
 * @Description: autoRun AutoRun
 */
import { Controller, Icp, Inject, Scheduled } from '../core/decorators';
import { AutoRunService } from './service';
import { AutoRunType } from '../../db/models/autoRun';
import { getUserInfo } from '../user/comment';
import { EtEvent } from '../../global/event';
import { autoRunTypeEtTag } from './comment';

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
      dataId?: string;
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
    autoRunId: number,
  ) {
    const autoData = await this.autoRunService.findAutoRunById(autoRunId);
    if (!autoData) return null;
    const autoRunRecord =
      await this.autoRunService.createAutoRunRecord(autoData);

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

  // 每5分钟进行一次自动启动
  @Scheduled('*/1 * * * *', 'all_auto_run_start')
  async syncAllAutoRunStart() {
    try {
      const userInfo = getUserInfo();

      const autoRunList = await this.autoRunService.findAutoRunListOfNeedRun(
        userInfo.id,
      );

      for (const item of autoRunList) {
        const tag = autoRunTypeEtTag.get(item.type);
        if (!tag) continue;
        // TODO: 根据创建记录,对比是否已经执行
        EtEvent.emit(tag, item);
      }
    } catch (error) {
      console.error('Failed to sync accounts:', error);
    }
  }
}
