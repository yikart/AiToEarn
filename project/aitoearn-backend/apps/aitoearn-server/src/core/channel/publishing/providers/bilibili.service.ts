import { Injectable, Logger } from '@nestjs/common'
import { AssetsService } from '@yikart/assets'
import { AppException, ResponseCode } from '@yikart/common'
import {
  PublishRecord,
  PublishStatus,
} from '@yikart/mongodb'
import {
  chunkedDownloadFile,
  fileUrlToBase64,
  getFileTypeFromUrl,
  getRemoteFileSize,
} from '../../../../common/utils/file.util'
import { BilibiliService } from '../../platforms/bilibili/bilibili.service'
import { WebhookEvent } from '../../platforms/bilibili/common'
import { BilibiliWebhookDto } from '../bilibili-webhook.dto'
import { PublishingException } from '../publishing.exception'
import { PublishingTaskResult, VerifyPublishResult } from '../publishing.interface'
import { PublishService } from './base.service'

@Injectable()
export class BilibiliPubService extends PublishService {
  private readonly logger = new Logger(BilibiliPubService.name)

  constructor(
    readonly bilibiliService: BilibiliService,
    private readonly assetsService: AssetsService,
  ) {
    super()
  }

  async uploadThumbnail(accountId: string, rawThumbnailURL: string) {
    if (!rawThumbnailURL) {
      return ''
    }
    this.logger.log(`upload thumbnail, url: ${rawThumbnailURL}`)
    const urlBase64 = await fileUrlToBase64(this.assetsService.buildUrl(rawThumbnailURL))
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

  async immediatePublish(publishTask: PublishRecord): Promise<PublishingTaskResult> {
    const { accountId, videoUrl, coverUrl } = publishTask
    if (!accountId)
      throw new AppException(ResponseCode.AccountAuthRequired)

    if (!videoUrl) {
      throw PublishingException.nonRetryable('video url is required')
    }
    if (!coverUrl) {
      throw PublishingException.nonRetryable('coverUrl url is required')
    }
    publishTask.videoUrl = this.assetsService.buildUrl(publishTask.videoUrl!)
    publishTask.coverUrl = this.assetsService.buildUrl(publishTask.coverUrl!)

    const thumbnail = await this.uploadThumbnail(accountId, publishTask.coverUrl)
    const videoUpToken = await this.uploadVideo(accountId, publishTask.videoUrl)
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

  async verifyAndCompletePublish(publishRecord: PublishRecord): Promise<VerifyPublishResult> {
    try {
      // B站发布后需要审核，由于缺少获取视频状态的API，这里直接返回成功
      // 视频链接已在发布时生成
      if (publishRecord.dataId) {
        const workLink = `https://www.bilibili.com/video/${publishRecord.dataId}`
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
      this.logger.error(`验证 B站 发布状态失败: ${(error as Error).message}`, (error as Error).stack)
      return {
        success: false,
        errorMsg: `验证发布状态失败: ${(error as Error).message}`,
      }
    }
  }

  /**
   * 处理 B站 发布 webhook
   * @param dto
   * @returns
   */
  async handleBilibiliPublishWebhook(dto: BilibiliWebhookDto): Promise<void> {
    try {
      if (dto.event !== WebhookEvent.PublishVideo) {
        this.logger.error(`未知 Bilibili 事件类型: ${dto.event}`)
        return
      }

      const { share_id, video_id } = dto.content
      if (!share_id) {
        this.logger.error(`invalid share_id in webhook: ${JSON.stringify(dto.content)}`)
        return
      }

      const publishTask = await this.publishRecordService.getOneByData(share_id, dto.from_user_id)
      if (!publishTask) {
        this.logger.error(`未找到发布记录: share_id=${share_id}, from_user_id=${dto.from_user_id}`)
        return
      }

      const workLink = `https://www.bilibili.com/video/${video_id}`
      this.logger.log(`Bilibili 发布成功: share_id=${share_id}, video_id=${video_id}`)

      if (publishTask.status === PublishStatus.PUBLISHED) {
        this.logger.log(`Bilibili 发布记录已完成，仅更新 dataId 和 workLink: ${publishTask.id}`)
        await this.publishRecordService.updateById(publishTask.id, { $set: { dataId: video_id, workLink } })
        return
      }
      await this.completePublishTask(publishTask, video_id, { workLink })
    }
    catch (error) {
      this.logger.error(`处理 Bilibili webhook 失败: ${(error as Error).message}`, (error as Error).stack)
    }
  }
}
