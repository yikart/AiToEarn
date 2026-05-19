import { Injectable, Logger } from '@nestjs/common'
import { AssetsService } from '@yikart/assets'
import {
  PostCategory,
  PostMediaStatus,
  PostSubCategory,
} from '@yikart/channel-db'
import {
  PublishRecord,
  PublishStatus,
} from '@yikart/mongodb'
import {
  chunkedDownloadFile,
  fileUrlToBlob,
  getFileTypeFromUrl,
  getRemoteFileSize,
} from '../../../../common/utils/file.util'
import { XMediaCategory, XMediaType } from '../../libs/twitter/twitter.enum'
import {
  XChunkedMediaUploadRequest,
  XCreateMediaMetadataRequest,
  XCreatePostRequest,
  XMediaUploadInitRequest,
} from '../../libs/twitter/twitter.interfaces'
import { TwitterBillingService, TwitterWriteChargeType } from '../../platforms/twitter/twitter-billing.service'
import { TwitterMediaMetadataItem, TwitterPublishOption } from '../../platforms/twitter/twitter-post-options.schema'
import { TwitterService } from '../../platforms/twitter/twitter.service'
import { CreatePublishDto } from '../publish.dto'
import { PublishingException } from '../publishing.exception'
import { PublishingTaskResult, VerifyPublishResult } from '../publishing.interface'
import { PublishService } from './base.service'

@Injectable()
export class TwitterPubService extends PublishService {
  private readonly logger = new Logger(TwitterPubService.name, {
    timestamp: true,
  })

  protected override readonly ProcessMediaInProgress: string = 'in_progress'
  protected override readonly ProcessMediaCompleted: string = 'succeeded'

  constructor(
    private readonly twitterService: TwitterService,
    private readonly twitterBillingService: TwitterBillingService,
    private readonly assetsService: AssetsService,
  ) {
    super()
  }

  private getTwitterOption(publishTask: Pick<PublishRecord, 'option'> | Pick<CreatePublishDto, 'option'>): TwitterPublishOption | undefined {
    return publishTask.option?.twitter as TwitterPublishOption | undefined
  }

  private isPlainTextPost(publishTask: PublishRecord): boolean {
    const { imgUrlList, videoUrl } = publishTask
    return (!imgUrlList || imgUrlList.length === 0) && !videoUrl
  }

  private buildPostText(publishTask: Pick<PublishRecord, 'desc' | 'topics'> | Pick<CreatePublishDto, 'desc' | 'topics'>): string {
    if (publishTask.topics && publishTask.topics.length > 0) {
      if (publishTask.desc) {
        return `${publishTask.desc} #${publishTask.topics.join(' #')}`
      }
      return `#${publishTask.topics.join(' #')}`
    }
    return publishTask.desc || ''
  }

  private buildBasePost(publishTask: PublishRecord): XCreatePostRequest {
    const option = this.getTwitterOption(publishTask)
    const replySettings = option?.replySettings || option?.poll?.replySettings
    const post: XCreatePostRequest = {
      text: this.buildPostText(publishTask),
    }

    if (replySettings) {
      post.replySettings = replySettings
    }
    if (option?.madeWithAi !== undefined) {
      post.madeWithAi = option.madeWithAi
    }
    if (option?.poll) {
      post.poll = {
        options: option.poll.options,
        durationMinutes: option.poll.durationMinutes,
      }
    }

    return post
  }

  private async attachMediaMetadata(
    accountId: string,
    mediaId: string,
    mediaMetadata?: TwitterMediaMetadataItem,
  ): Promise<void> {
    if (!mediaMetadata?.altText) {
      return
    }

    const req: XCreateMediaMetadataRequest = {
      id: mediaId,
      metadata: {
        altText: {
          text: mediaMetadata.altText,
        },
      },
    }
    await this.twitterService.createMediaMetadata(accountId, req)
  }

  override async getMediaProcessingStatus(accountId: string, mediaId: string): Promise<string | void> {
    const mediaStatusInfo = await this.twitterService.getMediaUploadStatus(accountId, mediaId)
    const mediaStatus = mediaStatusInfo.data?.processingInfo?.state ?? mediaStatusInfo.data?.state
    if (mediaStatus === 'failed') {
      return this.ProcessMediaFailed
    }
    if (mediaStatus === 'succeeded') {
      return this.ProcessMediaCompleted
    }
    return this.ProcessMediaInProgress
  }

  async publishPlainTextPost(task: PublishRecord): Promise<PublishingTaskResult> {
    if (!task.accountId) {
      throw PublishingException.nonRetryable(`No account ID found for task: ${task.id}`)
    }
    const post = this.buildBasePost(task)
    const createPostRes = await this.twitterService.createPost(
      task.accountId,
      post,
    )
    const postId = createPostRes?.data?.id
    if (!postId) {
      throw PublishingException.retryable('Create twitter post failed')
    }
    const permalink = `https://x.com/${task.uid}/status/${postId}`
    return {
      postId,
      permalink,
      status: PublishStatus.PUBLISHED,
    }
  }

  async publishImagePost(publishTask: PublishRecord): Promise<PublishingTaskResult> {
    const { accountId, imgUrlList } = publishTask
    if (!accountId) {
      throw PublishingException.nonRetryable(`No account ID found for task: ${publishTask.id}`)
    }
    if (!imgUrlList || imgUrlList.length === 0) {
      throw PublishingException.nonRetryable('No images found for image post')
    }
    const mediaMetadataList = this.getTwitterOption(publishTask)?.mediaMetadata || []

    for (const [index, imgUrl] of imgUrlList.entries()) {
      const imgBlob = await fileUrlToBlob(imgUrl)
      if (!imgBlob) {
        throw PublishingException.nonRetryable(`Download image failed: ${imgUrl}`)
      }
      const fileName = getFileTypeFromUrl(imgUrl)
      const ext = fileName.split('.').pop()?.toLowerCase()
      const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`
      const initUploadReq: XMediaUploadInitRequest = {
        mediaType: mimeType as XMediaType,
        totalBytes: imgBlob.blob.size,
        mediaCategory: XMediaCategory.TWEET_IMAGE,
        shared: false,
      }
      const initUploadRes = await this.twitterService.initMediaUpload(
        accountId,
        initUploadReq,
      )
      const mediaId = initUploadRes.data?.id
      if (!mediaId) {
        throw PublishingException.retryable(`Initialize twitter image upload failed: ${imgUrl}`)
      }
      const uploadReq: XChunkedMediaUploadRequest = {
        media: await imgBlob.blob,
        media_id: mediaId,
        segment_index: 0,
      }

      await this.twitterService.chunkedMediaUploadRequest(
        accountId,
        uploadReq,
      )
      await this.twitterService.finalizeMediaUpload(
        accountId,
        mediaId,
      )
      await this.attachMediaMetadata(accountId, mediaId, mediaMetadataList[index])
      await this.savePostMedia(publishTask, 'twitter', PostCategory.POST, PostSubCategory.PHOTO, mediaId, PostMediaStatus.FINISHED)
    }
    await this.publishPostMediaTask(publishTask.id, publishTask.queueId || '')
    return {
      status: PublishStatus.PUBLISHING,
    }
  }

  async publishVideoPost(publishTask: PublishRecord): Promise<PublishingTaskResult> {
    const { accountId, videoUrl } = publishTask
    if (!accountId) {
      throw PublishingException.nonRetryable(`No account ID found for task: ${publishTask.id}`)
    }
    this.logger.debug({
      path: '--- twitter publishVideoPost --- 1 入参',
      data: {
        accountId,
        videoUrl,
        taskId: publishTask.id,
      },
    })
    if (!videoUrl) {
      throw PublishingException.nonRetryable('No video found for video post')
    }
    const fileName = getFileTypeFromUrl(videoUrl, true)
    const ext = fileName.split('.').pop()?.toLowerCase()
    const mimeType = ext === 'mp4' ? 'video/mp4' : `video/${ext}`

    this.logger.debug({
      path: '--- twitter publishVideoPost --- 2 文件解析',
      data: {
        fileName,
        ext,
        mimeType,
      },
    })

    const contentLength = await getRemoteFileSize(videoUrl)
    this.logger.debug({
      path: '--- twitter publishVideoPost --- 3 文件大小',
      data: {
        contentLength,
        videoUrl,
      },
    })
    if (!contentLength) {
      throw PublishingException.nonRetryable('Get video size failed')
    }
    const initUploadReq: XMediaUploadInitRequest = {
      mediaType: mimeType as XMediaType,
      totalBytes: contentLength,
      mediaCategory: XMediaCategory.TWEET_VIDEO,
      shared: false,
    }

    this.logger.debug({
      path: '--- twitter publishVideoPost --- 4 initMediaUpload 请求前',
      data: {
        initUploadReq,
        accountId,
      },
    })

    const initUploadRes = (await this.twitterService.initMediaUpload(
      accountId,
      initUploadReq,
    ))!
    const mediaId = initUploadRes.data?.id
    if (!mediaId) {
      throw PublishingException.retryable('Initialize twitter video upload failed')
    }
    this.logger.debug({
      path: '--- twitter publishVideoPost --- 5 initMediaUpload 成功',
      data: {
        initUploadRes,
        mediaId,
      },
    })

    const chunkSize = 4 * 1024 * 1024 // 4MB
    const totalChunks = Math.ceil(contentLength / chunkSize)
    this.logger.debug({
      path: '--- twitter publishVideoPost --- 6 分块上传准备',
      data: {
        chunkSize,
        totalChunks,
        contentLength,
        mediaId,
      },
    })

    for (let sequenceNum = 0; sequenceNum < totalChunks; sequenceNum++) {
      const start = sequenceNum * chunkSize
      const end = Math.min(start + chunkSize - 1, contentLength - 1)
      const range: [number, number] = [start, end]

      this.logger.debug({
        path: '--- twitter publishVideoPost --- 7 分块下载前',
        data: {
          sequenceNum,
          totalChunks,
          start,
          end,
          range,
        },
      })

      const fileSegment = await chunkedDownloadFile(videoUrl, range)
      if (!fileSegment) {
        this.logger.error({
          path: '--- twitter publishVideoPost --- 7 分块下载失败',
          data: {
            sequenceNum,
            range,
            videoUrl,
          },
        })
        throw PublishingException.nonRetryable('Download video segment failed')
      }

      this.logger.debug({
        path: '--- twitter publishVideoPost --- 8 分块上传前',
        data: {
          sequenceNum,
          segmentSize: fileSegment.length,
          range: `${start}-${end}`,
          mediaId,
        },
      })

      const uploadReq: XChunkedMediaUploadRequest = {
        media: new Blob([fileSegment]),
        media_id: mediaId,
        segment_index: sequenceNum,
      }

      const chunkUploadRes = await this.twitterService.chunkedMediaUploadRequest(
        accountId,
        uploadReq,
      )
      this.logger.debug({
        path: '--- twitter publishVideoPost --- 9 分块上传成功',
        data: {
          sequenceNum,
          chunkUploadRes,
        },
      })
    }

    this.logger.debug({
      path: '--- twitter publishVideoPost --- 10 finalizeMediaUpload 前',
      data: {
        mediaId,
        accountId,
      },
    })

    const finalizeRes = (await this.twitterService.finalizeMediaUpload(
      accountId,
      mediaId,
    ))!
    this.logger.debug({
      path: '--- twitter publishVideoPost --- 11 finalizeMediaUpload 成功',
      data: {
        finalizeRes,
      },
    })

    await this.attachMediaMetadata(
      accountId,
      mediaId,
      this.getTwitterOption(publishTask)?.mediaMetadata?.[0],
    )

    this.logger.debug({
      path: '--- twitter publishVideoPost --- 12 savePostMedia 前',
      data: {
        taskId: publishTask.id,
        mediaId,
      },
    })

    await this.savePostMedia(publishTask, 'twitter', PostCategory.POST, PostSubCategory.VIDEO, mediaId)

    this.logger.debug({
      path: '--- twitter publishVideoPost --- 13 publishPostMediaTask 前',
      data: {
        taskId: publishTask.id,
        queueId: publishTask.queueId,
      },
    })

    await this.publishPostMediaTask(publishTask.id, publishTask.queueId || '')

    this.logger.debug({
      path: '--- twitter publishVideoPost --- 14 完成',
      data: {
        taskId: publishTask.id,
        mediaId,
      },
    })

    return {
      status: PublishStatus.PUBLISHING,
    }
  }

  async immediatePublish(publishTask: PublishRecord): Promise<PublishingTaskResult> {
    if (publishTask.videoUrl)
      publishTask.videoUrl = this.assetsService.buildUrl(publishTask.videoUrl)
    publishTask.imgUrlList = publishTask.imgUrlList?.map(url => this.assetsService.buildUrl(url)) || []
    publishTask.coverUrl = publishTask.coverUrl ? this.assetsService.buildUrl(publishTask.coverUrl) : undefined

    const { imgUrlList, videoUrl } = publishTask
    if (this.isPlainTextPost(publishTask)) {
      return this.publishPlainTextPost(publishTask)
    }
    if (imgUrlList && imgUrlList.length > 0) {
      return this.publishImagePost(publishTask)
    }
    if (videoUrl) {
      return this.publishVideoPost(publishTask)
    }
    throw PublishingException.nonRetryable('No media found for post')
  }

  override async finalizePublish(publishTask: PublishRecord): Promise<PublishingTaskResult> {
    if (!publishTask.accountId) {
      throw PublishingException.nonRetryable(`No account ID found for task: ${publishTask.id}`)
    }
    const mediasStatus = await this.getMediasProcessingStatus(publishTask)
    if (mediasStatus.hasFailed) {
      throw PublishingException.nonRetryable(`Media processing failed for task ID: ${publishTask.id}`)
    }
    if (!mediasStatus.isCompleted) {
      throw PublishingException.retryable(`Media files are still processing. Please wait for media processing to complete.`)
    }

    this.logger.log(`All media files processed for task ID: ${publishTask.id}`)
    const option = this.getTwitterOption(publishTask)
    const post = this.buildBasePost(publishTask)
    post.media = {
      mediaIds: mediasStatus.medias.map(media => media.taskId),
    }
    if (publishTask.imgUrlList?.length && option?.mediaTaggedUserIds?.length) {
      post.media.taggedUserIds = option.mediaTaggedUserIds
    }
    const createPostRes = await this.twitterService.createPost(
      publishTask.accountId,
      post,
    )
    const postId = createPostRes?.data?.id
    if (!postId) {
      throw PublishingException.retryable(`Create twitter media post failed for task ID: ${publishTask.id}`)
    }
    this.logger.log(
      `publish: Media container published for task ID: ${publishTask.id}, response: ${JSON.stringify(createPostRes)}`,
    )

    const permalink = `https://x.com/${publishTask.uid}/status/${postId}`
    return {
      postId,
      permalink,
      status: PublishStatus.PUBLISHED,
    }
  }

  override async validatePublishParams(publishTask: CreatePublishDto): Promise<{
    success: boolean
    message?: string
  }> {
    const hasVideo = Boolean(publishTask.videoUrl)
    const hasImages = Boolean(publishTask.imgUrlList?.length)
    const option = this.getTwitterOption(publishTask)
    const mediaCount = hasVideo ? 1 : publishTask.imgUrlList?.length || 0

    if (hasVideo && hasImages) {
      return {
        success: false,
        message: 'Twitter 发布不能同时提供 videoUrl 和 imgUrlList',
      }
    }

    if (option?.poll && (hasVideo || hasImages)) {
      return {
        success: false,
        message: 'Twitter 投票帖不能同时包含图片或视频',
      }
    }

    if (option?.mediaTaggedUserIds?.length && (!hasImages || hasVideo)) {
      return {
        success: false,
        message: 'Twitter 仅图片帖支持 mediaTaggedUserIds',
      }
    }

    if (option?.mediaMetadata) {
      if (!mediaCount) {
        return {
          success: false,
          message: 'Twitter mediaMetadata 仅在上传图片或视频时可用',
        }
      }
      if (option.mediaMetadata.length !== mediaCount) {
        return {
          success: false,
          message: 'Twitter mediaMetadata 数量必须与媒体数量一致',
        }
      }
    }

    let amount = this.twitterBillingService.getCreatePostChargeAmount(
      this.buildPostText(publishTask),
    )
    const metadataCount = option?.mediaMetadata?.filter(item => !!item.altText)?.length || 0
    if (metadataCount > 0) {
      amount += metadataCount * this.twitterBillingService.getWriteChargeAmount(
        TwitterWriteChargeType.MediaMetadata,
      )
    }
    await this.twitterBillingService.ensureSufficientBalance({
      accountId: publishTask.accountId,
      amount,
    })

    return await super.validatePublishParams(publishTask)
  }

  async verifyAndCompletePublish(publishRecord: PublishRecord): Promise<VerifyPublishResult> {
    if (!publishRecord.accountId) {
      return {
        success: false,
        errorMsg: `发布记录 ${publishRecord.id} 不包含有效的账号信息`,
      }
    }
    try {
      // Twitter/X 通过 API 获取推文信息验证发布状态
      const tweetInfo = await this.twitterService.getTweetDetail(
        publishRecord.accountId,
        publishRecord.dataId || '',
      )

      if (tweetInfo && tweetInfo.data && tweetInfo.data.id) {
        const workLink = `https://x.com/${publishRecord.uid}/status/${tweetInfo.data.id}`
        return {
          success: true,
          workLink,
        }
      }

      return {
        success: false,
        errorMsg: 'Twitter 推文不存在或已被删除',
      }
    }
    catch (error) {
      this.logger.error(error, '验证 Twitter 发布状态失败')
      return {
        success: false,
        errorMsg: `验证发布状态失败: ${(error as Error).message}`,
      }
    }
  }
}
