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
}
