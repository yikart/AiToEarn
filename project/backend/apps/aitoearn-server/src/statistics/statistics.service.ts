import { Injectable } from '@nestjs/common'
import { AccountStatus } from '@yikart/mongodb'
import axios from 'axios'
import { ChannelService } from './channel/channel.service'
import { NewAccountCrawlerData } from './common'

@Injectable()
export class StatisticsService {
  constructor(
    private readonly channelService: ChannelService,
  ) { }

  /**
   * TODO: 新频道的上报
   * @param data
   */
  async NewChannelReport(
    data: NewAccountCrawlerData,
  ) {
    const res = await this.channelService.setNewChannels(data.platform, data.uid)
    return res
  }

  async updateStatisticsAccountStatus(userId: string, status: AccountStatus) {
    const res = await axios.post<any>(
      'http://127.0.0.1:3000/api/account/portrait/report',
      { userId, status },
    )
    return res.data
  }
}
