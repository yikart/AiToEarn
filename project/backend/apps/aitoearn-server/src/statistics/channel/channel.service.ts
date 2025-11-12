import { Injectable, Logger } from '@nestjs/common'
import { AccountType } from '@yikart/common'
import { RedisService } from '@yikart/redis'
import { ChannelRepository, JobTaskStatus, PostRepository } from '@yikart/statistics-db'
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
   * get platform cookie
   *  @param platform
   */
  async getChannelCookie(platform: string) {
    const channelCookie = await this.channelRepository.getChannelCookieByPlatform(platform)
    this.logger.log(`get cookie from db: ${channelCookie?._id}`)
    const res = channelCookie?.res
    const chosen = Array.isArray(res) && res.length > 0
      ? res[Math.floor(Math.random() * res.length)]
      : { cookie: '' }
    return chosen
  }

  /**
   * Topic search
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
      // Extract cha_name array from response
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
   * User selects history publish records and sends them to draft
   * @param records history records array
   */
  async historyPostsRecord(records: HistoryPostsRecordItem[]) {
    // Batch fetch details for each record
    const detailPromises = records.map(async (record) => {
      try {
        const postDetail = await this.postRepository.getPostsByPid({
          platform: record.platform,
          postId: record.postId,
        })

        // Check if valid data is returned
        const hasDetail = postDetail && Object.keys(postDetail).length > 0
        const detail = postDetail as any // Type assertion for possibly empty result

        // Merge fetched details with original data
        return {
          ...record,
          // Override original with details if present
          title: hasDetail && detail.title ? detail.title : (record.title || ''),
          desc: hasDetail && detail.desc ? detail.desc : (record.desc || ''),
          cover: hasDetail && detail.cover ? detail.cover : (record.cover || ''),
          publishTime: hasDetail && detail.publishTime ? new Date(detail.publishTime) : (record.publishTime || new Date()),
          // Additional fields from detail
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
        // Fallback to original record on error
        return record
      }
    })

    // Wait for all detail queries to complete
    const mergedRecords = await Promise.all(detailPromises)

    // Pass merged data to subsequent processing
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
   * Average data for the last month
   * @param platform
   * @param uid
   */
  async averageDataMonthly(platform: AccountType, uid: string) {
    return await this.channelRepository.averageDataMonthly(platform, uid)
  }

  /**
   * Submit channel for crawling
   * @param platform platform type
   * @param uid channel uid
   */
  async submitChannelCrawling(platform: AccountType, uid: string) {
    try {
      const result = await this.channelRepository.submitChannelCrawling({
        platform,
        uid,
        createAt: new Date(),
        updateAt: new Date(),
        status: JobTaskStatus.Pending,
      })
      this.logger.log(`Submitted channel for crawling: platform=${platform}, uid=${uid}`)
      return result
    }
    catch (error) {
      this.logger.error(`Failed to submit channel for crawling: ${(error as Error).message}`)
      throw error
    }
  }

  /**
   * new channel report to crawler
   */
  async setNewChannels(platform: string, uid: string) {
    return this.channelRepository.setNewChannels(platform, uid)
  }
}
