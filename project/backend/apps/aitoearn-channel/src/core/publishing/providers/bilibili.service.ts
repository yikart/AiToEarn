import { Injectable, Logger } from '@nestjs/common'
import {
  chunkedDownloadFile,
  fileUrlToBase64,
  getFileTypeFromUrl,
  getRemoteFileSize,
} from '../../../common'
import {
  PublishStatus,
  PublishTask,
} from '../../../libs/database/schema/publishTask.schema'
import { BilibiliService } from '../../platforms/bilibili/bilibili.service'
import { PublishingException } from '../publishing.exception'
import { PublishingTaskResult } from '../publishing.interface'
import { PublishService } from './base.service'

@Injectable()
export class BilibiliPubService extends PublishService {
  private readonly logger = new Logger(BilibiliPubService.name)

  constructor(
    readonly bilibiliService: BilibiliService,
  ) {
    super()
  }

  async uploadThumbnail(accountId: string, rawThumbnailURL: string) {
    if (!rawThumbnailURL) {
      return ''
    }
    this.logger.log(`upload thumbnail, url: ${rawThumbnailURL}`)
    const urlBase64 = await fileUrlToBase64(rawThumbnailURL)
    const thumbnailURL = await this.bilibiliService.coverUpload(
      accountId,
      urlBase64,
    )
    return thumbnailURL
  }

  async uploadVideo(accountId: string, videoUrl: string) {
    const fileName = getFileTypeFromUrl(videoUrl)
    const contentLength = await getRemoteFileSize(videoUrl)
    const uploadToken = await this.bilibiliService.videoInit(
      accountId,
      fileName,
      0,
    )
    const chunkSize = 1024 * 1024 * 5
    const chunkCount = Math.ceil(contentLength / chunkSize)

    for (let seq = 1; seq <= chunkCount; seq++) {
      const start = (seq - 1) * chunkSize
      const end = Math.min(seq * chunkSize - 1, contentLength - 1)
      const chunkFile = await chunkedDownloadFile(videoUrl, [start, end])
      await this.bilibiliService.uploadVideoPart(
        accountId,
        chunkFile,
        uploadToken,
        seq,
      )
    }
    await this.bilibiliService.videoComplete(accountId, uploadToken)
    return uploadToken
  }

  async immediatePublish(publishTask: PublishTask): Promise<PublishingTaskResult> {
    const { coverUrl, accountId, videoUrl } = publishTask
    if (!videoUrl) {
      throw PublishingException.nonRetryable('video url is required')
    }
    const thumbnail = await this.uploadThumbnail(accountId, coverUrl)
    const videoUpToken = await this.uploadVideo(accountId, videoUrl)
    const postId = await this.bilibiliService.archiveAddByUtoken(
      accountId,
      videoUpToken,
      {
        title: publishTask.title || '',
        cover: thumbnail,
        desc: publishTask.desc,
        ...publishTask.option!.bilibili!,
        tag: publishTask.topics?.join(','),
      },
    )
    return {
      postId,
      permalink: `https://www.bilibili.com/video/${postId}`,
      status: PublishStatus.PUBLISHED,
    }
  }
}
