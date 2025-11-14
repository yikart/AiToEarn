/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 18:00:18
 * @LastEditors: nevin
 * @Description: 评论回复
 */
import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, TableDto } from '@yikart/common'
import { ReplyCommentRecordNatsApi } from '../../transports/channel/api/interact/replyCommentRecord.natsApi'
import { AddReplyCommentRecordDto, ReplyCommentRecordFiltersDto } from './dto/replyCommentRecord.dto'

@ApiTags('OpenSource/Engage/ReplyCommentRecord')
@Controller('channel/replyCommentRecord')
export class ReplyCommentRecordController {
  constructor(private readonly replyCommentRecordNatsApi: ReplyCommentRecordNatsApi) {}

  @ApiDoc({
    summary: 'Add Reply Comment Record',
    body: AddReplyCommentRecordDto.schema,
  })
  @Post()
  async add(
    @GetToken() token: TokenInfo,
    @Body() data: AddReplyCommentRecordDto,
  ) {
    return this.replyCommentRecordNatsApi.add({
      userId: token.id,
      ...data,
    })
  }

  @ApiDoc({
    summary: 'List Reply Comment Records',
    query: ReplyCommentRecordFiltersDto.schema,
  })
  @Get('list/:pageNo/:pageSize')
  async getArcCommentList(
    @GetToken() token: TokenInfo,
    @Query() query: ReplyCommentRecordFiltersDto,
    @Param() param: TableDto,
  ) {
    return this.replyCommentRecordNatsApi.list(token.id, query, param)
  }

  @ApiDoc({
    summary: 'Delete Reply Comment Record',
  })
  @Delete(':id')
  async replyComment(
    @Param('id') id: string,
  ) {
    return this.replyCommentRecordNatsApi.del(id)
  }
}
