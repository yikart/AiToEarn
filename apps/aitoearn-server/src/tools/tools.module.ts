/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:07
 * @LastEditTime: 2024-09-05 15:18:26
 * @LastEditors: nevin
 * @Description: 工具模块
 */
import { Module } from '@nestjs/common'
import { ToolsService } from './tools.service'

@Module({
  providers: [ToolsService],
  exports: [ToolsService],
})
export class ToolsModule {}
