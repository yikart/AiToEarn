/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2025-07-23 22:22:35
 * @LastEditors: nevin
 * @Description: skKey
 */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TableDto } from '@/common/global/dto/table.dto';
import { strUtil } from '@/common/utils/str.util';
import { RedisService } from '@/libs';
import { Account } from '@/libs/database/schema/account.schema';
import { SkKey } from '@/libs/database/schema/skKey.schema';
import { SkKeyRefAccount } from '@/libs/database/schema/skKeyRefAccount.schema';

@Injectable()
export class SkKeyService {
  constructor(
    @InjectModel(SkKey.name)
    private readonly skKeyModel: Model<SkKey>,
    @InjectModel(SkKeyRefAccount.name)
    private readonly skKeyRefAccountModel: Model<SkKeyRefAccount>,
    private readonly redisService: RedisService,
  ) {}

  // 创建
  async create(newData: { userId: string; desc?: string }) {
    const key = strUtil.generateComplexKey();
    const res = await this.skKeyModel.create({
      key,
      ...newData,
    });
    return res;
  }

  // 删除
  async del(key: string): Promise<boolean> {
    const res = await this.skKeyModel.deleteOne({ key });
    return res.deletedCount > 0;
  }

  // 更新
  async upInfo(key: string, desc: string) {
    const res = await this.skKeyModel.updateOne({ key }, { $set: { desc } });
    return res.modifiedCount > 0;
  }

  async getInfo(key: string) {
    const data = await this.redisService.get<SkKey>(`skKey:${key}`);
    if (data) {
      return data;
    }

    const res = await this.skKeyModel.findOne({ key });
    await this.redisService.setKey(`skKey:${key}`, res);
    return res;
  }

  // 检查是否活跃
  async checkActive(key: string) {
    const data = await this.redisService.getPttl(`skKey:${key}`);
    return data > 0;
  }

  /**
   * key列表
   * @param userId
   * @param page
   * @returns
   */
  async getList(
    userId: string,
    page: TableDto,
  ): Promise<{
    total: number;
    list: SkKey[];
  }> {
    const list = await this.skKeyModel
      .find({
        userId,
      })
      .skip(((page.pageNo || 1) - 1) * page.pageSize)
      .limit(page.pageSize)
      .exec();

    return {
      total: await this.skKeyModel.countDocuments({
        userId,
      }),
      list,
    };
  }

  // 创建账号关联
  async addRefAccount(key: string, account: Account) {
    const res = await this.skKeyRefAccountModel.create({
      key,
      accountId: account.id,
      accountType: account.type,
    });
    return res;
  }

  // 删除账号关联
  async delRefAccount(key: string, accountId: string): Promise<boolean> {
    const res = await this.skKeyRefAccountModel.deleteOne({
      key,
      accountId,
    });
    return res.deletedCount > 0;
  }

  // 获取key关联的账号的总数
  async getRefAccountCount(key: string): Promise<number> {
    const res = await this.skKeyRefAccountModel.countDocuments({
      key,
    });
    return res;
  }

  // 获取关联列表
  async getRefAccountList(
    key: string,
    page: TableDto,
  ): Promise<{ list: Account[]; total: number }> {
    const res = await this.skKeyRefAccountModel
      .find({
        key,
      })
      .skip(page.pageSize * (page.pageNo - 1))
      .limit(page.pageSize)
      .populate('accountId');
    const total = await this.skKeyRefAccountModel.countDocuments({
      key,
    });
    return {
      list: res.map(item => item.accountId as unknown as Account),
      total,
    };
  }

  // 获取关联列表
  async getRefAccountAll(key: string) {
    const res = await this.skKeyRefAccountModel.find({
      key,
    });

    return res;
  }
}
