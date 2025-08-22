/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 18:00:18
 * @LastEditors: nevin
 * @Description: 评论回复
 */
import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken } from 'src/auth/auth.guard'
import { TokenInfo } from 'src/auth/interfaces/auth.interfaces'
import { TableDto } from '@/common/dto/table.dto'
import { ReplyCommentRecordNatsApi } from '@/transports/channel/interact/replyCommentRecord.natsApi'
import { AddReplyCommentRecordDto, ReplyCommentRecordFiltersDto } from './dto/replyCommentRecord.dto'

@ApiTags('评论回复记录')
@Controller('channel/replyCommentRecord')
export class ReplyCommentRecordController {
  constructor(private readonly interactionRecordNatsApi: ReplyCommentRecordNatsApi) {}

  @ApiOperation({ summary: '添加评论回复记录' })
  @Post()
  async add(
    @GetToken() token: TokenInfo,
    @Body() data: AddReplyCommentRecordDto,
  ) {
    return this.interactionRecordNatsApi.add({
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
    return this.interactionRecordNatsApi.list(token.id, query, param)
  }

  @ApiOperation({ summary: '删除评论回复记录' })
  @Delete(':id')
  async replyComment(
    @Param('id') id: string,
  ) {
    return this.interactionRecordNatsApi.del(id)
  }
}
