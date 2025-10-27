/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 14:05:49
 * @LastEditors: nevin
 * @Description:
 */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, RootFilterQuery } from 'mongoose';
import { paginateModel } from 'src/common/paginate/create-pagination';
import { UserWalletAccount } from 'src/db/schema/userWalletAccount.shema';
import {
  UserWalletRecord,
  UserWalletRecordStatus,
  UserWalletRecordType,
} from 'src/db/schema/userWalletRecord.shema';
import { ErrHttpBack } from 'src/filters/http-exception.back-code';
import { AppHttpException } from 'src/filters/http-exception.filter';
import { RedisService } from 'src/lib/redis/redis.service';
import { AlicloudSmsService } from 'src/lib/sms/alicloud-sms.service';
import { getRandomString } from 'src/util';
import {
  GetUserWalletRecordListByAdminDto,
  GetUserWalletRecordListDto,
} from './dto/userWalletRecord.dto';
import { UserWallet } from 'src/db/schema/userWallet.shema';
import { ObjectId } from 'mongodb';
@Injectable()
export class FinanceService {
  constructor(
    private readonly redisService: RedisService,
    private readonly alicloudSmsService: AlicloudSmsService,
    @InjectModel(UserWallet.name)
    private readonly userWalletModel: Model<UserWallet>,
    @InjectModel(UserWalletAccount.name)
    private readonly userWalletAccountModel: Model<UserWalletAccount>,
    @InjectModel(UserWalletRecord.name)
    private readonly userWalletRecordModel: Model<UserWalletRecord>,
  ) {}

  // ------- 用户的钱包账户 START ---------
  /**
   * 获取用户钱包账户
   * @param userId
   * @returns
   */
  async getUserWalletByUserId(userId: ObjectId): Promise<UserWallet> {
    const account = await this.userWalletModel.findOne({ userId });
    if (account) return account;

    return await this.userWalletModel.create({
      userId,
    });
  }

  /**
   * 更新用户钱包账户的余额
   * @param userWallet
   * @param balance
   * @returns
   */
  async updateUserWalletBalance(
    userId: ObjectId,
    balance: number,
  ): Promise<boolean> {
    const userWallet = await this.getUserWalletByUserId(userId);
    const res = await this.userWalletModel.updateOne(
      { userId: userWallet.userId },
      {
        $inc: {
          balance,
        },
      },
    );

    return res.modifiedCount > 0;
  }

  // ------- 用户的钱包账户 END ---------

  // --------- userWalletAccount STR ---------
  /**
   * 发送手机号验证码-创建用户钱包账户
   * @param phone
   */
  async postCreateUserWalletAccountCode(phone: string) {
    const cacheKey = `CreateUserWalletAccount:${phone}`;
    let code = await this.redisService.get(cacheKey);
    if (code) throw new AppHttpException(ErrHttpBack.err_user_code_had);

    code = getRandomString(6, true);
    const res = await this.alicloudSmsService.sendLoginSms(phone, code);

    if (process.env.NODE_ENV === 'production') {
      if (!res) throw new AppHttpException(ErrHttpBack.err_user_code_send_fail);
    }

    this.redisService.setKey(cacheKey, code, 60 * 5);
    return process.env.NODE_ENV === 'production' ? res : code;
  }

  /**
   * 创建用户钱包账户
   * @param user
   * @param data
   * @returns
   */
  async createUserWalletAccount(
    userId: string,
    data: Partial<UserWalletAccount>,
  ) {
    return await this.userWalletAccountModel.create({
      ...data,
      isDef: false,
      userId,
    });
  }

  // 根据ID获取用户钱包账户
  async getUserWalletAccountById(id: string) {
    return await this.userWalletAccountModel.findOne({ _id: id });
  }
  // 获取用户钱包账户列表
  async getUserWalletAccountList(userId: string) {
    return await this.userWalletAccountModel.find({ userId });
  }

  // 删除用户钱包账户
  async deleteUserWalletAccount(userId: string, id: string): Promise<boolean> {
    const res = await this.userWalletAccountModel.deleteOne({
      userId,
      _id: id,
    });
    return res.deletedCount > 0;
  }
  // --------- userWalletAccount END ---------

  // --------- userWalletRecord STR ---------
  // 创建用户钱包记录
  async createUserWalletRecord(
    userId: string,
    account: UserWalletAccount,
    data: {
      dataId?: string; // 关联数据的ID
      type: UserWalletRecordType;
      balance: number;
      status: UserWalletRecordStatus;
      des?: string;
    },
  ) {
    return await this.userWalletRecordModel.create({
      ...data,
      userId,
      account: account.id,
    });
  }

  // 分页获取记录列表
  async getUserWalletRecordList(
    userId: string,
    query: GetUserWalletRecordListDto,
  ) {
    const { page, pageSize, type, time } = query;
    const filter: RootFilterQuery<UserWalletRecord> = {
      userId,
      ...(type && { type }),
      ...(time && {
        createTime: {
          $gte: new Date(time[0]),
          $lte: new Date(time[1]),
        },
      }),
    };

    return paginateModel(
      this.userWalletRecordModel,
      { page, pageSize },
      filter,
      'account',
      { _id: -1 },
    );
  }

  /**
   * 获取列表
   * @param query
   * @returns
   */
  async getWalletRecordList(query: GetUserWalletRecordListByAdminDto) {
    const { page, pageSize, type, userId, status, time } = query;
    const filter: RootFilterQuery<UserWalletRecord> = {
      ...(type && { type }),
      ...(userId && { userId }),
      ...(status !== undefined && { status }),
      ...(time && {
        payTime: {
          $gte: new Date(time[0]),
          $lte: new Date(time[1]),
        },
      }),
    };

    return paginateModel(
      this.userWalletRecordModel,
      { page, pageSize },
      filter,
      'account',
      { _id: -1 },
    );
  }

  /**
   * 提交发布奖励
   * @param id
   * @param data
   * @returns
   */
  async submitUserWalletRecord(
    id: string,
    data: {
      imgUrl?: string; // 反馈截图
      des?: string;
    },
  ): Promise<boolean> {
    const { balance, userId } = await this.userWalletRecordModel.findOne({
      _id: id,
    });

    const res = await this.userWalletRecordModel.updateOne(
      { _id: id },
      {
        ...data,
        status: UserWalletRecordStatus.SUCCESS,
        payTime: new Date(),
      },
    );

    // 减少余额
    this.updateUserWalletBalance(new ObjectId(userId), -balance);

    return res.modifiedCount > 0;
  }

  /**
   * 拒绝发布奖励
   * @param id
   * @param data
   * @returns
   */
  async rejectUserWalletRecord(
    id: string,
    data: {
      imgUrl?: string; // 反馈截图
      des?: string;
    },
  ): Promise<boolean> {
    const res = await this.userWalletRecordModel.updateOne(
      { _id: id },
      {
        ...data,
        status: UserWalletRecordStatus.FAIL,
      },
    );

    return res.modifiedCount > 0;
  }

  // --------- userWalletRecord END ---------

  // 获取提现中的钱数总和
  async getDoingWalletRecordCount(userId: string) {
    const result = await this.userWalletRecordModel.aggregate([
      {
        $match: {
          userId,
          status: UserWalletRecordStatus.WAIT,
        },
      },
      {
        $group: {
          _id: null,
          totalBalance: { $sum: '$balance' },
        },
      },
    ]);

    return result.length > 0 ? result[0].totalBalance : 0;
  }
}
