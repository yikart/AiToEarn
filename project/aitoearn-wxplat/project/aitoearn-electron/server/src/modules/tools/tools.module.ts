/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:07
 * @LastEditTime: 2024-09-05 15:18:26
 * @LastEditors: nevin
 * @Description: 工具箱模块
 */
import { Global, Module } from '@nestjs/common';
import { AiToolsController } from './ai.controller';
import { AiToolsService } from './ai.service';
import { RealAuthModule } from 'src/lib/realAuth/realAuth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { RealAuth, RealAuthSchema } from 'src/db/schema/realAuth.schema';
import { RealAuthService } from './realAuth.service';
import { ToolsController } from './tools.controller';
import { AiToolsAdminController } from './aiAdmin.controller';
import { KwaiSginService } from "./kwaiSign/kwaiSgin.service";

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RealAuth.name, schema: RealAuthSchema },
    ]),
    RealAuthModule,
  ],
  controllers: [AiToolsController, ToolsController, AiToolsAdminController],
  providers: [AiToolsService, RealAuthService, KwaiSginService],
  exports: [AiToolsService, RealAuthService],
})
export class ToolsModule {}
