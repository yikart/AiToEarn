/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 18:00:18
 * @LastEditors: nevin
 * @Description: 互动
 */
import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { TableDto } from '@yikart/common'
import { GetToken } from '../../auth/auth.guard'
import { TokenInfo } from '../../auth/interfaces/auth.interfaces'
import { AddArcCommentDto, DelCommentDto, ReplyCommentDto } from './dto/interact.dto'
import { InteractService } from './interact.service'

@ApiTags('渠道互动')
@Controller('channel/interact')
export class InteractController {
  constructor(private readonly interactService: InteractService) {}

  @ApiOperation({ summary: '添加作品评论' })
  @Post('addArcComment')
  async addArcComment(
    @GetToken() token: TokenInfo,
    @Body() data: AddArcCommentDto,
  ) {
    return this.interactService.addArcComment(
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
    return this.interactService.getArcCommentList(recordId, query)
  }

  @ApiOperation({ summary: '回复评论' })
  @Post('replyComment')
  async replyComment(
    @GetToken() token: TokenInfo,
    @Body() data: ReplyCommentDto,
  ) {
    return this.interactService.replyComment(
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
    return this.interactService.delComment(data.accountId, data.commentId)
  }
}
