/*
 * @Author: nevin
 * @Date: 2025-01-24 17:10:35
 * @LastEditors: nevin
 * @Description: autoRun AutoRun
 */
import { Injectable } from '../core/decorators';
import {
  AutoRunModel,
  AutoRunStatus,
  AutoRunType,
} from '../../db/models/autoRun';
import {
  AutoRunRecordModel,
  AutoRunRecordStatus,
} from '../../db/models/autoRunRecord';
import { FindOptionsWhere, Repository } from 'typeorm';
import { AppDataSource } from '../../db';
import windowOperate from '../../util/windowOperate';
import { SendChannelEnum } from '../../../commont/UtilsEnum';

@Injectable()
export class AutoRunService {
  private autoRunRepository: Repository<AutoRunModel>;
  private autoRunRecordRepository: Repository<AutoRunRecordModel>;

  constructor() {
    this.autoRunRepository = AppDataSource.getRepository(AutoRunModel);
    this.autoRunRecordRepository =
      AppDataSource.getRepository(AutoRunRecordModel);
  }

  // 限制处于启动状态的任务数量
  private async chectAutoRunCount(userId: string): Promise<boolean> {
    const count = await this.autoRunRepository.count({
      where: {
        userId,
        status: AutoRunStatus.DOING,
      },
    });

    if (count >= 100) return false;

    return true;
  }

  // 创建进程
  async createAutoRun(data: Partial<AutoRunModel>) {
    if (!(await this.chectAutoRunCount(data.userId!))) return null;

    return await this.autoRunRepository.save(data);
  }

  // 根据ID查询进程信息
  async findAutoRunById(id: number) {
    return await this.autoRunRepository.findOne({
      where: {
        id,
      },
    });
  }

  // 查询进程列表
  async findAutoRunList(
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
  ): Promise<{
    list: AutoRunModel[];
    total: number;
  }> {
    const { page, pageSize } = pageInfo;
    const whereClause: FindOptionsWhere<AutoRunModel> = {
      ...(query.type !== undefined && { type: query.type }),
      ...(query.status !== undefined && { status: query.status }),
      ...(query.cycleType !== undefined && { cycleType: query.cycleType }),
      ...(query.accountId !== undefined && { accountId: query.accountId }),
      ...(query.dataId !== undefined && { dataId: query.dataId }),
    };

    const list = await this.autoRunRepository.find({
      where: whereClause,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const total = await this.autoRunRepository.count({
      where: whereClause,
    });

    return {
      list,
      total,
    };
  }

  // 查询需要运行的进程列表
  async findAutoRunListOfNeedRun(userId: string) {
    return await this.autoRunRepository.find({
      where: {
        userId,
        status: AutoRunStatus.DOING,
      },
    });
  }

  // 更新进程状态
  async updateAutoRunStatus(id: number, status: AutoRunStatus) {
    return await this.autoRunRepository.update(id, {
      status,
    });
  }

  // 创建进程记录
  async createAutoRunRecord(autoRun: AutoRunModel) {
    const data = {
      userId: autoRun.userId,
      type: autoRun.type,
      cycleType: autoRun.cycleType,
      status: AutoRunRecordStatus.DOING,
    };
    return await this.autoRunRecordRepository.save(data);
  }

  // 查询进程记录列表
  async findAutoRunRecordList(
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
  ) {
    const { page, pageSize } = pageInfo;
    const whereClause: FindOptionsWhere<AutoRunRecordModel> = {
      ...(query.autoRunId !== undefined && { autoRunId: query.autoRunId }),
      ...(query.type !== undefined && { type: query.type }),
      ...(query.status !== undefined && { status: query.status }),
      ...(query.cycleType !== undefined && { cycleType: query.cycleType }),
    };

    const list = await this.autoRunRecordRepository.find({
      where: whereClause,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const total = await this.autoRunRecordRepository.count({
      where: whereClause,
    });

    return {
      list,
      total,
    };
  }

  // 更新进程记录状态
  async updateAutoRunRecordStatus(id: number, status: AutoRunRecordStatus) {
    return await this.autoRunRecordRepository.update(id, {
      status,
    });
  }

  // 发送自动任务进度通知
  async sendAutoRunProgress(id: number, status: -1 | 0 | 1 | 2, error?: any) {
    const autoRunInfo = await this.findAutoRunById(id);
    if (!autoRunInfo) return;

    windowOperate.sendRenderMsg(
      SendChannelEnum.AutoRun,
      status,
      autoRunInfo,
      error,
    );
  }
}
