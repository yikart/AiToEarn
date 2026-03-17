import { Injectable, Logger } from '@nestjs/common'
import { PublishStatus } from '@yikart/aitoearn-server-client'
import { AssetsService } from '@yikart/assets'
import { PublishRecord } from '@yikart/mongodb'
import { chunkedDownloadFile, getFileTypeFromUrl, getRemoteFileSize } from '../../../../common/utils/file.util'
import { TiktokPrivacyLevel, TiktokSourceType } from '../../libs/tiktok/tiktok.enum'
import { PostInfoDto, VideoFileUploadSourceDto, VideoPullUrlSourceDto } from '../../platforms/tiktok/tiktok.dto'
import { TiktokService } from '../../platforms/tiktok/tiktok.service'
import { PublishingException } from '../publishing.exception'
import { PublishingTaskResult, VerifyPublishResult } from '../publishing.interface'
import { TiktokWebhookDto } from '../tiktok-webhook.dto'
import { PublishService } from './base.service'

@Injectable()
export class TiktokPubService extends PublishService {
  private readonly logger = new Logger(TiktokPubService.name, {
    timestamp: true,
  })

  constructor(
    private readonly tiktokService: TiktokService,
    private readonly assetsService: AssetsService,
  ) {
    super()
  }

  async publishVideoViaUpload(publishTask: PublishRecord): Promise<PublishingTaskResult> {
    const { accountId, videoUrl } = publishTask
    if (!accountId) {
      throw new Error('Account ID is required')
    }
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
    let title = publishTask.desc || publishTask.title || ''
    title += publishTask.topics.map(topic => ` #${topic}`).join('')
    const postInfo: PostInfoDto = {
      title,
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
        initUploadRes.upload_url || '',
        videoBlob,
        chunk,
        contentLength,
        mimeType,
      )
    }
    return {
      postId: initUploadRes.publish_id,
      permalink: '',
      status: PublishStatus.PUBLISHING,
    }
  }

  async publishVideoViaURL(publishTask: PublishRecord): Promise<PublishingTaskResult> {
    const { accountId, videoUrl } = publishTask
    if (!accountId) {
      throw new Error('Account ID is required')
    }
    if (!videoUrl) {
      throw new Error('video url is required')
    }
    const privacyLevel = publishTask.option?.tiktok?.privacy_level
      ? publishTask.option.tiktok.privacy_level as TiktokPrivacyLevel
      : TiktokPrivacyLevel.PUBLIC
    const postInfo: PostInfoDto = {
      title: this.generatePostMessage(publishTask),
      privacy_level: privacyLevel,
      brand_content_toggle: publishTask.option?.tiktok?.brand_content_toggle || false,
      brand_organic_toggle: publishTask.option?.tiktok?.brand_organic_toggle || false,
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
    if (!publishRes || !publishRes.publish_id) {
      throw new Error('publish video failed')
    }
    return {
      postId: publishRes.publish_id,
      permalink: '',
      status: PublishStatus.PUBLISHING,
    }
  }

  async immediatePublish(publishTask: PublishRecord): Promise<PublishingTaskResult> {
    if (publishTask.videoUrl)
      publishTask.videoUrl = this.assetsService.buildUrl(publishTask.videoUrl)
    publishTask.imgUrlList = publishTask.imgUrlList?.map(url => this.assetsService.buildUrl(url)) || []
    publishTask.coverUrl = publishTask.coverUrl ? this.assetsService.buildUrl(publishTask.coverUrl) : undefined
    return await this.publishVideoViaUpload(publishTask)
  }

  /**
   * 处理 TikTok 发布完成 Webhook
   *  "client_key": "awomwh5h2fju7zt3",
    "event": "post.publish.publicly_available",
    "create_time": 1770210873,
    "user_openid": "-000YSS_OTWKQzsQ-Q6fwsK_A1CTqKopVfCO",
    "content": "{\"publish_id\":\"v_pub_file~v2-1.7602997070760331285\",\"publish_type\":\"DIRECT_PUBLISH\",\"post_id\":\"7602997517160123666\"}"
   * @param dto
   * @returns
   */
  async handleTiktokPostWebhook(dto: TiktokWebhookDto): Promise<void> {
    try {
      const content = JSON.parse(dto.content)
      if (!dto.event.startsWith('post.publish')) {
        this.logger.error({ path: 'handleTiktokPostWebhook', data: dto.event })
        return
      }
      const publishId = content?.publish_id
      if (!publishId) {
        this.logger.error({ path: 'handleTiktokPostWebhook', data: content, message: 'invalid publish_id in webhook' })
        return
      }
      const publishRecord = await this.publishRecordService.getOneByData(publishId, dto.user_openid)
      if (!publishRecord) {
        this.logger.error({ path: 'handleTiktokPostWebhook', data: publishId, message: '未找到发布记录' })
        return
      }
      switch (dto.event) {
        // 发布完成：视频上传和处理已完成，但可能还未对公众可见（可能在审核中），此时无 post_id，保持 PUBLISHING 状态
        case 'post.publish.complete':
          this.logger.log({ path: 'handleTiktokPostWebhook -- post.publish.complete', data: content, message: '发布处理完成，等待公开可见' })
          break
        // 送达收件箱：视频已送达创作者的 TikTok 收件箱/草稿箱，此时无 post_id，保持 PUBLISHING 状态
        case 'post.publish.inbox_delivered':
          this.logger.log({ path: 'handleTiktokPostWebhook -- post.publish.inbox_delivered', data: content, message: '发布已送达收件箱，等待公开可见' })
          break
        // 公开可见：视频已通过审核，对所有用户公开可见，此时返回 post_id 可构建视频链接
        case 'post.publish.publicly_available': {
          this.logger.log({ path: 'handleTiktokPostWebhook -- post.publish.publicly_available', data: { content, publishRecord }, message: '发布已公开' })
          const dataId = content.post_id || ''
          await this.completePublishTask(publishRecord, dataId, {
            workLink: `https://www.tiktok.com/@${publishRecord.uid}/video/${dataId}`,
          })
          break
        }
        default:
          this.logger.error({ path: 'handleTiktokPostWebhook', data: dto.event, message: '未知事件类型' })
          break
      }
    }
    catch (error) {
      this.logger.error({ path: 'handleTiktokPostWebhook', data: { message: (error as Error).message, stack: (error as Error).stack }, message: '处理 TikTok webhook 失败' })
    }
  }

  async verifyAndCompletePublish(publishRecord: PublishRecord): Promise<VerifyPublishResult> {
    this.logger.log({ path: 'tiktok verifyAndCompletePublish', data: publishRecord })
    if (!publishRecord.accountId) {
      return {
        success: false,
        errorMsg: `发布记录 ${publishRecord.id} 不包含有效的账号信息`,
      }
    }
    try {
      // TikTok 通过 webhook 机制确认发布状态，这里主动查询发布状态
      const publishStatus = await this.tiktokService.getPublishStatus(
        publishRecord.accountId,
        publishRecord.dataId || '',
      )

      if (publishStatus.status === 'PUBLISHED') {
        const workLink = `https://www.tiktok.com/@${publishRecord.uid}/video/${publishRecord.dataId}`
        return {
          success: true,
          workLink,
        }
      }

      if (publishStatus.status === 'FAILED') {
        return {
          success: false,
          errorMsg: publishStatus.fail_reason || 'TikTok 发布失败',
        }
      }

      // 仍在处理中
      return {
        success: false,
        errorMsg: '发布处理中，请稍后再试',
      }
    }
    catch (error) {
      this.logger.error(`验证 TikTok 发布状态失败: ${(error as Error).message}`, (error as Error).stack)
      return {
        success: false,
        errorMsg: `验证发布状态失败: ${(error as Error).message}`,
      }
    }
  }
}
