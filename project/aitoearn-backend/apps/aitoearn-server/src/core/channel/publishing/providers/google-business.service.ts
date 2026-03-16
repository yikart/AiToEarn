import { Injectable, Logger } from '@nestjs/common'
import { PublishRecord, PublishStatus } from '@yikart/mongodb'
import { GoogleBusinessService } from '../../platforms/google-business/google-business.service'
import { CreatePublishDto } from '../publish.dto'
import { PublishingException } from '../publishing.exception'
import { PublishingTaskResult, VerifyPublishResult } from '../publishing.interface'
import { PublishService } from './base.service'

interface GoogleDate {
  year: number
  month: number
  day: number
}

interface GoogleTimeOfDay {
  hours: number
  minutes: number
  seconds?: number
}

interface GoogleLocalPost {
  languageCode: string
  summary?: string
  topicType: 'STANDARD' | 'EVENT' | 'OFFER'
  media?: Array<{
    mediaFormat: 'PHOTO' | 'VIDEO'
    sourceUrl: string
  }>
  callToAction?: {
    actionType: string
    url: string
  }
  offer?: {
    couponCode?: string
    redeemOnlineUrl?: string
    termsConditions?: string
  }
  event?: {
    title: string
    schedule: {
      startDate: GoogleDate
      startTime?: GoogleTimeOfDay
      endDate: GoogleDate
      endTime?: GoogleTimeOfDay
    }
  }
}

@Injectable()
export class GoogleBusinessPubService extends PublishService {
  private readonly logger = new Logger(GoogleBusinessPubService.name)
  private readonly apiUrl = 'https://mybusiness.googleapis.com/v4'

  constructor(
    private readonly googleBusinessService: GoogleBusinessService,
  ) {
    super()
  }

  /**
   * 立即发布
   */
  async immediatePublish(publishTask: PublishRecord): Promise<PublishingTaskResult> {
    if (!publishTask.accountId) {
      throw new PublishingException('AccountId is required', false)
    }
    const credential = await this.googleBusinessService.getCredential(publishTask.accountId)
    if (!credential) {
      throw PublishingException.nonRetryable('账户凭证不存在')
    }

    const accessToken = await this.googleBusinessService.getValidAccessToken(publishTask.accountId)

    // 构建帖子
    const localPost = this.buildLocalPost(publishTask)

    // 调用 API 发布
    const response = await fetch(
      `${this.apiUrl}/${credential.locationId}/localPosts`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(localPost),
      },
    )

    if (!response.ok) {
      const error = await response.json() as any
      const errorMessage = error.error?.message || '发布失败'

      // 判断是否可重试
      if (response.status === 429 || response.status >= 500) {
        throw PublishingException.retryable(`Google Business 发布失败: ${errorMessage}`, { error })
      }

      throw PublishingException.nonRetryable(`Google Business 发布失败: ${errorMessage}`, { error })
    }

    const result = await response.json() as any
    const postId = result.name?.split('/').pop() || ''
    const searchUrl = result.searchUrl || ''

    return {
      status: PublishStatus.PUBLISHED,
      postId,
      permalink: searchUrl,
      extra: { dataOption: { postName: result.name } },
    }
  }

  /**
   * 验证发布是否成功
   */
  async verifyAndCompletePublish(publishRecord: PublishRecord): Promise<VerifyPublishResult> {
    try {
      if (!publishRecord.accountId) {
        return {
          success: false,
          errorMsg: `Task ID: ${publishRecord.id} has no associated account, cannot verify publish status`,
        }
      }
      const accessToken = await this.googleBusinessService.getValidAccessToken(publishRecord.accountId)
      const credential = await this.googleBusinessService.getCredential(publishRecord.accountId)
      if (!credential) {
        return { success: false, errorMsg: '账户凭证不存在' }
      }

      const response = await fetch(
        `${this.apiUrl}/${credential.locationId}/localPosts/${publishRecord.dataId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      )

      if (!response.ok) {
        return { success: false, errorMsg: '帖子不存在' }
      }

      const post = await response.json() as any
      return {
        success: post.state === 'LIVE',
        workLink: post.searchUrl,
      }
    }
    catch (error) {
      this.logger.error('验证发布状态失败', error)
      return { success: false, errorMsg: '验证失败' }
    }
  }

  /**
   * 验证发布参数
   */
  override async validatePublishParams(dto: CreatePublishDto): Promise<{ success: boolean, message?: string }> {
    const option = dto.option?.googleBusiness

    // 必须有内容或图片
    if (!dto.desc && (!dto.imgUrlList || dto.imgUrlList.length === 0)) {
      return { success: false, message: '帖子需要包含文字或图片' }
    }

    // EVENT 类型必须有活动信息
    if (option?.topicType === 'EVENT') {
      if (!option.event?.title || !option.event?.startDate || !option.event?.endDate) {
        return { success: false, message: '活动帖子需要标题和时间' }
      }
    }

    // CTA 必须有 URL
    if (option?.callToAction?.actionType && !option.callToAction.url) {
      return { success: false, message: '行动号召需要提供跳转链接' }
    }

    return { success: true }
  }

  /**
   * 构建 LocalPost 对象
   */
  private buildLocalPost(publishTask: PublishRecord): GoogleLocalPost {
    const option = publishTask.option?.googleBusiness || {}

    const localPost: GoogleLocalPost = {
      languageCode: 'zh-CN',
      summary: this.generatePostMessage(publishTask),
      topicType: option.topicType || 'STANDARD',
    }

    // 图片
    if (publishTask.imgUrlList && publishTask.imgUrlList.length > 0) {
      localPost.media = publishTask.imgUrlList.map(url => ({
        mediaFormat: 'PHOTO' as const,
        sourceUrl: url,
      }))
    }

    // 行动号召
    if (option.callToAction?.actionType) {
      localPost.callToAction = {
        actionType: option.callToAction.actionType,
        url: option.callToAction.url,
      }
    }

    // 优惠信息
    if (option.topicType === 'OFFER' && option.offer) {
      localPost.offer = {
        couponCode: option.offer.couponCode,
        redeemOnlineUrl: option.offer.redeemOnlineUrl,
        termsConditions: option.offer.termsConditions,
      }
    }

    // 活动信息
    if (option.topicType === 'EVENT' && option.event) {
      localPost.event = {
        title: option.event.title,
        schedule: {
          startDate: this.parseDate(option.event.startDate),
          startTime: option.event.startTime ? this.parseTime(option.event.startTime) : undefined,
          endDate: this.parseDate(option.event.endDate),
          endTime: option.event.endTime ? this.parseTime(option.event.endTime) : undefined,
        },
      }
    }

    return localPost
  }

  /**
   * 解析日期字符串为 Google Date 对象
   */
  private parseDate(dateStr: string): GoogleDate {
    const [year, month, day] = dateStr.split('-').map(Number)
    return { year, month, day }
  }

  /**
   * 解析时间字符串为 Google TimeOfDay 对象
   */
  private parseTime(timeStr: string): GoogleTimeOfDay {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return { hours, minutes }
  }
}
