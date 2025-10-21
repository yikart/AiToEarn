import { Injectable, Logger } from '@nestjs/common'
import { RedisService } from '@yikart/redis'
import { AccountType, ChannelRepository } from '@yikart/statistics-db'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '../../config'

interface RedisCookie {
  res: any[]
  version?: string
}

@Injectable()
export class ChannelService {
  private readonly logger = new Logger(ChannelService.name)

  constructor(
    private readonly channelRepository: ChannelRepository,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 获取平台 公用cookie
   *  @param platform
   */
  async getChannelCookie(platform: string) {
    const channelCookie = await this.redisService.getJson<RedisCookie>(
      `cookie:channel:${platform}:common`,
    )

    const res = channelCookie?.res
    const chosen = Array.isArray(res) && res.length > 0
      ? res[Math.floor(Math.random() * res.length)]
      : {}
    return chosen
  }

  /**
   * 获取抖音话题
   * @param topic
   */
  async getDouyinTopic(topic: string) {
    this.logger.log(`search topic:-- ${topic}`)
    const cookie = await this.getChannelCookie('douyin')
    const url = `${config.moreApi.platApiUri}/api/douyin/search_topic`
    this.logger.log(`${url}`)
    const headerParams: AxiosRequestConfig = {
      headers: {
        Cookie: `${cookie.cookie}`,
      },
    }
    const params = {
      keyword: topic,
      count: 10,
      cursor: '0',
      search_id: '',
      proxy: '',
    }
    const response: AxiosResponse<any> = await axios.post(url, params, headerParams)
    // 从响应中提取 cha_name 数组
    const names = response?.data?.data?.challenge_list
      ?.map((item: any) => item?.challenge_info?.cha_name)
      ?.filter((v: any) => !!v) ?? []
    return names
  }

  /**
   * 用户选择历史发布记录，记录后发送到草稿箱
   * @param userId
   * @param platform
   * @param uid
   * @param postId
   * @param accountId
   */
  async historyPostsRecord(userId: string, platform: AccountType, uid: string, postId: string, accountId?: string) {
    return await this.channelRepository.historyPostsRecord(userId, platform, uid, postId, accountId)
  }

  /**
   * query history add to draft status
   * @param userId
   */
  async historyPostsRecordStatus(userId: string) {
    return await this.channelRepository.historyPostsRecordStatus(userId)
  }

  /**
   * 最近一个月平均数据
   * @param platform
   * @param uid
   */
  async averageDataMonthly(platform: AccountType, uid: string) {
    return await this.channelRepository.averageDataMonthly(platform, uid)
  }
}
