/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 发布
 */
import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { AsyncApiSub } from 'nestjs-asyncapi'
import { NatsMessagePattern } from '@/common'
import { PublishRecordIdDto, PublishRecordListFilterDto } from './dto/publish.dto'
import { PublishRecordService } from './publishRecord.service'

@Controller()
export class PublishRecordController {
  constructor(private readonly publishRecordService: PublishRecordService) {}

  @AsyncApiSub({
    description: '删除发布记录',
    summary: '删除发布记录',
    channel: 'publish.publishRecord.delete',
    message: {
      payload: PublishRecordIdDto,
    },
  })
  async deletePublishRecord(@Payload() data: PublishRecordIdDto) {
    const res = await this.publishRecordService.deletePublishRecordById(
      data.id,
    )
    return res
  }

  @AsyncApiSub({
    description: '获取发布记录信息',
    summary: '获取发布记录信息',
    channel: 'publish.publishRecord.info',
    message: {
      payload: PublishRecordIdDto,
    },
  })
  @NatsMessagePattern('publish.publishRecord.getPublishRecordInfo')
  async getPublishRecordInfo(@Payload() data: PublishRecordIdDto) {
    const res = await this.publishRecordService.getPublishRecordInfo(data.id)
    return res
  }

  @AsyncApiSub({
    description: '获取发布记录列表',
    summary: '获取发布记录列表',
    channel: 'publish.publishRecord.list',
    message: {
      payload: PublishRecordListFilterDto,
    },
  })
  @NatsMessagePattern('publish.publishRecord.list')
  async getPublishRecordList(@Payload() data: PublishRecordListFilterDto) {
    const res = await this.publishRecordService.getPublishRecordList(data)
    return res
  }
}
