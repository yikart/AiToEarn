/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 18:00:18
 * @LastEditors: nevin
 * @Description: 互动
 */
import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, TableDto } from '@yikart/common'
import { InteractNatsApi } from '../../transports/channel/api/interact/interact.natsApi'
import { AddArcCommentDto, DelCommentDto, ReplyCommentDto } from './dto/interact.dto'

@ApiTags('OpenSource/Engage/Interact')
@Controller('channel/interact')
export class InteractController {
  constructor(private readonly interactApi: InteractNatsApi) {}

  @ApiDoc({
    summary: 'Add Comment to Post',
    body: AddArcCommentDto.schema,
  })
  @Post('addArcComment')
  async addArcComment(
    @GetToken() token: TokenInfo,
    @Body() data: AddArcCommentDto,
  ) {
    return this.interactApi.addArcComment(
      data.accountId,
      data.dataId,
      data.content,
    )
  }

  @ApiDoc({
    summary: 'Get Comment List',
  })
  @Get('getArcCommentList/:pageNo/:pageSize')
  async getArcCommentList(
    @GetToken() token: TokenInfo,
    @Query('recordId') recordId: string,
    @Param() query: TableDto,
  ) {
    return this.interactApi.getArcCommentList(recordId, query)
  }

  @ApiDoc({
    summary: 'Reply to Comment',
    body: ReplyCommentDto.schema,
  })
  @Post('replyComment')
  async replyComment(
    @GetToken() token: TokenInfo,
    @Body() data: ReplyCommentDto,
  ) {
    return this.interactApi.replyComment(
      data.accountId,
      data.commentId,
      data.content,
    )
  }

  @ApiDoc({
    summary: 'Delete Comment',
    body: DelCommentDto.schema,
  })
  @Delete('delComment')
  async delComment(
    @GetToken() token: TokenInfo,
    @Body() data: DelCommentDto,
  ) {
    return this.interactApi.delComment(data.accountId, data.commentId)
  }
}
