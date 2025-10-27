/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:07
 * @LastEditTime: 2025-04-14 16:41:35
 * @LastEditors: nevin
 * @Description: 运营模块
 */
import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BannerService } from './banner.service';
import { BannerController } from './banner.controller';
import { Banner, BannerSchema } from 'src/db/schema/banner.schema';
import { AdminBannerController } from './adminBanner.controller';
import { PlatAuthModule } from 'src/lib/platAuth/platAuth.module';
import { AdminGzhController } from './adminGzh.controller';
import { Cfg, CfgSchema } from 'src/db/schema/cfg.schema';
import { CfgController } from './cfg.controller';
import { CfgService } from './cfg.service';
import { AdminCfgController } from './cfgAdmin.controller';

@Global()
@Module({
  imports: [
    PlatAuthModule,
    MongooseModule.forFeature([
      { name: Banner.name, schema: BannerSchema },
      { name: Cfg.name, schema: CfgSchema },
    ]),
  ],
  providers: [BannerService, CfgService],
  controllers: [
    BannerController,
    AdminBannerController,
    AdminGzhController,
    CfgController,
    AdminCfgController,
  ],
})
export class OperateModule {}
