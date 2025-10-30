/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2024-09-05 15:19:25
 * @LastEditors: nevin
 * @Description: Tracing tracing
 */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tracing } from 'src/db/schema/tracing.schema';

export enum TracingTag {
  AccountAdd = 'AccountAdd', // 账号添加
  VideoPul = 'VideoPul', // 视频发布
  OpenProjectUse = 'OpenProjectUse', // 开源项目调用
}

@Injectable()
export class TracingService {
  constructor(
    @InjectModel(Tracing.name)
    private readonly tracingModel: Model<Tracing>,
  ) {}

  async create(newData: Partial<Tracing>) {
    return await this.tracingModel.create(newData);
  }

  /**
   * 账号总数
   * @param time
   * @returns
   */
  async getTracingAccountCount() {
    try {
      const result = await this.tracingModel.aggregate([
        {
          $match: {
            tag: TracingTag.AccountAdd,
          },
        },
        {
          $group: {
            _id: '$accountId', // 按账号ID
          },
        },
        {
          $count: 'total', // 统计分组数量
        },
      ]);

      return result.length > 0 ? result[0].total : 0;
    } catch (error) {
      console.error('Error counting documents:', error);
      return 0;
    }
  }

  /**
   * 时间段内发视频的用户总数
   * @param time
   * @returns
   */
  async getTracingVideoUserCount(time?: [Date, Date]) {
    try {
      const startTime = time ? time[0] : new Date('2024-01-01');
      const endTime = time ? time[1] : new Date();

      const result = await this.tracingModel.aggregate([
        {
          $match: {
            tag: TracingTag.VideoPul,
            time: {
              $gte: startTime,
              $lte: endTime,
            },
          },
        },
        {
          $group: {
            _id: '$userId', // 按用户ID分组
          },
        },
        {
          $count: 'total', // 统计分组数量
        },
      ]);

      return result.length > 0 ? result[0].total : 0;
    } catch (error) {
      console.error('Error counting documents:', error);
      return 0;
    }
  }

  /**
   * 时间段内发视频的总数
   * @param time
   * @returns
   */
  async getTracingVideoCount(time?: [Date, Date]) {
    try {
      const startTime = time ? time[0] : new Date('2024-01-01');
      const endTime = time ? time[1] : new Date();

      const result = await this.tracingModel.aggregate([
        {
          $match: {
            tag: TracingTag.VideoPul,
            time: {
              $gte: startTime,
              $lte: endTime,
            },
          },
        },
        {
          $count: 'total', // 统计文档数量
        },
      ]);

      return result.length > 0 ? result[0].total : 0;
    } catch (error) {
      console.error('Error counting documents:', error);
      return 0;
    }
  }

  /**
   * 时间段内开源项目调用总数
   * @param time
   * @returns
   */
  async getTracingOpenProjectCount(time?: [Date, Date]) {
    try {
      const startTime = time ? time[0] : new Date('2024-01-01');
      const endTime = time ? time[1] : new Date();

      const result = await this.tracingModel.aggregate([
        {
          $match: {
            tag: TracingTag.OpenProjectUse,
            time: {
              $gte: startTime,
              $lte: endTime,
            },
          },
        },
        {
          $count: 'total', // 统计文档数量
        },
      ]);

      return result.length > 0 ? result[0].total : 0;
    } catch (error) {
      console.error('Error counting documents:', error);
      return 0;
    }
  }
}
