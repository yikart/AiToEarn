/*
 * @Author: nevin
 * @Date: 2025-01-24 16:35:59
 * @LastEditTime: 2025-03-18 19:50:10
 * @LastEditors: nevin
 * @Description: autoRun AutoRun 自动脚本
 */
import { Module } from '../core/decorators';
import { AutoRunController } from './controller';
import { AutoRunService } from './service';

@Module({
  controllers: [AutoRunController],
  providers: [AutoRunService],
})
export class AutoRunModule {}
