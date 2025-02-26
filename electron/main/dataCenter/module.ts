/*
 * @Author: cascade
 * @Date: 2025-02-12 15:29:04
 * @Description: 数据中心模块
 */
import { Module } from '../core/decorators';
import { DataCenterController } from './controller';
import { DataCenterService } from './service';

@Module({
  controllers: [DataCenterController],
  providers: [DataCenterService],
})
export class DataCenterModule {}
