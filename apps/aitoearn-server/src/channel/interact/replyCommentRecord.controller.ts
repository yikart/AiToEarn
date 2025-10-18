/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 18:00:18
 * @LastEditors: nevin
 * @Description: 评论回复
 */
import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { TableDto } from '@yikart/common'
import { GetToken } from '../../auth/auth.guard'
import { TokenInfo } from '../../auth/interfaces/auth.interfaces'
import { AddReplyCommentRecordDto, ReplyCommentRecordFiltersDto } from './dto/replyCommentRecord.dto'
import { ReplyCommentRecordService } from './replyCommentRecord.service'

@ApiTags('评论回复记录')
@Controller('channel/replyCommentRecord')
export class ReplyCommentRecordController {
  constructor(private readonly replyCommentRecordService: ReplyCommentRecordService) {}

  @ApiOperation({ summary: '添加评论回复记录' })
  @Post()
  async add(
    @GetToken() token: TokenInfo,
    @Body() data: AddReplyCommentRecordDto,
  ) {
    return this.replyCommentRecordService.add({
      userId: token.id,
      ...data,
    })
  }

  @ApiOperation({ summary: '获取评论回复记录列表' })
  @Get('list/:pageNo/:pageSize')
  async getArcCommentList(
    @GetToken() token: TokenInfo,
    @Query() query: ReplyCommentRecordFiltersDto,
    @Param() param: TableDto,
  ) {
    return this.replyCommentRecordService.list(token.id, query, param)
  }

  @ApiOperation({ summary: '删除评论回复记录' })
  @Delete(':id')
  async replyComment(
    @Param('id') id: string,
  ) {
    return this.replyCommentRecordService.del(id)
  }
}
