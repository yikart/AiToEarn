/*
 * @Author: nevin
 * @Date: 2025-01-24 16:35:59
 * @LastEditTime: 2025-02-06 19:13:48
 * @LastEditors: nevin
 * @Description: 发布相关模块
 */
import { Module } from '../core/decorators';
import { PublishController } from './controller';
import { PublishService } from './service';
import { VideoPubController } from './video/controller';
import { VideoPubService } from './video/service';
import { ImgTextPubController } from './imgText/controller';
import { ImgTextPubService } from './imgText/service';

@Module({
  controllers: [PublishController, VideoPubController, ImgTextPubController],
  providers: [PublishService, VideoPubService, ImgTextPubService],
})
export class PublishModule {}
