import { Injectable } from '@nestjs/common'
import { PlatPublishNatsApi } from 'src/transports/plat/publish.natsApi'
import { NewPublishData, NewPublishRecordData, PlatOptons } from './common'
import { PubRecordListFilterDto } from './dto/publish.dto'

@Injectable()
export class PublishService {
  constructor(private readonly platPublishNatsApi: PlatPublishNatsApi) {}

  async create(newData: NewPublishData<PlatOptons>) {
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
}
