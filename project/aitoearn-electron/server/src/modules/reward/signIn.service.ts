/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 17:58:21
 * @LastEditors: nevin
 * @Description: signIn SignIn 签到
 */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, RootFilterQuery } from 'mongoose';
import { SignIn, SignInType } from 'src/db/schema/signIn.schema';
import { QuerySignInListDto } from './dto/signIn.dto';
import { paginateModel } from 'src/common/paginate/create-pagination';

@Injectable()
export class SignInService {
  constructor(
    @InjectModel(SignIn.name)
    private readonly signInModel: Model<SignIn>,
  ) {}

  /**
   * 创建签到记录,有则更新创建时间
   * @param userId
   * @param type
   * @returns
   */
  async createSignInRecord(userId: string, type: SignInType): Promise<SignIn> {
    return await this.signInModel.findOneAndUpdate(
      {
        userId,
        type,
      },
      {
        $set: {
          userId,
          type,
          createTime: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
      },
    );
  }

  /**
   * 获取时间段内的签到列表
   * @param userId
   * @param query
   * @returns
   */
  async getSignInList(userId: string, query: QuerySignInListDto) {
    const { page, pageSize, type, time } = query;
    const filter: RootFilterQuery<SignIn> = { userId, type };

    if (time) {
      filter.createTime = {
        $gte: new Date(time[0]),
        $lte: new Date(time[1]),
      };
    }

    return paginateModel(
      this.signInModel,
      {
        page,
        pageSize,
      },
      filter,
      undefined,
      { _id: -1 },
    );
  }
}
