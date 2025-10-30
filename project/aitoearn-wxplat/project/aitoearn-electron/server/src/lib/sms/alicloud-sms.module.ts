/*
 * @Author: lish
 * @Date: 2024-07-08 20:13:01
 * @LastEditors: lish
 * @LastEditTime: 2024-07-08 21:06:37
 * @Description: Do not edit
 */
import { Module, Global } from '@nestjs/common';
import { AlicloudSmsService } from './alicloud-sms.service';
import { ConfigModule } from '@nestjs/config';
import smsConfig from '../../../config/sms.config';
import { AlicloudPnsService } from './alicloud-pns.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [smsConfig], // 加载自定义配置项
    }),
  ],
  providers: [AlicloudSmsService, AlicloudPnsService],
  exports: [AlicloudSmsService, AlicloudPnsService],
})
export class AlicloudSmsModule {}
