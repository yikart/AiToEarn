import { Injectable, Logger } from '@nestjs/common'
import { AitoearnServerClientService } from '@yikart/aitoearn-server-client'
import { chunkedDownloadFile, getFileTypeFromUrl, getRemoteFileSize } from '../../../common'
import { config } from '../../../config'
import { PostInfoDto, VideoFileUploadSourceDto, VideoPullUrlSourceDto } from '../../../core/plat/tiktok/dto/tiktok.dto'
import { TiktokService } from '../../../core/plat/tiktok/tiktok.service'
import { PublishStatus, PublishTask } from '../../../libs/database/schema/publishTask.schema'
import { TiktokPrivacyLevel, TiktokSourceType } from '../../../libs/tiktok/tiktok.enum'
import { DoPubRes } from '../common'
import { TiktokWebhookDto } from '../dto/tiktok.webhook.dto'
import { PublishBase } from './publish.base'

@Injectable()
export class TiktokPubService extends PublishBase {
  override queueName: string = 'tiktok'
  private readonly logger = new Logger(TiktokPubService.name, {
    timestamp: true,
  })

  constructor(
    readonly tiktokService: TiktokService,
    private readonly serverClient: AitoearnServerClientService,
  ) {
    super()
  }

  // TODO: 校验账户授权状态
  async checkAuth(accountId: string): Promise<{
    status: 0 | 1
    timeout?: number // 秒
  }> {
    this.logger.log(`checkAuth: ${accountId}`)
    return {
      status: 1,
      timeout: 10000,
    }
  }

  private generatePostMessage(publishTask: PublishTask): string {
    if (!publishTask) {
      return ''
    }
    if (publishTask.topics && publishTask.topics.length > 0) {
      return `${publishTask.desc || ''} #${publishTask.topics.join(' #')}`
    }
    return publishTask.desc || ''
  }

  private isDevEnv(): boolean {
    return config.tiktok.redirectUri.includes('dev')
  }

  async publishVideoViaUpload(publishTask: PublishTask): Promise<string> {
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
    let chunkSize = 6 * 1024 * 1024 // 6MB
    if (contentLength < chunkSize) {
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
      total_chunk_count: Math.floor(contentLength / chunkSize),
    }

    this.logger.log(`init video upload: accountId: ${accountId}, postInfo: ${JSON.stringify(postInfo)}, sourceInfo: ${JSON.stringify(sourceInfo)}`)
    const initUploadRes = await this.tiktokService.initVideoPublish(
      accountId,
      postInfo,
      sourceInfo,
    )
    this.logger.log(`视频初始化上传结果: ${JSON.stringify(initUploadRes)}`)
    if (!initUploadRes || !initUploadRes.upload_url) {
      throw new Error('init upload video failed')
    }
    const totalParts = Math.floor(contentLength / chunkSize)
    const chunks: [number, number][] = []
    let start = 0
    for (let partNumber = 0; partNumber < totalParts - 1; partNumber++) {
      const end = start + chunkSize - 1
      chunks.push([start, end])
      start += chunkSize
    }
    chunks.push([start, contentLength - 1])

    for (const chunk of chunks) {
      const videoBlob = await chunkedDownloadFile(videoUrl, chunk)
      if (!videoBlob) {
        throw new Error('download video chunk failed')
      }

      const uploadResult = await this.tiktokService.chunkedUploadVideoFile(
        initUploadRes.upload_url,
        videoBlob,
        chunk,
        contentLength,
        mimeType,
      )
      this.logger.log(`视频分片上传完成: ${JSON.stringify(uploadResult)}`)
    }
    return initUploadRes.publish_id
  }

  async publishVideoViaURL(publishTask: PublishTask): Promise<string> {
    try {
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
      return publishRes.publish_id
    }
    catch (error) {
      this.logger.error('publishVideoViaUrl error', error)
      throw error
    }
  }

  async doPub(publishTask: PublishTask): Promise<DoPubRes> {
    const res: DoPubRes = {
      status: -1,
      message: '任务不存在',
    }

    try {
      const { videoUrl } = publishTask
      if (videoUrl) {
        const publishId = await this.publishVideoViaUpload(publishTask)
        publishTask.status = PublishStatus.PUBLISHING
        await this.createPublishRecord({
          ...publishTask,
          dataId: publishId,
          publishTime: new Date(),
        })
        res.status = PublishStatus.PUBLISHING
        res.message = '发布任务已提交，等待处理'
        return res
      }
    }
    catch (error) {
      this.logger.error(`Publish TikTok video failed: ${error.message}`, error.stack)
      res.status = PublishStatus.FAILED
      res.message = error.message || 'Publish TikTok video failed with unknown error'
      return res
    }
    return res
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
      const publishRecord = await this.serverClient.publishing.getPublishRecordByDataId(publishId, dto.user_openid)
      if (!publishRecord) {
        this.logger.error(`未找到发布记录: ${publishId}, 用户: ${dto.user_openid}`)
        return
      }
      switch (dto.event) {
        case 'post.publish.failed':
          this.logger.error(`发布失败: ${JSON.stringify(content)}`)
          publishRecord.status = PublishStatus.FAILED
          publishRecord.errorMsg = content.reason || '发布失败'
          await this.publishRecordService.updatePublishRecordStatus(publishRecord._id, publishRecord.status, publishRecord.errorMsg)
          await this.publishTaskModel.updateOne({ queueId: publishRecord.queueId }, {
            status: PublishStatus.FAILED,
            errorMsg: content.reason || '发布失败',
          })
          break
        case 'post.publish.complete':
          this.logger.log(`发布成功: ${JSON.stringify(content)}`)
          publishRecord.status = PublishStatus.PUBLISHED
          await this.publishRecordService.updatePublishRecordStatus(publishRecord._id, publishRecord.status, publishRecord.errorMsg)
          this.publishTaskModel.deleteOne({ queueId: publishRecord.queueId })
          break
        case 'post.publish.inbox_delivered':
          this.logger.log(`发布已送达: ${JSON.stringify(content)}`)
          publishRecord.status = PublishStatus.PUBLISHED
          await this.publishRecordService.updatePublishRecordStatus(publishRecord._id, publishRecord.status, publishRecord.errorMsg)
          this.publishTaskModel.deleteOne({ queueId: publishRecord.queueId })
          break
        case 'post.publish.publicly_available':
          publishRecord.status = PublishStatus.PUBLISHED
          publishRecord.dataId = content.post_id || publishRecord.dataId
          await this.publishRecordService.updatePublishRecordStatus(publishRecord._id, publishRecord.status, publishRecord.errorMsg)
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
