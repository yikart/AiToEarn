/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:07
 * @LastEditTime: 2025-04-14 19:22:41
 * @LastEditors: nevin
 * @Description: 配置模块
 */
import { Global, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AppConfigs, AppConfigsSchema } from '@/libs/database/schema/appConfig.entity'
import { AppConfigsController } from './appConfigs.controller'
import { AppConfigsService } from './appConfigs.service'

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppConfigs.name, schema: AppConfigsSchema },
    ]),
  ],
  providers: [AppConfigsService],
  controllers: [AppConfigsController],
})
export class AppConfigsModule {}
