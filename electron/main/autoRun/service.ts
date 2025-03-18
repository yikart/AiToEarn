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

  // 创建进程
  async createAutoRun(data: AutoRunModel) {
    return await this.autoRunRepository.save(data);
  }

  // 查询进程列表
  async findAutoRunList(data: Partial<AutoRunModel>) {
    return await this.autoRunRepository.find({
      where: data,
    });
  }

  // 更新进程状态
  async updateAutoRunStatus(id: number, status: AutoRunStatus) {
    return await this.autoRunRepository.update(id, {
      status,
    });
  }

  // 创建进程记录
  async createAutoRunRecord(data: AutoRunRecordModel) {
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
