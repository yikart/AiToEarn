/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 评论回复记录 replyCommentRecord ReplyCommentRecord
 */
import { Body, Controller, Post } from '@nestjs/common'
import { AddReplyCommentRecordDto, ReplyCommentRecordListDto } from './dto/reply-comment-record.dto'
import { ReplyCommentRecordService } from './reply-comment-record.service'

@Controller()
export class ReplyCommentRecordController {
  constructor(
    readonly replyCommentRecordService: ReplyCommentRecordService,
  ) {
  }

  // @NatsMessagePattern('channel.replyCommentRecord.add')
  @Post('channel/replyCommentRecord/add')
  async add(@Body() data: AddReplyCommentRecordDto) {
    return await this.replyCommentRecordService.create(data)
  }

  // @NatsMessagePattern('channel.replyCommentRecord.del')
  @Post('channel/replyCommentRecord/del')
  async del(@Body() data: { id: string }) {
    return await this.replyCommentRecordService.delete(data.id)
  }

  // @NatsMessagePattern('channel.replyCommentRecord.list')
  @Post('channel/replyCommentRecord/list')
  async list(@Body() data: ReplyCommentRecordListDto) {
    const res = await this.replyCommentRecordService.getList(data.filters, data.page)
    return res
  }
}
