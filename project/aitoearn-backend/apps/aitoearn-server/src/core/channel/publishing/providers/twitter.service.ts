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
  PostMedia,
  XChunkedMediaUploadRequest,
  XCreatePostRequest,
  XMediaUploadInitRequest,
  XMediaUploadResponse,
} from '../../libs/twitter/twitter.interfaces'
import { TwitterService } from '../../platforms/twitter/twitter.service'
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
    private readonly assetsService: AssetsService,
  ) {
    super()
  }

  private isPlainTextPost(publishTask: PublishRecord): boolean {
    const { imgUrlList, videoUrl } = publishTask
    return (!imgUrlList || imgUrlList.length === 0) && !videoUrl
  }

  override async getMediaProcessingStatus(accountId: string, mediaId: string): Promise<string | void> {
    const mediaStatusInfo = await this.twitterService.getMediaUploadStatus(accountId, mediaId)
    return mediaStatusInfo.data.processing_info.state
  }

  async publishPlainTextPost(task: PublishRecord): Promise<PublishingTaskResult> {
    if (!task.accountId) {
      throw PublishingException.nonRetryable(`No account ID found for task: ${task.id}`)
    }
    const post: XCreatePostRequest = {
      text: this.generatePostMessage(task) || '',
    }
    const createPostRes = await this.twitterService.createPost(
      task.accountId,
      post,
    )
    const permalink = `https://x.com/${task.uid}/status/${createPostRes!.data.id}`
    return {
      postId: createPostRes!.data.id,
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
    for (const imgUrl of imgUrlList) {
      const imgBlob = await fileUrlToBlob(imgUrl)
      if (!imgBlob) {
        throw PublishingException.nonRetryable(`Download image failed: ${imgUrl}`)
      }
      const fileName = getFileTypeFromUrl(imgUrl)
      const ext = fileName.split('.').pop()?.toLowerCase()
      const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`
      const initUploadReq: XMediaUploadInitRequest = {
        media_type: mimeType as XMediaType,
        total_bytes: imgBlob.blob.size,
        media_category: XMediaCategory.TWEET_IMAGE,
        shared: false,
      }
      const initUploadRes = await this.twitterService.initMediaUpload(
        accountId,
        initUploadReq,
      )
      const uploadReq: XChunkedMediaUploadRequest = {
        media: await imgBlob.blob,
        media_id: initUploadRes!.data.id,
        segment_index: 0,
      }

      await this.twitterService.chunkedMediaUploadRequest(
        accountId,
        uploadReq,
      )
      await this.twitterService.finalizeMediaUpload(
        accountId,
        initUploadRes!.data.id,
      )
      await this.savePostMedia(publishTask, 'twitter', PostCategory.POST, PostSubCategory.PHOTO, initUploadRes!.data.id, PostMediaStatus.FINISHED)
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
      media_type: mimeType as XMediaType,
      total_bytes: contentLength,
      media_category: XMediaCategory.TWEET_VIDEO,
      shared: false,
    }

    this.logger.debug({
      path: '--- twitter publishVideoPost --- 4 initMediaUpload 请求前',
      data: {
        initUploadReq,
        accountId,
      },
    })

    let initUploadRes: XMediaUploadResponse
    try {
      initUploadRes = (await this.twitterService.initMediaUpload(
        accountId,
        initUploadReq,
      ))!
      this.logger.debug({
        path: '--- twitter publishVideoPost --- 5 initMediaUpload 成功',
        data: {
          initUploadRes,
          mediaId: initUploadRes?.data?.id,
        },
      })
    }
    catch (error: any) {
      this.logger.error({
        path: '--- twitter publishVideoPost --- 5 initMediaUpload 失败',
        data: {
          errorMessage: error?.message,
          errorName: error?.name,
          errorStatus: error?.status,
          rawStatus: error?.rawStatus,
          rawError: error?.rawError,
          errorStack: error?.stack,
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        },
      })
      throw error
    }

    const chunkSize = 4 * 1024 * 1024 // 4MB
    const totalChunks = Math.ceil(contentLength / chunkSize)
    this.logger.debug({
      path: '--- twitter publishVideoPost --- 6 分块上传准备',
      data: {
        chunkSize,
        totalChunks,
        contentLength,
        mediaId: initUploadRes.data.id,
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
          mediaId: initUploadRes.data.id,
        },
      })

      const uploadReq: XChunkedMediaUploadRequest = {
        media: new Blob([fileSegment]),
        media_id: initUploadRes.data.id,
        segment_index: sequenceNum,
      }

      try {
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
      catch (error: any) {
        this.logger.error({
          path: '--- twitter publishVideoPost --- 9 分块上传失败',
          data: {
            sequenceNum,
            errorMessage: error?.message,
            errorName: error?.name,
            rawError: error?.rawError,
            fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
          },
        })
        throw error
      }
    }

    this.logger.debug({
      path: '--- twitter publishVideoPost --- 10 finalizeMediaUpload 前',
      data: {
        mediaId: initUploadRes.data.id,
        accountId,
      },
    })

    let finalizeRes: XMediaUploadResponse
    try {
      finalizeRes = (await this.twitterService.finalizeMediaUpload(
        accountId,
        initUploadRes.data.id,
      ))!
      this.logger.debug({
        path: '--- twitter publishVideoPost --- 11 finalizeMediaUpload 成功',
        data: {
          finalizeRes,
        },
      })
    }
    catch (error: any) {
      this.logger.error({
        path: '--- twitter publishVideoPost --- 11 finalizeMediaUpload 失败',
        data: {
          errorMessage: error?.message,
          errorName: error?.name,
          rawError: error?.rawError,
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        },
      })
      throw error
    }

    this.logger.debug({
      path: '--- twitter publishVideoPost --- 12 savePostMedia 前',
      data: {
        taskId: publishTask.id,
        mediaId: initUploadRes.data.id,
      },
    })

    await this.savePostMedia(publishTask, 'twitter', PostCategory.POST, PostSubCategory.VIDEO, initUploadRes.data.id)

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
        mediaId: initUploadRes.data.id,
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
    const postMedia: PostMedia = {
      media_ids: mediasStatus.medias.map(media => media.taskId),
    }
    const post: XCreatePostRequest = {
      text: this.generatePostMessage(publishTask) || '',
      media: postMedia,
    }
    const createPostRes = await this.twitterService.createPost(
      publishTask.accountId,
      post,
    )
    this.logger.log(
      `publish: Media container published for task ID: ${publishTask.id}, response: ${JSON.stringify(createPostRes)}`,
    )

    const permalink = `https://x.com/${publishTask.uid}/status/${createPostRes!.data.id}`
    return {
      postId: createPostRes!.data.id,
      permalink,
      status: PublishStatus.PUBLISHED,
    }
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
      this.logger.error(`验证 Twitter 发布状态失败: ${(error as Error).message}`, (error as Error).stack)
      return {
        success: false,
        errorMsg: `验证发布状态失败: ${(error as Error).message}`,
      }
    }
  }
}
