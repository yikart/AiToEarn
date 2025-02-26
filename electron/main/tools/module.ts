/*
 * @Author: nevin
 * @Date: 2025-01-24 16:35:59
 * @LastEditTime: 2025-02-06 19:13:48
 * @LastEditors: nevin
 * @Description: 工具箱模块
 */
import { Module } from '../core/decorators';
import { ToolsController } from './controller';
import { ToolsService } from './service';

@Module({
  controllers: [ToolsController],
  providers: [ToolsService],
})
export class ToolsModule {}
