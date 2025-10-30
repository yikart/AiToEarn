import { Injectable, Logger } from '@nestjs/common'
import { RedisService } from '@yikart/redis'
import { AccountType, ChannelRepository, PostRepository } from '@yikart/statistics-db'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '../../config'

interface HistoryPostsRecordItem {
  userId: string
  platform: AccountType
  uid: string
  postId: string
  accountId?: string
  title?: string
  desc?: string
  cover?: string
  publishTime?: Date
  // 新增字段用于存储详情数据
  mediaType?: string
  url?: string
  viewCount?: number
  commentCount?: number
  likeCount?: number
  shareCount?: number
  favoriteCount?: number
}

@Injectable()
export class ChannelService {
  private readonly logger = new Logger(ChannelService.name)

  constructor(
    private readonly channelRepository: ChannelRepository,
    private readonly postRepository: PostRepository,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 获取平台 公用cookie
   *  @param platform
   */
  async getChannelCookie(platform: string) {
    const channelCookie = await this.channelRepository.getChannelCookieByPlatform(platform)
    this.logger.log(`get cookie from db: ${channelCookie}`)
    const res = channelCookie?.res
    const chosen = Array.isArray(res) && res.length > 0
      ? res[Math.floor(Math.random() * res.length)]
      : { cookie: '' }
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
    // 批量查询每个记录的详情数据
    const detailPromises = records.map(async (record) => {
      try {
        const postDetail = await this.postRepository.getPostsByPid({
          platform: record.platform,
          postId: record.postId,
        })

        // 检查是否查询到有效数据
        const hasDetail = postDetail && Object.keys(postDetail).length > 0
        const detail = postDetail as any // 类型断言，因为getPostsByPid可能返回空对象

        // 将查询到的详情与原始数据合并
        return {
          ...record,
          // 如果查询到详情，则用详情数据覆盖原始数据
          title: hasDetail && detail.title ? detail.title : (record.title || ''),
          desc: hasDetail && detail.desc ? detail.desc : (record.desc || ''),
          cover: hasDetail && detail.cover ? detail.cover : (record.cover || ''),
          publishTime: hasDetail && detail.publishTime ? new Date(detail.publishTime) : (record.publishTime || new Date()),
          // 添加详情数据中的其他字段
          mediaType: hasDetail ? detail.mediaType : '',
          url: hasDetail ? detail.url : '',
          viewCount: hasDetail ? detail.readCount : 0,
          commentCount: hasDetail ? detail.commentCount : 0,
          likeCount: hasDetail ? detail.likeCount : 0,
          shareCount: hasDetail ? detail.forwardCount : 0,
          favoriteCount: hasDetail ? detail.collectCount : 0,
        }
      }
      catch (error) {
        this.logger.warn(`Failed to get detail for post ${record.postId}: ${(error as Error).message}`)
        // 如果查询失败，返回原始数据
        return record
      }
    })

    // 等待所有详情查询完成
    const mergedRecords = await Promise.all(detailPromises)

    // 将合并后的数据传递给后续业务处理
    return await this.channelRepository.historyPostsRecord(mergedRecords)
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
