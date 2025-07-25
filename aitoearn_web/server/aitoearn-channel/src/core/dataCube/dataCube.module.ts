import { Module } from '@nestjs/common';
import { BilibiliModule } from '../plat/bilibili/bilibili.module';
import { BilibiliDataService } from './bilibiliData.service';
import { DataCubeController } from './dataCube.controller';

@Module({
  imports: [BilibiliModule],
  controllers: [DataCubeController],
  providers: [BilibiliDataService],
  exports: [BilibiliDataService],
})
export class DataCubeModule {}
