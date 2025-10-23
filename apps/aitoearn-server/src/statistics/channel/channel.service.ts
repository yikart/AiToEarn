import { Injectable, Logger } from '@nestjs/common'
import { RedisService } from '@yikart/redis'
import { AccountType, ChannelRepository } from '@yikart/statistics-db'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '../../config'

interface RedisCookie {
  res: any[]
  version?: string
}

interface HistoryPostsRecordItem {
  userId: string
  platform: AccountType
  uid: string
  postId: string
  accountId?: string
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
   * @param language
   */
  async getDouyinTopic(topic: string, language: string) {
    this.logger.log(`search topic:-- ${topic}, language: ${language}`)
    if (language === 'zh-CN' || language === 'CN' || language === 'zh-Hans') {
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
    else {
      const cookie = await this.getChannelCookie('tiktok')
      const url = `https://www.tiktok.com/api/upload/challenge/sug/?keyword=${topic}&app_language=en`
      this.logger.log(`${url}`)
      const headerParams: AxiosRequestConfig = {
        headers: {
          Cookie: `${cookie.cookie}`,
        },
      }
      const response: AxiosResponse<any> = await axios.get(url, headerParams)
      const names = response?.data.sug_list
        ?.map((item: any) => item?.cha_name)
        ?.filter((v: any) => !!v) ?? []
      return names
    }
  }

  /**
   * 用户选择历史发布记录，记录后发送到草稿箱
   * @param records 历史发布记录数组
   */
  async historyPostsRecord(records: HistoryPostsRecordItem[]) {
    return await this.channelRepository.historyPostsRecord(records)
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
