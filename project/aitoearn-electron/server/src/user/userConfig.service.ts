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
import { User, UserEarnInfo } from '../db/schema/user.schema';
import { RedisService } from 'src/lib/redis/redis.service';

@Injectable()
export class UserConfigService {
  constructor(
    private readonly redisService: RedisService,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) { }

  // 更新用户的赚钱配置
  async setUserEarnInfo(id: string, newData: UserEarnInfo): Promise<User> {
    const res = await this.userModel.findByIdAndUpdate(id, { $set: { earnInfo: newData } });
    this.redisService.del(`UserInfo:${id}`);
    return res;
  }
}
