/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2025-03-03 14:05:25
 * @LastEditors: nevin
 * @Description: realAuth RealAuth
 */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RealAuth } from 'src/db/schema/realAuth.schema';

@Injectable()
export class RealAuthService {
  constructor(
    @InjectModel(RealAuth.name)
    private readonly realAuthModel: Model<RealAuth>,
  ) {}

  async getRealAuthModelByUserId(userId: string) {
    return await this.realAuthModel.findOne({ userId });
  }
}
