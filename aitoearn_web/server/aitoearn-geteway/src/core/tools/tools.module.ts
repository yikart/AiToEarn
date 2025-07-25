/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:07
 * @LastEditTime: 2024-09-05 15:18:26
 * @LastEditors: nevin
 * @Description: 工具箱模块
 */
import { Global, Module } from '@nestjs/common'
import { FileModule } from '../file/file.module'
import { AiToolsController } from './ai.controller'
import { AiToolsService } from './ai.service'
import { ToolsController } from './tools.controller'

@Global()
@Module({
  imports: [FileModule],
  controllers: [AiToolsController, ToolsController],
  providers: [AiToolsService],
  exports: [AiToolsService],
})
export class ToolsModule {}
