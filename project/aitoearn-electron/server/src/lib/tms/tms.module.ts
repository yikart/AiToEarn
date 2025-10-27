/*
 * @Author: lish
 * @Date: 2024-07-08 20:13:01
 * @LastEditors: lish
 * @LastEditTime: 2024-07-08 21:06:37
 * @Description: 内容安全模块
 */
import { Module, Global } from '@nestjs/common';
import { TmsService } from './tms.service';
import { ConfigModule } from '@nestjs/config';
import tmsConfig from 'config/tms.config';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [tmsConfig],
    }),
  ],
  providers: [TmsService],
  exports: [TmsService],
})
export class TmsModule {}
