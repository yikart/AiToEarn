/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 18:00:18
 * @LastEditors: nevin
 * @Description: 互动
 */
import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken } from 'src/auth/auth.guard'
import { TokenInfo } from 'src/auth/interfaces/auth.interfaces'
import { TableDto } from '@/common/dto/table.dto'
import { InteractNatsApi } from '@/transports/channel/interact.natsApi'
import { AddArcCommentDto, DelCommentDto, ReplyCommentDto } from './dto/interact.dto'

@ApiTags('渠道互动')
@Controller('channel/interact')
export class InteractController {
  constructor(private readonly interactNatsApi: InteractNatsApi) {}

  @ApiOperation({ summary: '添加作品评论' })
  @Post('addArcComment')
  async addArcComment(
    @GetToken() token: TokenInfo,
    @Body() data: AddArcCommentDto,
  ) {
    return this.interactNatsApi.addArcComment(
      data.accountId,
      data.dataId,
      data.content,
    )
  }

  @ApiOperation({ summary: '获取作品的评论列表' })
  @Get('getArcCommentList/:pageNo/:pageSize')
  async getArcCommentList(
    @GetToken() token: TokenInfo,
    @Query('recordId') recordId: string,
    @Param() query: TableDto,
  ) {
    return this.interactNatsApi.getArcCommentList(recordId, query)
  }

  @ApiOperation({ summary: '回复评论' })
  @Post('replyComment')
  async replyComment(
    @GetToken() token: TokenInfo,
    @Body() data: ReplyCommentDto,
  ) {
    return this.interactNatsApi.replyComment(
      data.accountId,
      data.commentId,
      data.content,
    )
  }

  @ApiOperation({ summary: '删除评论' })
  @Delete('delComment')
  async delComment(
    @GetToken() token: TokenInfo,
    @Body() data: DelCommentDto,
  ) {
    return this.interactNatsApi.delComment(data.accountId, data.commentId)
  }
}
