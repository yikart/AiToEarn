/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 渠道互动记录
 */
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { NatsMessagePattern } from '@/common';
import { AddInteractionRecordDto, InteractionRecordListDto } from './dto/interactionRecord.dto';
import { InteractionRecordService } from './interactionRecord.service';

@Controller()
export class InteractionRecordController {
  constructor(
    readonly interactionRecordService: InteractionRecordService,
  ) {
  }

  @NatsMessagePattern('channel.interactionRecord.add')
  async add(@Payload() data: AddInteractionRecordDto) {
    return await this.interactionRecordService.create(data);
  }

  @NatsMessagePattern('channel.interactionRecord.del')
  async del(@Payload() data: { id: string }) {
    return await this.interactionRecordService.delete(data.id);
  }

  @NatsMessagePattern('channel.interactionRecord.list')
  async list(@Payload() data: InteractionRecordListDto) {
    const res = await this.interactionRecordService.getList(data.filters, data.page);
    return res;
  }
}
