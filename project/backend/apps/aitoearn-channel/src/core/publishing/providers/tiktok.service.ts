import { Injectable, Logger } from '@nestjs/common'
import { chunkedDownloadFile, getFileTypeFromUrl, getRemoteFileSize } from '../../../common'
import { config } from '../../../config'
import { PublishStatus, PublishTask } from '../../../libs/database/schema/publishTask.schema'
import { TiktokPrivacyLevel, TiktokSourceType } from '../../../libs/tiktok/tiktok.enum'
import { PostInfoDto, VideoFileUploadSourceDto, VideoPullUrlSourceDto } from '../../platforms/tiktok/dto/tiktok.dto'
import { TiktokService } from '../../platforms/tiktok/tiktok.service'
import { TiktokWebhookDto } from '../dto/tiktok-webhook.dto'
import { PublishingException } from '../publishing.exception'
import { PublishingTaskResult } from '../publishing.interface'
import { PublishService } from './base.service'

@Injectable()
export class TiktokPubService extends PublishService {
  private readonly logger = new Logger(TiktokPubService.name, {
    timestamp: true,
  })

  constructor(
    private readonly tiktokService: TiktokService,
  ) {
    super()
  }

  private isDevEnv(): boolean {
    return config.tiktok.redirectUri.includes('dev')
  }

  async publishVideoViaUpload(publishTask: PublishTask): Promise<PublishingTaskResult> {
    const { accountId, videoUrl } = publishTask
    if (!videoUrl) {
      throw new Error('video url is required')
    }
    const fileName = getFileTypeFromUrl(videoUrl, true)
    const ext = fileName.split('.').pop()?.toLowerCase()
    const mimeType = ext === 'mp4' ? 'video/mp4' : `video/${ext}`

    const contentLength = await getRemoteFileSize(videoUrl)
    if (!contentLength) {
      throw new Error('get video meta failed')
    }
    let chunkSize = 5 * 1024 * 1024 // 6MB
    const totalChunkCount = Math.floor(contentLength / chunkSize) || 1
    if (contentLength < chunkSize || totalChunkCount === 1) {
      chunkSize = contentLength
    }
    const privacy_level = publishTask.option?.tiktok?.privacy_level ? publishTask.option.tiktok.privacy_level as TiktokPrivacyLevel : TiktokPrivacyLevel.PUBLIC
    const postInfo: PostInfoDto = {
      title: publishTask.title || publishTask.desc || '',
      privacy_level,
      brand_content_toggle: publishTask.option?.tiktok?.brand_content_toggle || false,
      brand_organic_toggle: publishTask.option?.tiktok?.brand_organic_toggle || false,
      disable_comment: publishTask.option?.tiktok?.disable_comment || false,
      disable_duet: publishTask.option?.tiktok?.disable_duet || false,
      disable_stitch: publishTask.option?.tiktok?.disable_stitch || false,
    }

    const sourceInfo: VideoFileUploadSourceDto = {
      source: TiktokSourceType.FILE_UPLOAD,
      video_size: contentLength,
      chunk_size: chunkSize,
      total_chunk_count: totalChunkCount,
    }

    this.logger.log(`init video upload: accountId: ${accountId}, postInfo: ${JSON.stringify(postInfo)}, sourceInfo: ${JSON.stringify(sourceInfo)}`)
    const initUploadRes = await this.tiktokService.initVideoPublish(
      accountId,
      postInfo,
      sourceInfo,
    )
    const chunks: [number, number][] = []
    let start = 0
    for (let partNumber = 0; partNumber < totalChunkCount - 1; partNumber++) {
      const end = start + chunkSize - 1
      chunks.push([start, end])
      start += chunkSize
    }
    chunks.push([start, contentLength - 1])

    for (const chunk of chunks) {
      const videoBlob = await chunkedDownloadFile(videoUrl, chunk)
      if (!videoBlob) {
        throw PublishingException.nonRetryable('download raw video chunk failed')
      }

      await this.tiktokService.chunkedUploadVideoFile(
        initUploadRes.upload_url,
        videoBlob,
        chunk,
        contentLength,
        mimeType,
      )
    }
    return {
      postId: initUploadRes.publish_id,
      permalink: `https://www.tiktok.com/@${publishTask.uid}/video/${initUploadRes.publish_id}`,
      status: PublishStatus.PUBLISHING,
    }
  }

  async publishVideoViaURL(publishTask: PublishTask): Promise<PublishingTaskResult> {
    const { accountId, videoUrl } = publishTask
    if (!videoUrl) {
      throw new Error('video url is required')
    }
    const privacyLevel = this.isDevEnv() ? TiktokPrivacyLevel.SELF_ONLY : TiktokPrivacyLevel.PUBLIC
    const postInfo: PostInfoDto = {
      title: this.generatePostMessage(publishTask),
      privacy_level: privacyLevel,
      brand_content_toggle: false,
      brand_organic_toggle: false,
    }

    const sourceInfo: VideoPullUrlSourceDto = {
      source: TiktokSourceType.PULL_FROM_URL,
      video_url: videoUrl,
    }

    const publishRes = await this.tiktokService.initVideoPublish(
      accountId,
      postInfo,
      sourceInfo,
    )
    this.logger.log(`视频发布结果: ${JSON.stringify(publishRes)}`)
    if (!publishRes || !publishRes.publish_id) {
      throw new Error('publish video failed')
    }
    return {
      postId: publishRes.publish_id,
      permalink: `https://www.tiktok.com/@${publishTask.uid}/video/${publishRes.publish_id}`,
      status: PublishStatus.PUBLISHING,
    }
  }

  async immediatePublish(publishTask: PublishTask): Promise<PublishingTaskResult> {
    return await this.publishVideoViaUpload(publishTask)
  }

  async handleTiktokPostWebhook(dto: TiktokWebhookDto): Promise<void> {
    try {
      const content = JSON.parse(dto.content)
      if (!dto.event.startsWith('post.publish')) {
        this.logger.error(`未知 TikTok 事件类型: ${dto.event}`)
        return
      }
      const publishId = content?.publish_id
      if (!publishId) {
        this.logger.error(`invalid publish_id in webhook: ${JSON.stringify(content)}`)
        return
      }
      const publishRecord = await this.publishTaskModel.findOne({ dataId: publishId, uid: dto.user_openid }).exec()
      if (!publishRecord) {
        this.logger.error(`未找到发布记录: ${publishId}`)
        return
      }
      switch (dto.event) {
        case 'post.publish.complete':
          this.logger.log(`发布成功: ${JSON.stringify(content)}`)
          publishRecord.status = PublishStatus.PUBLISHED
          await this.publishRecordService.updatePublishRecordStatus(publishRecord.id, publishRecord.status, publishRecord.errorMsg)
          await this.publishTaskModel.updateOne({ _id: publishRecord.id }, { status: PublishStatus.PUBLISHED }).exec()
          break
        case 'post.publish.inbox_delivered':
          this.logger.log(`发布已送达: ${JSON.stringify(content)}`)
          publishRecord.status = PublishStatus.PUBLISHED
          await this.publishRecordService.updatePublishRecordStatus(publishRecord.id, publishRecord.status, publishRecord.errorMsg)
          await this.publishTaskModel.updateOne({ _id: publishRecord.id }, { status: PublishStatus.PUBLISHED }).exec()
          break
        case 'post.publish.publicly_available':
          publishRecord.status = PublishStatus.PUBLISHED
          publishRecord.dataId = content.post_id || publishRecord.dataId
          await this.publishRecordService.updatePublishRecordStatus(publishRecord.id, publishRecord.status, publishRecord.errorMsg)
          await this.publishTaskModel.updateOne({ _id: publishRecord.id }, { status: PublishStatus.PUBLISHED }).exec()
          break
        default:
          this.logger.error(`未知事件类型: ${dto.event}`)
          break
      }
    }
    catch (error) {
      this.logger.error(`处理 TikTok webhook 失败: ${error.message}`, error.stack)
    }
  }
}
