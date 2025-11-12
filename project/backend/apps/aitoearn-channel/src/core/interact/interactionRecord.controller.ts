/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 渠道互动记录
 */
import { Body, Controller, Post } from '@nestjs/common'
import { AddInteractionRecordDto, InteractionRecordListDto } from './dto/interactionRecord.dto'
import { InteractionRecordService } from './interactionRecord.service'

@Controller()
export class InteractionRecordController {
  constructor(
    readonly interactionRecordService: InteractionRecordService,
  ) {
  }

  // @NatsMessagePattern('channel.interactionRecord.add')
  @Post('channel/interactionRecord/add')
  async add(@Body() data: AddInteractionRecordDto) {
    return await this.interactionRecordService.create(data)
  }

  // @NatsMessagePattern('channel.interactionRecord.del')
  @Post('channel/interactionRecord/del')
  async del(@Body() data: { id: string }) {
    return await this.interactionRecordService.delete(data.id)
  }

  // @NatsMessagePattern('channel.interactionRecord.list')
  @Post('channel/interactionRecord/list')
  async list(@Body() data: InteractionRecordListDto) {
    const res = await this.interactionRecordService.getList(data.filters, data.page)
    return res
  }
}
