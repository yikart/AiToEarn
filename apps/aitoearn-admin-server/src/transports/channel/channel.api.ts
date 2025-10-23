import { Injectable } from '@nestjs/common'
import { ChannelBaseApi } from '../channelBase.api'
import { PublishRecord } from './common'

@Injectable()
export class ChannelApi extends ChannelBaseApi {
  /**
   * 根据用户任务ID获取对应发布记录
   * @returns
   */
  async getPublishRecardByUserTaskId(userTaskId: string) {
    const res = await this.sendMessage<PublishRecord>(
      'channel/publishRecord/userTask',
      { userTaskId },
    )
    return res
  }

  /**
   * 获取youtobe的视频分类
   */
  async getYouTuBeVideoCategories(accountId: string, regionCode: string) {
    const res = await this.sendMessage<any>(
      'plat/youtube/getVideoCategories',
      { accountId, regionCode },
    )
    return res
  }

  /**
   * 获取B站的分区列表
   */
  async getBilibiliArchiveTypeList(accountId: string) {
    const res = await this.sendMessage<any>(
      'plat/bilibili/archiveTypeList',
      { accountId },
    )

    return res
  }
}
