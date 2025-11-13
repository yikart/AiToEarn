/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 17:58:21
 * @LastEditors: nevin
 * @Description: b站
 */
import { Injectable, Logger } from '@nestjs/common'
import { chunkedDownloadFile, fileUrlToBase64, getRemoteFileSize } from '../../../common'
import {
  PublishStatus,
  PublishTask,
} from '../../../libs/database/schema/publishTask.schema'
import { KwaiService } from '../../platforms/kwai/kwai.service'
import { PublishingException } from '../publishing.exception'
import { PublishingTaskResult } from '../publishing.interface'
import { PublishService } from './base.service'

@Injectable()
export class kwaiPubService extends PublishService {
  private readonly logger: Logger = new Logger(kwaiPubService.name)
  constructor(
    private readonly kwaiService: KwaiService,
  ) {
    super()
  }

  private getCaption(publishiTask: PublishTask) {
    const { desc, topics } = publishiTask
    let caption = ''

    if (desc) {
      caption += `${desc} `
    }

    if (topics && topics.length !== 0) {
      for (const topic of topics) {
        caption += `#${topic} `
      }
    }

    return caption.trim()
  }

  async uploadVideo(publishTask: PublishTask): Promise<string> {
    const { accountId, videoUrl } = publishTask
    const startUploadInfo = await this.kwaiService.initVideoUpload(accountId)
    if (startUploadInfo.result !== 1) {
      throw PublishingException.nonRetryable('init kwai video upload failed')
    }

    const contentLength = await getRemoteFileSize(videoUrl)
    if (!contentLength) {
      throw PublishingException.nonRetryable('get video meta failed')
    }
    let chunkSize = 5 * 1024 * 1024 // 5MB
    if (contentLength < chunkSize) {
      chunkSize = contentLength
    }

    const totalParts = Math.ceil(contentLength / chunkSize)
    for (let seq = 0; seq < totalParts; seq++) {
      const start = seq * chunkSize
      const end = Math.min(start + chunkSize - 1, contentLength - 1)
      const range: [number, number] = [start, end]
      const videoBlob = await chunkedDownloadFile(videoUrl, range)
      if (!videoBlob) {
        throw new Error('download video chunk failed')
      }

      const uploadResult = await this.kwaiService.chunkedUploadVideo(
        startUploadInfo.upload_token,
        seq,
        startUploadInfo.endpoint,
        videoBlob,
      )
      this.logger.log(`chunked upload complete: ${JSON.stringify(uploadResult)}`)
    }

    const finalizeUploadRes = await this.kwaiService.finalizeVideoUpload(
      startUploadInfo.upload_token,
      totalParts,
      startUploadInfo.endpoint,
    )
    if (finalizeUploadRes.result !== 1) {
      throw PublishingException.nonRetryable('finalize kwai video upload failed')
    }

    this.logger.log('Video upload complete, proceed to publish')
    return startUploadInfo.upload_token
  }

  async immediatePublish(publishTask: PublishTask): Promise<PublishingTaskResult> {
    const { accountId, coverUrl, videoUrl } = publishTask

    if (!videoUrl) {
      throw PublishingException.nonRetryable('videoUrl is required for kwai publish')
    }

    if (!coverUrl) {
      throw PublishingException.nonRetryable('coverUrl is required for kwai publish')
    }
    const uploadToken = await this.uploadVideo(publishTask)
    const coverBase64 = await fileUrlToBase64(coverUrl)
    const buffer = Buffer.from(coverBase64, 'base64')
    const coverBlob = new Blob([buffer], { type: 'image/jpeg' })

    const result = await this.kwaiService.publishVideo(
      accountId,
      this.getCaption(publishTask),
      coverBlob,
      uploadToken,
    )
    return {
      postId: result.video_info.photo_id,
      permalink: `https://www.kuaishou.com/short-video/${result.video_info.photo_id}`,
      status: PublishStatus.PUBLISHED,
    }
  }
}
