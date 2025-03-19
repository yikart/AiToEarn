/*
 * @Author: nevin
 * @Date: 2025-01-24 17:10:35
 * @LastEditors: nevin
 * @Description: autoRun AutoRun
 */
import { Injectable } from '../core/decorators';
import { AutoRunModel, AutoRunStatus } from '../../db/models/autoRun';
import {
  AutoRunRecordModel,
  AutoRunRecordStatus,
} from '../../db/models/autoRunRecord';
import { Repository } from 'typeorm';
import { AppDataSource } from '../../db';

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
  async findAutoRunList(data: Partial<AutoRunModel>) {
    return await this.autoRunRepository.find({
      where: data,
    });
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
  async findAutoRunRecordList(data: Partial<AutoRunRecordModel>) {
    return await this.autoRunRecordRepository.find({
      where: data,
    });
  }

  // 更新进程记录状态
  async updateAutoRunRecordStatus(id: number, status: AutoRunRecordStatus) {
    return await this.autoRunRecordRepository.update(id, {
      status,
    });
  }
}
