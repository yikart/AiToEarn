/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2025-03-03 14:05:25
 * @LastEditors: nevin
 * @Description:
 */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserStatus } from '../db/schema/user.schema';
import { RedisService } from '../lib/redis/redis.service';
import { QueryUserListDto } from './dto/user-admin.dto';
import { paginateModel } from '../common/paginate/create-pagination';
import { UserWallet } from 'src/db/schema/userWallet.shema';
import * as crypto from 'node:crypto';
import { RealAuthService } from './realAuth.service';

@Injectable()
export class UserService {
  constructor(
    private readonly redisService: RedisService,
    private readonly realAuthService: RealAuthService,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    @InjectModel(UserWallet.name)
    private readonly userWalletModel: Model<UserWallet>,
  ) {}

  async getUserInfoById(id: string) {
    const key = `UserInfo:${id}`;
    let userInfo: User = await this.redisService.get(key);
    if (!!userInfo) return userInfo;

    userInfo = await this.userModel.findById(id);
    this.redisService.setKey(key, userInfo);
    return userInfo;
  }

  async getUserInfoByPhone(phone: string) {
    const userInfo: User = await this.userModel.findOne({
      phone,
      status: UserStatus.OPEN,
    });
    return userInfo;
  }

  async getUserInfoByMail(mail: string) {
    const userInfo: User = await this.userModel.findOne({
      mail,
      status: UserStatus.OPEN,
    });
    return userInfo;
  }

  async getUserInfoByWxOpenId(wxOpenId: string) {
    const userInfo: User = await this.userModel.findOne({
      wxOpenid: wxOpenId,
      status: UserStatus.OPEN,
    });
    return userInfo;
  }

  /**
   * 创建用户
   * @param newData
   * @returns
   */
  async createUser(newData: User): Promise<User> {
    const res = await this.userModel.create(newData);
    return res;
  }

  // 更新
  async updateUser(id: string, newData: User): Promise<User> {
    const res = await this.userModel.findByIdAndUpdate(id, newData);
    this.redisService.del(`UserInfo:${id}`);
    return res;
  }

  // 更新密码
  async updateUserPassword(
    id: string,
    newData: {
      password: string;
      salt: string;
    },
  ): Promise<0 | 1> {
    const res = await this.userModel.updateOne(
      { _id: id },
      {
        $set: {
          password: newData.password,
          salt: newData.salt,
        },
      },
    );

    this.redisService.del(`UserInfo:${id}`);
    return res.modifiedCount > 0 ? 1 : 0;
  }

  // 用户注销
  async deleteUser(userInfo: User): Promise<0 | 1> {
    const res = await this.userModel.updateOne(
      {
        _id: userInfo.id,
      },
      {
        $set: {
          status: UserStatus.DELETE,
          wxOpenid: '',
          wxUnionid: '',
          phone: '',
          backData: {
            wxOpenid: userInfo.wxOpenid,
            wxUnionid: userInfo.wxUnionid,
            phone: userInfo.phone,
          },
        },
      },
    );
    this.redisService.del(`UserInfo:${userInfo.id}`);
    return res.modifiedCount > 0 ? 1 : 0;
  }

  private getUserWalletInfo(userId: string) {
    return this.userWalletModel.findOne({ userId });
  }

  /**
   * 获取用户列表
   */
  async getUserList(query: QueryUserListDto) {
    const { name, phone, status, field, order } = query;

    const filter: any = {};
    if (name) filter.name = new RegExp(name, 'i');
    if (phone) filter.phone = new RegExp(phone, 'i');
    if (status !== undefined) filter.status = status;

    const sort: any = {};
    if (field) {
      sort[field] = order === 'DESC' ? -1 : 1;
    } else {
      sort.createdAt = -1; // 默认按创建时间倒序
    }

    const res = await paginateModel(
      this.userModel,
      query,
      filter,
      undefined, // populate options
      sort,
    );

    const items = [];

    for (const element of res.items) {
      const walletInfo = await this.getUserWalletInfo(element.id);
      const realAuthInfo = await this.realAuthService.getRealAuthModelByUserId(
        element.id,
      );

      items.push({
        id: element.id,
        name: element.name,
        phone: element.phone,
        status: element.status,
        createTime: element.createTime,
        updateTime: element.updateTime,
        wxOpenid: element.wxOpenid,
        wxUnionid: element.wxUnionid,
        balance: walletInfo?.balance || 0,
        identifyNum: realAuthInfo?.identifyNum || '',
        realName: realAuthInfo?.userName || '',
      });
    }

    return {
      items,
      meta: res.meta,
    };
  }

  /**
   * 更新用户状态
   */
  async updateUserStatus(id: string, status: UserStatus): Promise<User> {
    const res = await this.userModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );
    this.redisService.del(`UserInfo:${id}`);
    return res;
  }

  // 更新用户的电话号码
  async updateUserPhone(id: string, phone: string): Promise<boolean> {
    const res = await this.userModel.updateOne(
      { _id: id },
      { $set: { phone } },
    );
    this.redisService.del(`UserInfo:${id}`);
    return res.modifiedCount > 0;
  }

  // 获取用户总数
  async getUserCount() {
    const count = await this.userModel.countDocuments();
    return count;
  }

  /**
   * 更新微信openID
   */
  async updateUserWxOpenId(id: string, openId: string): Promise<User> {
    const res = await this.userModel.findByIdAndUpdate(
      id,
      { wxOpenid: openId },
      { new: false },
    );
    this.redisService.del(`UserInfo:${id}`);
    return res;
  }

  /**
   * 生成推广码
   * @param userId
   * @param phone
   * @returns
   */
  async generateUsePopularizeCode(userId: string, phone: string) {
    // 先对手机号进行哈希处理
    const phoneHash = crypto
      .createHash('sha256')
      .update(phone)
      .digest('hex')
      .substring(0, 16);

    const combinedSalt = 'aitoearn' + phoneHash;

    const hash = crypto
      .createHash('sha256')
      .update(userId)
      .update(combinedSalt)
      .digest('hex');

    // 取部分哈希值转换为5位代码
    const numericValue = parseInt(hash.substring(0, 6), 16);
    const code = numericValue
      .toString(36)
      .slice(-5)
      .toUpperCase()
      .padStart(5, '0');

    // 更新用户的推广码
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { popularizeCode: code } },
    );
    this.redisService.del(`UserInfo:${userId}`);

    return code;
  }

  /**
   * 根据推广码获取用户信息
   * @param popularizeCode
   * @returns
   */
  async getUserByPopularizeCode(popularizeCode: string): Promise<User> {
    const userInfo: User = await this.userModel.findOne({
      popularizeCode,
      status: UserStatus.OPEN,
    });
    return userInfo;
  }
}
