/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 评论回复记录 replyCommentRecord ReplyCommentRecord
 */
import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ApiDoc } from '@yikart/common'
import { AddReplyCommentRecordDto, ReplyCommentRecordListDto } from './dto/reply-comment-record.dto'
import { ReplyCommentRecordService } from './reply-comment-record.service'

@ApiTags('OpenSource/Core/Interact/ReplyCommentRecord')
@Controller()
export class ReplyCommentRecordController {
  constructor(
    readonly replyCommentRecordService: ReplyCommentRecordService,
  ) {
  }

  // @NatsMessagePattern('channel.replyCommentRecord.add')
  @ApiDoc({
    summary: 'Add Reply Comment Record',
    body: AddReplyCommentRecordDto.schema,
  })
  @Post('channel/replyCommentRecord/add')
  async add(@Body() data: AddReplyCommentRecordDto) {
    return await this.replyCommentRecordService.create(data)
  }

  // @NatsMessagePattern('channel.replyCommentRecord.del')
  @ApiDoc({
    summary: 'Delete Reply Comment Record',
  })
  @Post('channel/replyCommentRecord/del')
  async del(@Body() data: { id: string }) {
    return await this.replyCommentRecordService.delete(data.id)
  }

  // @NatsMessagePattern('channel.replyCommentRecord.list')
  @ApiDoc({
    summary: 'List Reply Comment Records',
    body: ReplyCommentRecordListDto.schema,
  })
  @Post('channel/replyCommentRecord/list')
  async list(@Body() data: ReplyCommentRecordListDto) {
    const res = await this.replyCommentRecordService.getList(data.filters, data.page)
    return res
  }
}
