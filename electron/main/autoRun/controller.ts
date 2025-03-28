/*
 * @Author: nevin
 * @Date: 2025-01-20 22:02:54
 * @LastEditTime: 2025-03-28 13:33:08
 * @LastEditors: nevin
 * @Description: autoRun AutoRun
 */
import { Controller, Icp, Inject, Scheduled } from '../core/decorators';
import { AutoRunService } from './service';
import { AutoRunStatus, AutoRunType } from '../../db/models/autoRun';
import { getUserInfo } from '../user/comment';
import { EtEvent } from '../../global/event';
import { autoRunTypeEtTag, hasTriggered } from './comment';
import { AutoRunRecordStatus } from '../../db/models/autoRunRecord';

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
  async getAutoRunList(
    event: Electron.IpcMainInvokeEvent,
    pageInfo: {
      page: number;
      pageSize: number;
    },
    query: {
      type?: AutoRunType;
      status?: AutoRunStatus;
      cycleType?: string;
      accountId?: number;
      dataId?: string;
    },
  ) {
    const list = await this.autoRunService.findAutoRunList(pageInfo, query);
    return list;
  }

  /**
   * 更新进程状态
   */
  @Icp('ICP_AUTO_RUN_STATUS')
  async updateAutoRunStatus(
    event: Electron.IpcMainInvokeEvent,
    id: number,
    status: AutoRunStatus,
  ) {
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
  async getCommentList(
    event: Electron.IpcMainInvokeEvent,
    pageInfo: {
      page: number;
      pageSize: number;
    },
    query: {
      autoRunId: number;
      type?: AutoRunType;
      status?: AutoRunRecordStatus;
      cycleType?: string;
    },
  ): Promise<any> {
    const list = await this.autoRunService.findAutoRunRecordList(
      pageInfo,
      query,
    );

    return list;
  }

  // 立即执行进程
  @Icp('ICP_RUN_NOW_AUTO_RUN')
  async autoRunStart(event: Electron.IpcMainInvokeEvent, id: number) {
    const item = await this.autoRunService.findAutoRunById(id);
    if (!item) return false;

    const tag = autoRunTypeEtTag.get(item.type);
    if (!tag) return false;

    EtEvent.emit(tag, item);
    return true;
  }

  // 每5分钟进行一次自动启动
  @Scheduled('*/1 * * * *', 'all_auto_run_start')
  async syncAllAutoRunStart() {
    try {
      const userInfo = getUserInfo();

      const autoRunList = await this.autoRunService.findAutoRunListOfNeedRun(
        userInfo.id,
      );

      // 遍历自动运行列表,满足运行条件的通知运行
      for (const item of autoRunList) {
        const tag = autoRunTypeEtTag.get(item.type);
        if (!tag) continue;
        const needRun = hasTriggered(item.cycleType);
        if (!needRun) continue;
        EtEvent.emit(tag, item);
      }
    } catch (error) {
      console.error('---- syncAllAutoRunStart ---- error', error);
    }
  }
}
