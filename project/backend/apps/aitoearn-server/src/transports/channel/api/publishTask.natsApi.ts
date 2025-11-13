import { Injectable } from '@nestjs/common'
import { PubRecordListFilterDto } from '../../../channel/dto/publish.dto'
import { ChannelBaseApi } from '../../channelBase.api'

@Injectable()
export class PublishTaskNatsApi extends ChannelBaseApi {
  async getPublishTaskList(userId: string, query: PubRecordListFilterDto) {
    const res = await this.sendMessage<any[]>(
      `channel/publishTask/list`,
      { userId, ...query },
    )
    return res
  }

  async getQueuedPublishTasks(userId: string, query: PubRecordListFilterDto) {
    const res = await this.sendMessage<any[]>(
      `channel/status/queued/tasks`,
      { userId, ...query },
    )
    return res
  }

  async getPublishedPublishTasks(userId: string, query: PubRecordListFilterDto) {
    const res = await this.sendMessage<any[]>(
      `channel/status/published/tasks`,
      { userId, ...query },
    )
    return res
  }
}
