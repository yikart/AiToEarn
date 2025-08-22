/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 18:00:18
 * @LastEditors: nevin
 * @Description: 互动记录
 */
import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken } from 'src/auth/auth.guard'
import { TokenInfo } from 'src/auth/interfaces/auth.interfaces'
import { TableDto } from '@/common/dto/table.dto'
import { InteractionRecordNatsApi } from '@/transports/channel/interact/interactionRecord.natsApi'
import { AddInteractionRecordDto, InteractionRecordFiltersDto } from './dto/interactionRecord.dto'

@ApiTags('渠道互动记录')
@Controller('channel/interactionRecord')
export class InteractionRecordController {
  constructor(private readonly interactionRecordNatsApi: InteractionRecordNatsApi) {}

  @ApiOperation({ summary: '添加渠道互动记录' })
  @Post()
  async add(
    @GetToken() token: TokenInfo,
    @Body() data: AddInteractionRecordDto,
  ) {
    return this.interactionRecordNatsApi.add({
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
    return this.interactionRecordNatsApi.list(token.id, query, param)
  }

  @ApiOperation({ summary: '删除记录' })
  @Delete(':id')
  async replyComment(
    @Param('id') id: string,
  ) {
    return this.interactionRecordNatsApi.del(id)
  }
}
