import { Injectable } from '@nestjs/common'
import { PlatPublishNatsApi } from 'src/transports/plat/publish.natsApi'
import { TableDto } from '@/common/dto/table.dto'
import { NewPublishData, NewPublishRecordData, PlatOptions } from './common'
import { PublishDayInfoListFiltersDto, PubRecordListFilterDto } from './dto/publish.dto'

@Injectable()
export class PublishService {
  constructor(private readonly platPublishNatsApi: PlatPublishNatsApi) {}

  async create(newData: NewPublishData<PlatOptions>) {
    const res = await this.platPublishNatsApi.create(newData)
    return res
  }

  async createRecord(newData: NewPublishRecordData) {
    const res = await this.platPublishNatsApi.createRecord(newData)
    return res
  }

  async run(id: string) {
    const res = await this.platPublishNatsApi.run(id)
    return res
  }

  async getList(data: PubRecordListFilterDto, userId: string) {
    return await this.platPublishNatsApi.getPublishRecordList({
      ...data,
      userId,
    })
  }

  async publishInfoData(userId: string) {
    const res = await this.platPublishNatsApi.getPublishInfoData(userId)
    return res
  }

  async publishDataInfoList(userId: string, data: PublishDayInfoListFiltersDto, page: TableDto) {
    return await this.platPublishNatsApi.publishDataInfoList(userId, data, page)
  }
}
