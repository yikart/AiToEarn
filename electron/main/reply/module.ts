/*
 * @Author: nevin
 * @Date: 2025-01-24 16:35:59
 * @LastEditTime: 2025-02-06 19:14:24
 * @LastEditors: nevin
 * @Description: reply Reply 评论
 */
import { AccountModule } from '../account/module';
import { Module } from '../core/decorators';
import { ReplyController } from './controller';
import { ReplyService } from './service';

@Module({
  imports: [AccountModule],
  controllers: [ReplyController],
  providers: [ReplyService],
})
export class ReplyModule {}
