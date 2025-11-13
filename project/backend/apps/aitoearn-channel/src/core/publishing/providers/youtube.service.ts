import { Injectable, Logger } from '@nestjs/common'
import { chunkedDownloadFile, getFileSizeFromUrl } from '../../../common'
import {
  PublishStatus,
  PublishTask,
} from '../../../libs/database/schema/publishTask.schema'
import { YoutubeService } from '../../platforms/youtube/youtube.service'
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
        publishTask?.option?.youtube?.privacyStatus || 'private',
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
}
