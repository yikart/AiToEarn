import { Injectable, Logger } from '@nestjs/common'
import { youtube_v3 } from 'googleapis'
import { chunkedDownloadFile, getFileSizeFromUrl } from '../../../common'
import {
  PublishStatus,
  PublishTask,
} from '../../../libs/database/schema/publishTask.schema'
import { YoutubeService } from '../../platforms/youtube/youtube.service'
import { CreatePublishDto } from '../dto/publish.dto'
import { PublishingException } from '../publishing.exception'
import { PublishingTaskResult } from '../publishing.interface'
import { PublishService } from './base.service'

@Injectable()
export class YoutubePubService extends PublishService {
  private readonly logger = new Logger(YoutubePubService.name)

  constructor(
    private readonly youtubeService: YoutubeService,
  ) {
    super()
  }

  async immediatePublish(publishTask: PublishTask): Promise<PublishingTaskResult> {
    try {
      if (!publishTask.videoUrl) {
        this.logger.error('Video URL is required')
        throw PublishingException.nonRetryable('Video URL is required')
      }
      const contentLength = await getFileSizeFromUrl(publishTask.videoUrl)
      const videoUpToken = await this.youtubeService.initVideoUpload(
        publishTask.accountId,
        publishTask.title || '',
        publishTask.desc || '',
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
      throw PublishingException.nonRetryable('error publishing video', error)
    }
  }

  override async updatePublishedPost(publishTask: PublishTask, _updatedContentType: string): Promise<PublishingTaskResult> {
    if (!publishTask.dataId) {
      throw PublishingException.nonRetryable('Invalid publish task: no postId')
    }
    const videoSchema: youtube_v3.Schema$Video = {
      id: publishTask.dataId,
      snippet: {
        title: publishTask.title,
        description: publishTask.desc,
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
    if (!publishTask.title) {
      return {
        success: false,
        message: 'Title is required',
      }
    }
    if (publishTask.title.length > 100) {
      return {
        success: false,
        message: 'Title must be 100 characters or less',
      }
    }
    if (!publishTask.desc) {
      return {
        success: false,
        message: 'Description is required',
      }
    }
    if (publishTask.desc.length > 5000) {
      return {
        success: false,
        message: 'Description must be 5000 characters or less',
      }
    }
    if (!publishTask.videoUrl) {
      return {
        success: false,
        message: 'Video URL is required',
      }
    }
    if (!publishTask.option?.youtube?.categoryId) {
      return {
        success: false,
        message: 'Category is required',
      }
    }
    return {
      success: true,
      message: 'Publish params are valid',
    }
  }
}
