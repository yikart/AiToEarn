import { Injectable, Logger } from '@nestjs/common'
import { PublishStatus } from '@yikart/aitoearn-server-client'
import { AssetsService } from '@yikart/assets'
import { PublishRecord, PublishType } from '@yikart/mongodb'
import { chunkedDownloadFile, getFileTypeFromUrl, getRemoteFileSize, probeRemoteFile } from '../../../../common/utils/file.util'
import { TiktokPostMode, TiktokPrivacyLevel, TiktokSourceType } from '../../libs/tiktok/tiktok.enum'
import { PhotoSourceInfoDto, PostInfoDto, VideoFileUploadSourceDto, VideoPullUrlSourceDto } from '../../platforms/tiktok/tiktok.dto'
import { TiktokService } from '../../platforms/tiktok/tiktok.service'
import { CreatePublishDto } from '../publish.dto'
import { PublishingException } from '../publishing.exception'
import { PublishingTaskResult, VerifyPublishResult } from '../publishing.interface'
import { TiktokWebhookDto } from '../tiktok-webhook.dto'
import { PublishService } from './base.service'

@Injectable()
export class TiktokPubService extends PublishService {
  private readonly logger = new Logger(TiktokPubService.name, {
    timestamp: true,
  })

  private readonly photoTitleMaxLength = 90
  private readonly photoDescriptionMaxLength = 4000

  private readonly allowedPhotoMimeTypes = new Set([
    'image/jpeg',
    'image/jpg',
    'image/webp',
  ])

  private readonly allowedPhotoExtensions = new Set([
    'jpg',
    'jpeg',
    'webp',
  ])

  constructor(
    private readonly tiktokService: TiktokService,
    private readonly assetsService: AssetsService,
  ) {
    super()
  }

  private hasImages(publishTask: Pick<PublishRecord, 'imgUrlList'> | Pick<CreatePublishDto, 'imgUrlList'>): boolean {
    return Array.isArray(publishTask.imgUrlList) && publishTask.imgUrlList.length > 0
  }

  private hasVideo(publishTask: Pick<PublishRecord, 'videoUrl'> | Pick<CreatePublishDto, 'videoUrl'>): boolean {
    return !!publishTask.videoUrl
  }

  private buildWorkLink(publishTask: PublishRecord, dataId: string): string {
    const contentPath = (publishTask.type === PublishType.ARTICLE || this.hasImages(publishTask)) ? 'photo' : 'video'
    return `https://www.tiktok.com/@${publishTask.uid}/${contentPath}/${dataId}`
  }

  private buildPublishContext(publishTask: PublishRecord) {
    return {
      taskId: publishTask.id,
      accountId: publishTask.accountId,
      accountType: publishTask.accountType,
      flowId: publishTask.flowId,
      type: publishTask.type,
      hasVideo: this.hasVideo(publishTask),
      imageCount: publishTask.imgUrlList?.length || 0,
      hasCover: !!publishTask.coverUrl,
      topicCount: publishTask.topics?.length || 0,
      privacyLevel: publishTask.option?.tiktok?.privacy_level || TiktokPrivacyLevel.PUBLIC,
    }
  }

  private resolvePrivacyLevel(publishTask: PublishRecord): TiktokPrivacyLevel {
    return publishTask.option?.tiktok?.privacy_level
      ? publishTask.option.tiktok.privacy_level as TiktokPrivacyLevel
      : TiktokPrivacyLevel.PUBLIC
  }

  private buildPhotoPostInfo(publishTask: PublishRecord, privacyLevel: TiktokPrivacyLevel): PostInfoDto {
    const description = this.generatePostMessage(publishTask)
    const title = (publishTask.title || publishTask.desc || description).slice(0, this.photoTitleMaxLength)
    return {
      title,
      description: description.slice(0, this.photoDescriptionMaxLength),
      privacy_level: privacyLevel,
      brand_content_toggle: publishTask.option?.tiktok?.brand_content_toggle || false,
      brand_organic_toggle: publishTask.option?.tiktok?.brand_organic_toggle || false,
      disable_comment: publishTask.option?.tiktok?.disable_comment || false,
    }
  }

  private async validateTiktokPhotoUrl(url: string): Promise<void> {
    const probe = await probeRemoteFile(url)
    const normalizedContentType = probe.contentType?.split(';')[0]?.trim().toLowerCase()
    const extension = getFileTypeFromUrl(probe.finalUrl || url).split('?')[0].toLowerCase()

    this.logger.log({
      path: 'tiktok.validatePhotoUrl.probe',
      data: {
        url,
        finalUrl: probe.finalUrl,
        contentType: probe.contentType,
        contentLength: probe.contentLength,
        status: probe.status,
        extension,
      },
    })

    const validByMime = normalizedContentType ? this.allowedPhotoMimeTypes.has(normalizedContentType) : false
    const validByExtension = this.allowedPhotoExtensions.has(extension)

    if (!validByMime && !validByExtension) {
      throw PublishingException.nonRetryable(
        `TikTok 图文仅支持 JPG/JPEG/WEBP，当前文件不支持: contentType=${normalizedContentType || 'unknown'}, extension=${extension || 'unknown'}`,
      )
    }
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

    this.logger.log({
      path: 'tiktok.publishVideoViaUpload.prepare',
      data: {
        ...this.buildPublishContext(publishTask),
        videoUrl,
        mimeType,
        contentLength,
        chunkSize,
        totalChunkCount,
        postInfo,
        sourceInfo,
      },
    })
    const initUploadRes = await this.tiktokService.initVideoPublishByAccountId(
      accountId,
      postInfo,
      sourceInfo,
    )
    this.logger.log({
      path: 'tiktok.publishVideoViaUpload.initVideoPublish.result',
      data: {
        ...this.buildPublishContext(publishTask),
        publishId: initUploadRes.publish_id,
        hasUploadUrl: !!initUploadRes.upload_url,
      },
    })
    const chunks: [number, number][] = []
    let start = 0
    for (let partNumber = 0; partNumber < totalChunkCount - 1; partNumber++) {
      const end = start + chunkSize - 1
      chunks.push([start, end])
      start += chunkSize
    }
    chunks.push([start, contentLength - 1])

    for (const chunk of chunks) {
      this.logger.log({
        path: 'tiktok.publishVideoViaUpload.chunk.start',
        data: {
          taskId: publishTask.id,
          accountId,
          chunk,
          contentLength,
        },
      })
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
      this.logger.log({
        path: 'tiktok.publishVideoViaUpload.chunk.done',
        data: {
          taskId: publishTask.id,
          accountId,
          chunk,
        },
      })
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

    this.logger.log({
      path: 'tiktok.publishVideoViaURL.prepare',
      data: {
        ...this.buildPublishContext(publishTask),
        videoUrl,
        postInfo,
        sourceInfo,
      },
    })
    const publishRes = await this.tiktokService.initVideoPublishByAccountId(
      accountId,
      postInfo,
      sourceInfo,
    )
    this.logger.log({
      path: 'tiktok.publishVideoViaURL.initVideoPublish.result',
      data: {
        ...this.buildPublishContext(publishTask),
        publishId: publishRes?.publish_id,
      },
    })
    if (!publishRes || !publishRes.publish_id) {
      throw new Error('publish video failed')
    }
    return {
      postId: publishRes.publish_id,
      permalink: '',
      status: PublishStatus.PUBLISHING,
    }
  }

  async publishPhotoViaURL(publishTask: PublishRecord): Promise<PublishingTaskResult> {
    const { accountId, imgUrlList } = publishTask
    if (!accountId) {
      throw new Error('Account ID is required')
    }
    if (!imgUrlList || imgUrlList.length === 0) {
      throw PublishingException.nonRetryable('image urls are required')
    }
    await Promise.all(imgUrlList.map(url => this.validateTiktokPhotoUrl(url)))

    const privacyLevel = this.resolvePrivacyLevel(publishTask)
    const creatorInfo = await this.tiktokService.getCreatorInfoByAccountId(accountId)
    this.logger.log({
      path: 'tiktok.publishPhotoViaURL.creatorInfo',
      data: {
        ...this.buildPublishContext(publishTask),
        creatorInfo: {
          privacy_level_options: creatorInfo.privacy_level_options,
          comment_disabled: creatorInfo.comment_disabled,
          duet_disabled: creatorInfo.duet_disabled,
          stitch_disabled: creatorInfo.stitch_disabled,
          max_video_post_duration_sec: creatorInfo.max_video_post_duration_sec,
        },
      },
    })

    if (!creatorInfo.privacy_level_options.includes(privacyLevel)) {
      throw PublishingException.nonRetryable(
        `TikTok photo publish invalid privacy_level: ${privacyLevel}, allowed: ${creatorInfo.privacy_level_options.join(', ')}`,
      )
    }
    const postInfo = this.buildPhotoPostInfo(publishTask, privacyLevel)

    let photo_cover_index = 0
    if (publishTask.coverUrl) {
      const coverIndex = imgUrlList.findIndex(url => url === publishTask.coverUrl)
      if (coverIndex >= 0) {
        photo_cover_index = coverIndex
      }
    }

    const sourceInfo: PhotoSourceInfoDto = {
      source: TiktokSourceType.PULL_FROM_URL,
      photo_images: imgUrlList,
      photo_cover_index,
    }

    const firstPhotoProbe = await probeRemoteFile(sourceInfo.photo_images[0])

    this.logger.log({
      path: 'tiktok.publishPhotoViaURL.prepare',
      data: {
        ...this.buildPublishContext(publishTask),
        coverUrl: publishTask.coverUrl,
        photoCoverIndex: photo_cover_index,
        postInfo,
        sourceInfo: {
          source: sourceInfo.source,
          photo_cover_index: sourceInfo.photo_cover_index,
          photo_images_count: sourceInfo.photo_images.length,
          first_photo_url: sourceInfo.photo_images[0],
        },
        firstPhotoProbe,
      },
    })
    const publishRes = await this.tiktokService.initPhotoPublishByAccountId(
      accountId,
      TiktokPostMode.DIRECT_POST,
      postInfo,
      sourceInfo,
    )
    this.logger.log({
      path: 'tiktok.publishPhotoViaURL.initPhotoPublish.result',
      data: {
        ...this.buildPublishContext(publishTask),
        publishId: publishRes?.publish_id,
      },
    })
    if (!publishRes || !publishRes.publish_id) {
      throw PublishingException.nonRetryable('TikTok photo publishing failed: missing publish_id')
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

    this.logger.log({
      path: 'tiktok.immediatePublish.start',
      data: this.buildPublishContext(publishTask),
    })

    if (this.hasImages(publishTask)) {
      this.logger.log({
        path: 'tiktok.immediatePublish.route',
        data: {
          taskId: publishTask.id,
          route: 'photo',
        },
      })
      return await this.publishPhotoViaURL(publishTask)
    }
    if (this.hasVideo(publishTask)) {
      this.logger.log({
        path: 'tiktok.immediatePublish.route',
        data: {
          taskId: publishTask.id,
          route: 'video-upload',
        },
      })
      return await this.publishVideoViaUpload(publishTask)
    }

    throw PublishingException.nonRetryable('TikTok publish requires either videoUrl or imgUrlList')
  }

  override async validatePublishParams(publishTask: CreatePublishDto): Promise<{
    success: boolean
    message?: string
  }> {
    const hasVideo = this.hasVideo(publishTask)
    const hasImages = this.hasImages(publishTask)

    if (!hasVideo && !hasImages) {
      return {
        success: false,
        message: 'TikTok 发布必须提供 videoUrl 或 imgUrlList',
      }
    }

    if (hasVideo && hasImages) {
      return {
        success: false,
        message: 'TikTok 发布不能同时提供 videoUrl 和 imgUrlList',
      }
    }

    if (hasImages && publishTask.imgUrlList!.length > 35) {
      return {
        success: false,
        message: 'TikTok 图文发布最多支持 35 张图片',
      }
    }

    if (hasImages) {
      if (!publishTask.accountId) {
        return {
          success: false,
          message: 'TikTok 图文发布缺少 accountId',
        }
      }

      try {
        const creatorInfo = await this.tiktokService.getCreatorInfoByAccountId(publishTask.accountId)
        const privacyLevel = publishTask.option?.tiktok?.privacy_level
          ? publishTask.option.tiktok.privacy_level as TiktokPrivacyLevel
          : TiktokPrivacyLevel.PUBLIC

        this.logger.log({
          path: 'tiktok.validatePublishParams.creatorInfo',
          data: {
            accountId: publishTask.accountId,
            type: publishTask.type,
            imageCount: publishTask.imgUrlList?.length || 0,
            privacyLevel,
            privacy_level_options: creatorInfo.privacy_level_options,
            comment_disabled: creatorInfo.comment_disabled,
            duet_disabled: creatorInfo.duet_disabled,
            stitch_disabled: creatorInfo.stitch_disabled,
          },
        })

        if (!creatorInfo.privacy_level_options.includes(privacyLevel)) {
          return {
            success: false,
            message: `TikTok 图文发布 privacy_level 不可用: ${privacyLevel}, allowed: ${creatorInfo.privacy_level_options.join(', ')}`,
          }
        }

        for (const url of publishTask.imgUrlList || []) {
          await this.validateTiktokPhotoUrl(this.assetsService.buildUrl(url))
        }
      }
      catch (error) {
        const message = (error as Error).message || '查询 TikTok creator info 失败'
        this.logger.fatal({
          path: 'tiktok.validatePublishParams.creatorInfo.error',
          data: {
            accountId: publishTask.accountId,
            message,
          },
        })
        return {
          success: false,
          message: `TikTok 图文发布前校验失败: ${message}`,
        }
      }
    }
    return {
      success: true,
      message: 'Publish params are valid',
    }
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
      this.logger.log({ path: 'tiktok.handleTiktokPostWebhook.receive', data: dto })
      const content = JSON.parse(dto.content)
      if (!dto.event.startsWith('post.publish')) {
        this.logger.error({ path: 'tiktok.handleTiktokPostWebhook', data: dto.event })
        return
      }
      const publishId = content?.publish_id
      if (!publishId) {
        this.logger.error({ path: 'tiktok.handleTiktokPostWebhook', data: content, message: 'invalid publish_id in webhook' })
        return
      }
      const publishRecord = await this.publishRecordService.getOneByData(publishId, dto.user_openid)
      if (!publishRecord) {
        this.logger.error({ path: 'tiktok.handleTiktokPostWebhook', data: publishId, message: '未找到发布记录' })
        return
      }
      switch (dto.event) {
        // 发布完成：视频上传和处理已完成，但可能还未对公众可见（可能在审核中），此时无 post_id，保持 PUBLISHING 状态
        case 'post.publish.complete':
          this.logger.log({ path: 'tiktok.handleTiktokPostWebhook.post.publish.complete', data: content, message: '发布处理完成，等待公开可见' })
          break
        // 送达收件箱：视频已送达创作者的 TikTok 收件箱/草稿箱，此时无 post_id，保持 PUBLISHING 状态
        case 'post.publish.inbox_delivered':
          this.logger.log({ path: 'tiktok.handleTiktokPostWebhook.post.publish.inbox_delivered', data: content, message: '发布已送达收件箱，等待公开可见' })
          break
        case 'post.publish.failed': {
          const failReason = content.reason || 'TikTok 发布失败'
          this.logger.error({
            path: 'tiktok.handleTiktokPostWebhook.post.publish.failed',
            data: { content, publishRecord },
            message: failReason,
          })
          await this.updatePublishTaskStatus(publishRecord.id, PublishStatus.FAILED, failReason)
          break
        }
        // 公开可见：视频已通过审核，对所有用户公开可见，此时返回 post_id 可构建视频链接
        case 'post.publish.publicly_available': {
          this.logger.log({ path: 'tiktok.handleTiktokPostWebhook.post.publish.publicly_available', data: { content, publishRecord }, message: '发布已公开' })
          const dataId = content.post_id || ''
          await this.completePublishTask(publishRecord, dataId, {
            workLink: this.buildWorkLink(publishRecord, dataId),
          })
          break
        }
        default:
          this.logger.error({ path: 'tiktok.handleTiktokPostWebhook', data: dto.event, message: '未知事件类型' })
          break
      }
    }
    catch (error) {
      this.logger.fatal({ path: 'tiktok.handleTiktokPostWebhook', data: { message: (error as Error).message, stack: (error as Error).stack }, message: '处理 TikTok webhook 失败' })
    }
  }

  async verifyAndCompletePublish(publishRecord: PublishRecord): Promise<VerifyPublishResult> {
    this.logger.log({ path: 'tiktok.verifyAndCompletePublish', data: publishRecord })
    if (!publishRecord.accountId) {
      return {
        success: false,
        errorMsg: `发布记录 ${publishRecord.id} 不包含有效的账号信息`,
      }
    }
    try {
      // TikTok 通过 webhook 机制确认发布状态，这里主动查询发布状态
      const publishStatus = await this.tiktokService.getPublishStatusByAccountId(
        publishRecord.accountId,
        publishRecord.dataId || '',
      )
      this.logger.log({
        path: 'tiktok.verifyAndCompletePublish.publishStatus',
        data: {
          taskId: publishRecord.id,
          accountId: publishRecord.accountId,
          publishId: publishRecord.dataId,
          publishStatus,
        },
      })

      if (publishStatus.status === 'PUBLISHED') {
        const workLink = this.buildWorkLink(publishRecord, publishRecord.dataId || '')
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
      this.logger.fatal(error, '验证 TikTok 发布状态失败')
      return {
        success: false,
        errorMsg: `验证发布状态失败: ${(error as Error).message}`,
      }
    }
  }
}
