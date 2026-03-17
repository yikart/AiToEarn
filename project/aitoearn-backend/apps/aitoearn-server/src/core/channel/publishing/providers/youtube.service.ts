import { Injectable, Logger } from '@nestjs/common'
import { AssetsService } from '@yikart/assets'
import {
  PublishRecord,
  PublishStatus,
} from '@yikart/mongodb'
import { GaxiosResponse } from 'gaxios'
import { youtube_v3 } from 'googleapis'
import { z } from 'zod'
import { chunkedDownloadFile, getFileSizeFromUrl } from '../../../../common/utils/file.util'
import { YoutubeService } from '../../platforms/youtube/youtube.service'
import { CreatePublishDto } from '../publish.dto'
import { PublishingException } from '../publishing.exception'
import { PublishingTaskResult, VerifyPublishResult } from '../publishing.interface'
import { PublishService } from './base.service'

// YouTube 发布参数验证 Schema
const youtubePublishSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title must be 100 characters or less'),
  desc: z.string()
    .min(1, 'Description is required')
    .max(5000, 'Description must be 5000 characters or less'),
  videoUrl: z.string()
    .min(1, 'Video URL is required')
    .url('Video URL must be a valid URL'),
  option: z.object({
    youtube: z.object({
      categoryId: z.string().min(1, 'Category is required'),
    }).passthrough(),
  }).passthrough(),
}).passthrough()

@Injectable()
export class YoutubePubService extends PublishService {
  private readonly logger = new Logger(YoutubePubService.name)

  constructor(
    private readonly youtubeService: YoutubeService,
    private readonly assetsService: AssetsService,
  ) {
    super()
  }

  async immediatePublish(publishTask: PublishRecord): Promise<PublishingTaskResult> {
    try {
      if (!publishTask.videoUrl) {
        this.logger.error('Video URL is required')
        throw PublishingException.nonRetryable('Video URL is required')
      }
      if (!publishTask.accountId) {
        this.logger.error('Account ID is required')
        throw PublishingException.nonRetryable('Account ID is required')
      }
      publishTask.videoUrl = this.assetsService.buildUrl(publishTask.videoUrl)
      const contentLength = await getFileSizeFromUrl(publishTask.videoUrl)
      const description = this.generatePostMessage(publishTask)
      const videoUpToken = await this.youtubeService.initVideoUpload(
        publishTask.accountId,
        publishTask.title || '',
        description,
        publishTask.topics,
        publishTask?.option?.youtube?.license || 'youtube',
        publishTask?.option?.youtube?.categoryId || '22',
        publishTask?.option?.youtube?.privacyStatus || 'public',
        publishTask?.option?.youtube?.notifySubscribers || false,
        publishTask?.option?.youtube?.embeddable || false,
        publishTask?.option?.youtube?.selfDeclaredMadeForKids || false,
        contentLength,
      )
      if (!videoUpToken) {
        this.logger.error('error initializing video upload')
        throw PublishingException.nonRetryable('error initializing video upload')
      }

      const chunkSize = 1024 * 1024 * 5
      const chunkCount = Math.ceil(contentLength / chunkSize)

      for (let seq = 1; seq <= chunkCount; seq++) {
        const start = (seq - 1) * chunkSize
        const end = Math.min(seq * chunkSize - 1, contentLength - 1)
        const chunkFile = await chunkedDownloadFile(publishTask.videoUrl, [start, end])
        await this.youtubeService.uploadVideoPart(
          publishTask.accountId,
          chunkFile,
          videoUpToken,
          seq,
        )
      }
      const resourceId = await this.youtubeService.videoComplete(
        publishTask.accountId,
        videoUpToken,
        contentLength,
      )
      if (!resourceId) {
        this.logger.error('error completing video upload')
        throw PublishingException.nonRetryable('error completing video upload')
      }
      return {
        postId: resourceId,
        permalink: `https://www.youtube.com/watch?v=${resourceId}`,
        status: PublishStatus.PUBLISHED,
      }
    }
    catch (error) {
      this.logger.error('error publishing video', error)
      throw PublishingException.nonRetryable('error publishing video', error as Record<string, unknown>)
    }
  }

  override async updatePublishedPost(publishTask: PublishRecord, _updatedContentType: string): Promise<PublishingTaskResult> {
    if (!publishTask.dataId) {
      throw PublishingException.nonRetryable('Invalid publish task: no postId')
    }
    if (!publishTask.accountId) {
      throw PublishingException.nonRetryable('Invalid publish task: no accountId')
    }
    const videoSchema: youtube_v3.Schema$Video = {
      id: publishTask.dataId,
      snippet: {
        title: publishTask.title,
        description: this.generatePostMessage(publishTask),
        tags: publishTask.topics,
        categoryId: publishTask.option?.youtube?.categoryId,
      },
      status: {
        privacyStatus: publishTask.option?.youtube?.privacyStatus,
        selfDeclaredMadeForKids: publishTask.option?.youtube?.selfDeclaredMadeForKids,
        embeddable: publishTask.option?.youtube?.embeddable,
        license: publishTask.option?.youtube?.license,
      },
    }
    await this.youtubeService.updateVideo(publishTask.accountId, videoSchema)
    return {
      status: PublishStatus.PUBLISHED,
    }
  }

  override async validatePublishParams(publishTask: CreatePublishDto): Promise<{
    success: boolean
    message?: string
  }> {
    const result = youtubePublishSchema.safeParse(publishTask)

    if (result.success) {
      return {
        success: true,
        message: 'Publish params are valid',
      }
    }

    // 返回第一个验证错误
    const errors = result.error.issues
    const { message, path } = errors[0]
    return {
      success: false,
      message: message ? `${message} ${path.join('.')}` : 'Validation failed',
    }
  }

  async verifyAndCompletePublish(publishRecord: PublishRecord): Promise<VerifyPublishResult> {
    if (!publishRecord.accountId) {
      return {
        success: false,
        errorMsg: `Task ID: ${publishRecord.id} has no associated account, cannot verify publish status`,
      }
    }
    try {
      // YouTube 发布后即完成，验证视频是否存在
      const videoInfo = await this.youtubeService.getVideosInfo(
        publishRecord.accountId,
        publishRecord.dataId || '',
      )

      if (this.isVideoListResponse(videoInfo)) {
        const videoId = videoInfo.data.items?.[0]?.id
        if (videoId) {
          const workLink = `https://www.youtube.com/watch?v=${videoId}`
          return {
            success: true,
            workLink,
          }
        }
      }

      return {
        success: false,
        errorMsg: 'YouTube 视频不存在或已被删除',
      }
    }
    catch (error) {
      this.logger.error(`验证 YouTube 发布状态失败: ${(error as Error).message}`, (error as Error).stack)
      return {
        success: false,
        errorMsg: `验证发布状态失败: ${(error as Error).message}`,
      }
    }
  }

  private isVideoListResponse(
    result: GaxiosResponse<youtube_v3.Schema$VideoListResponse> | unknown,
  ): result is GaxiosResponse<youtube_v3.Schema$VideoListResponse> {
    return result !== null && typeof result === 'object' && 'data' in result
  }
}
