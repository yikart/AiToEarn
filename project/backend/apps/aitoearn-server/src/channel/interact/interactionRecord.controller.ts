/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 18:00:18
 * @LastEditors: nevin
 * @Description: 互动记录
 */
import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, TableDto } from '@yikart/common'
import { InteractionRecordNatsApi } from '../../transports/channel/api/interact/interactionRecord.natsApi'
import { AddInteractionRecordDto, InteractionRecordFiltersDto } from './dto/interactionRecord.dto'

@ApiTags('OpenSource/Engage/InteractionRecord')
@Controller('channel/interactionRecord')
export class InteractionRecordController {
  constructor(private readonly interactionRecordNatsApi: InteractionRecordNatsApi) {}

  @ApiDoc({
    summary: 'Add Interaction Record',
    body: AddInteractionRecordDto.schema,
  })
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

  @ApiDoc({
    summary: 'List Interaction Records',
    query: InteractionRecordFiltersDto.schema,
  })
  @Get('list/:pageNo/:pageSize')
  async getArcCommentList(
    @GetToken() token: TokenInfo,
    @Query() query: InteractionRecordFiltersDto,
    @Param() param: TableDto,
  ) {
    return this.interactionRecordNatsApi.list(token.id, query, param)
  }

  @ApiDoc({
    summary: 'Delete Interaction Record',
  })
  @Delete(':id')
  async replyComment(
    @Param('id') id: string,
  ) {
    return this.interactionRecordNatsApi.del(id)
  }
}
