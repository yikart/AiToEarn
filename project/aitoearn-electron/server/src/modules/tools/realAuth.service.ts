/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2025-04-27 14:06:39
 * @LastEditors: nevin
 * @Description:
 */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RealAuth, SceneType } from 'src/db/schema/realAuth.schema';
import { AlicloudRealAuthService } from 'src/lib/realAuth/realAuth.service';

@Injectable()
export class RealAuthService {
  constructor(
    @InjectModel(RealAuth.name) private realAuthModel: Model<RealAuth>,
    private readonly alicloudRealAuthService: AlicloudRealAuthService,
  ) {}

  /**
   * 身份号认证
   * @param identifyNum
   * @param userName
   */
  async realNameAuth(
    userId: string,
    identifyNum: string,
    userName: string,
    sceneType?: SceneType,
  ): Promise<boolean> {
    const result = await this.realAuthModel.findOne({
      identifyNum,
      userName,
    });
    if (!!result) return true;

    const res = await this.alicloudRealAuthService.realNameAuth(
      identifyNum,
      userName,
    );

    if (res) {
      const realAuth = new this.realAuthModel({
        userId: '1',
        identifyNum,
        userName,
        sceneType,
      });
      realAuth.save();
    }

    console.log('-----', res);
    return res;
  }
}
