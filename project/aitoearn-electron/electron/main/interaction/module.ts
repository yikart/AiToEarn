/*
 * @Author: nevin
 * @Date: 2025-01-24 16:35:59
 * @LastEditTime: 2025-03-20 22:26:30
 * @LastEditors: nevin
 * @Description: reply Reply 评论
 */
import { AccountModule } from '../account/module';
import { AutoRunModule } from '../autoRun/module';
import { Module } from '../core/decorators';
import { InteractionController } from './controller';
import { InteractionService } from './service';

@Module({
  imports: [AccountModule, AutoRunModule],
  controllers: [InteractionController],
  providers: [InteractionService],
})
export class InteractionModule {}
