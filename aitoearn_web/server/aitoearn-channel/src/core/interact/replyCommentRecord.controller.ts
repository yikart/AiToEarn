/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 评论回复记录 replyCommentRecord ReplyCommentRecord
 */
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { NatsMessagePattern } from '@/common';
import { AddReplyCommentRecordDto, ReplyCommentRecordListDto } from './dto/replyCommentRecord.dto';
import { ReplyCommentRecordService } from './replyCommentRecord.service';

@Controller()
export class ReplyCommentRecordController {
  constructor(
    readonly replyCommentRecordService: ReplyCommentRecordService,
  ) {
  }

  @NatsMessagePattern('channel.replyCommentRecord.add')
  async add(@Payload() data: AddReplyCommentRecordDto) {
    return await this.replyCommentRecordService.create(data);
  }

  @NatsMessagePattern('channel.replyCommentRecord.del')
  async del(@Payload() data: { id: string }) {
    return await this.replyCommentRecordService.delete(data.id);
  }

  @NatsMessagePattern('channel.replyCommentRecord.list')
  async list(@Payload() data: ReplyCommentRecordListDto) {
    const res = await this.replyCommentRecordService.getList(data.filters, data.page);
    return res;
  }
}
