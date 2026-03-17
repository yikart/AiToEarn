/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 17:58:21
 * @LastEditors: nevin
 * @Description: b站
 */
import { Injectable, Logger } from '@nestjs/common'
import { AssetsService } from '@yikart/assets'
import {
  PublishRecord,
  PublishStatus,
} from '@yikart/mongodb'
import { chunkedDownloadFile, fileUrlToBase64, getRemoteFileSize } from '../../../../common/utils/file.util'
import { KwaiService } from '../../platforms/kwai/kwai.service'
import { PublishingException } from '../publishing.exception'
import { PublishingTaskResult, VerifyPublishResult } from '../publishing.interface'
import { PublishService } from './base.service'

@Injectable()
export class kwaiPubService extends PublishService {
  private readonly logger: Logger = new Logger(kwaiPubService.name)
  constructor(
    private readonly kwaiService: KwaiService,
    private readonly assetsService: AssetsService,
  ) {
    super()
  }

  private getCaption(publishiTask: PublishRecord) {
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

  async uploadVideo(publishTask: PublishRecord): Promise<string> {
    const { accountId, videoUrl } = publishTask
    if (!accountId) {
      throw PublishingException.nonRetryable('Account ID is required')
    }
    const startUploadInfo = await this.kwaiService.initVideoUpload(accountId)
    if (startUploadInfo.result !== 1) {
      throw PublishingException.nonRetryable('init kwai video upload failed')
    }

    const contentLength = await getRemoteFileSize(videoUrl!)
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
      const videoBlob = await chunkedDownloadFile(videoUrl!, range)
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

  async immediatePublish(publishTask: PublishRecord): Promise<PublishingTaskResult> {
    const { accountId, coverUrl, videoUrl } = publishTask
    if (!accountId) {
      throw PublishingException.nonRetryable('Account ID is required')
    }

    if (publishTask.videoUrl)
      publishTask.videoUrl = this.assetsService.buildUrl(publishTask.videoUrl)
    publishTask.imgUrlList = publishTask.imgUrlList?.map(url => this.assetsService.buildUrl(url)) || []
    publishTask.coverUrl = publishTask.coverUrl ? this.assetsService.buildUrl(publishTask.coverUrl) : undefined

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

  async verifyAndCompletePublish(publishRecord: PublishRecord): Promise<VerifyPublishResult> {
    try {
      // 快手由于缺少获取视频状态的API，这里直接返回成功
      // 视频链接已在发布时生成
      if (publishRecord.dataId) {
        const workLink = `https://www.kuaishou.com/short-video/${publishRecord.dataId}`
        return {
          success: true,
          workLink,
        }
      }

      return {
        success: false,
        errorMsg: '发布记录缺少视频ID',
      }
    }
    catch (error) {
      this.logger.error(`验证快手发布状态失败: ${(error as Error).message}`, (error as Error).stack)
      return {
        success: false,
        errorMsg: `验证发布状态失败: ${(error as Error).message}`,
      }
    }
  }
}
