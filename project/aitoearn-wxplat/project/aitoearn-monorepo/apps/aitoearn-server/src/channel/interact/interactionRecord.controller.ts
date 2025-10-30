/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 18:00:18
 * @LastEditors: nevin
 * @Description: 互动记录
 */
import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { TableDto } from '@yikart/common'
import { AddInteractionRecordDto, InteractionRecordFiltersDto } from './dto/interactionRecord.dto'
import { InteractionRecordService } from './interactionRecord.service'

@ApiTags('渠道互动记录')
@Controller('channel/interactionRecord')
export class InteractionRecordController {
  constructor(private readonly interactionRecordService: InteractionRecordService) {}

  @ApiOperation({ summary: '添加渠道互动记录' })
  @Post()
  async add(
    @GetToken() token: TokenInfo,
    @Body() data: AddInteractionRecordDto,
  ) {
    return this.interactionRecordService.add({
      userId: token.id,
      ...data,
    })
  }

  @ApiOperation({ summary: '获取渠道互动记录列表' })
  @Get('list/:pageNo/:pageSize')
  async getArcCommentList(
    @GetToken() token: TokenInfo,
    @Query() query: InteractionRecordFiltersDto,
    @Param() param: TableDto,
  ) {
    return this.interactionRecordService.list(token.id, query, param)
  }

  @ApiOperation({ summary: '删除记录' })
  @Delete(':id')
  async replyComment(
    @Param('id') id: string,
  ) {
    return this.interactionRecordService.del(id)
  }
}
