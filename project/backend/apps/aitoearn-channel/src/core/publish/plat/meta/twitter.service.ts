import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { AccountType } from '@yikart/aitoearn-server-client'
import { Model } from 'mongoose'
import {
  chunkedDownloadFile,
  fileUrlToBlob,
  getFileTypeFromUrl,
  getRemoteFileSize,
} from '../../../../common'
import { TwitterService } from '../../../../core/plat/twitter/twitter.service'
import { Account } from '../../../../libs/database/schema/account.schema'
import {
  PostMediaStatus,
  PostSubCategory,
} from '../../../../libs/database/schema/postMediaContainer.schema'
import {
  PublishStatus,
  PublishTask,
} from '../../../../libs/database/schema/publishTask.schema'
import { XMediaCategory, XMediaType } from '../../../../libs/twitter/twitter.enum'
import {
  PostMedia,
  XChunkedMediaUploadRequest,
  XCreatePostRequest,
  XMediaUploadInitRequest,
} from '../../../../libs/twitter/twitter.interfaces'
import { DoPubRes } from '../../common'
import { PublishBase } from '../publish.base'
import { PostMediaContainerService } from './container.service'
import { MetaPostPublisher, PublishMetaPostTask } from './meta.interface'

@Injectable()
export class TwitterPublishService
  extends PublishBase
  implements MetaPostPublisher {
  override queueName: string = AccountType.TWITTER

  private readonly logger = new Logger(TwitterPublishService.name, {
    timestamp: true,
  })

  constructor(
    @InjectModel(Account.name)
    readonly AccountModel: Model<Account>,
    readonly twitterService: TwitterService,
    private readonly postMediaContainerService: PostMediaContainerService,
  ) {
    super()
    this.postMediaContainerService = postMediaContainerService
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

  private isPlainTextPost(publishTask: PublishTask): boolean {
    const { imgUrlList, videoUrl } = publishTask
    return (!imgUrlList || imgUrlList.length === 0) && !videoUrl
  }

  async publishPlainTextPost(task: PublishTask): Promise<DoPubRes> {
    const post: XCreatePostRequest = {
      text: this.generatePostMessage(task) || '',
    }
    const createPostRes = await this.twitterService.createPost(
      task.accountId,
      post,
    )
    this.logger.log(
      `publish: Media container published for task ID: ${task.id}, response: ${JSON.stringify(createPostRes)}`,
    )
    if (!createPostRes || !createPostRes.data.id) {
      this.logger.log(
        `Failed to publish media container for task ID: ${task.id}`,
      )
      return {
        status: PublishStatus.FAILED,
        message: 'Failed to publish text post',
        noRetry: true,
      }
    }
    let permalink = `https://x.com/${task.uid}/status/${createPostRes.data.id}`
    const account = await this.AccountModel.findOne({ _id: task.accountId })
    if (account && account.account) {
      permalink = `https://x.com/${account.account}/status/${createPostRes.data.id}`
    }

    this.logger.log(
      `Successfully published media container for task ID: ${task.id}`,
    )
    await this.completePublishTask(task, createPostRes.data.id, {
      workLink: permalink,
    })
    this.logger.log(`completed: Task ID ${task.id} processed successfully`)
    return {
      status: PublishStatus.PUBLISHED,
      message: '所有媒体文件已处理完成',
    }
  }

  async publishImagePost(publishTask: PublishTask): Promise<DoPubRes> {
    const res: DoPubRes = {
      status: -1,
      message: 'publish task not found',
    }
    const { accountId, imgUrlList } = publishTask
    if (!imgUrlList || imgUrlList.length === 0) {
      return {
        status: PublishStatus.FAILED,
        message: 'No images found for image post',
        noRetry: true,
      }
    }
    for (const imgUrl of imgUrlList) {
      const imgBlob = await fileUrlToBlob(imgUrl)
      if (!imgBlob) {
        res.message = `Download image failed: ${imgUrl}`
        return res
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
      if (!initUploadRes || !initUploadRes.data.id) {
        res.message = 'init image upload failed'
        return res
      }
      this.logger.log(`initUploadRes: ${JSON.stringify(initUploadRes)}`)
      const uploadReq: XChunkedMediaUploadRequest = {
        media: await imgBlob.blob,
        media_id: initUploadRes.data.id,
        segment_index: 0,
      }

      const updateRes = await this.twitterService.chunkedMediaUploadRequest(
        accountId,
        uploadReq,
      )
      if (!updateRes || !updateRes.data.expires_at) {
        res.message = 'image upload failed'
        return res
      }
      this.logger.log(
        `chunkedMediaUploadRequest: ${JSON.stringify(updateRes)}`,
      )
      const finalizeUploadRes = await this.twitterService.finalizeMediaUpload(
        accountId,
        initUploadRes.data.id,
      )
      if (!finalizeUploadRes || !finalizeUploadRes.data.id) {
        res.message = 'finalize image upload failed'
        return res
      }
      this.logger.log(
        `finalizeMediaUpload: ${JSON.stringify(finalizeUploadRes)}`,
      )
      await this.postMediaContainerService.createMetaPostMedia({
        accountId: publishTask.accountId,
        publishId: publishTask.id,
        userId: publishTask.userId,
        platform: 'twitter',
        taskId: initUploadRes.data.id,
        status: PostMediaStatus.FINISHED,
        subCategory: PostSubCategory.PHOTO,
      })
    }

    const task: PublishMetaPostTask = {
      id: publishTask.id,
    }
    this.queueService.addPostMediaTaskJob(
      {
        taskId: task.id,
        attempts: 0,
      },
      {
        attempts: 5,
        backoff: {
          type: 'fixed',
          delay: 10000,
        },
        removeOnComplete: true,
        removeOnFail: true,
      },
    )
    res.status = PublishStatus.PUBLISHING
    res.message = 'Medias processing'
    return res
  }

  async publishVideoPost(publishTask: PublishTask): Promise<DoPubRes> {
    const res: DoPubRes = {
      status: -1,
      message: 'publish task not found',
    }
    const { accountId, videoUrl } = publishTask
    if (!videoUrl) {
      return {
        status: PublishStatus.FAILED,
        message: 'No video found for video post',
        noRetry: true,
      }
    }
    const fileName = getFileTypeFromUrl(videoUrl, true)
    const ext = fileName.split('.').pop()?.toLowerCase()
    const mimeType = ext === 'mp4' ? 'video/mp4' : `video/${ext}`

    const contentLength = await getRemoteFileSize(videoUrl)
    if (!contentLength) {
      res.message = 'Get video size failed'
      return res
    }
    const initUploadReq: XMediaUploadInitRequest = {
      media_type: mimeType as XMediaType,
      total_bytes: contentLength,
      media_category: XMediaCategory.TWEET_VIDEO,
      shared: false,
    }

    const initUploadRes = await this.twitterService.initMediaUpload(
      accountId,
      initUploadReq,
    )
    if (!initUploadRes || !initUploadRes.data.id) {
      res.message = 'init video upload failed'
      return res
    }
    const chunkSize = 4 * 1024 * 1024 // 4MB
    const totalChunks = Math.ceil(contentLength / chunkSize)
    for (let sequenceNum = 0; sequenceNum < totalChunks; sequenceNum++) {
      const start = sequenceNum * chunkSize
      const end = Math.min(start + chunkSize - 1, contentLength - 1)
      const range: [number, number] = [start, end]
      const fileSegment = await chunkedDownloadFile(videoUrl, range)
      if (!fileSegment) {
        res.message = 'Download video segment failed'
        return res
      }
      this.logger.log(
        `chunked upload, Size: ${fileSegment.length}, Range: ${start}-${end}, Sequence: ${sequenceNum}`,
      )
      const uploadReq: XChunkedMediaUploadRequest = {
        media: new Blob([fileSegment]),
        media_id: initUploadRes.data.id,
        segment_index: sequenceNum,
      }
      const upload = await this.twitterService.chunkedMediaUploadRequest(
        accountId,
        uploadReq,
      )
      this.logger.log(`chunkedMediaUploadRequest: ${JSON.stringify(upload)}`)
      if (!upload || !upload.data.expires_at) {
        res.message = 'Upload video segment failed'
        return res
      }
    }
    const finalizeUploadRes = await this.twitterService.finalizeMediaUpload(
      accountId,
      initUploadRes.data.id,
    )
    if (!finalizeUploadRes || !finalizeUploadRes.data.id) {
      res.message = 'finalize video upload failed'
      return res
    }
    await this.postMediaContainerService.createMetaPostMedia({
      accountId: publishTask.accountId,
      publishId: publishTask.id,
      userId: publishTask.userId,
      platform: 'twitter',
      taskId: initUploadRes.data.id,
      status: PostMediaStatus.CREATED,
      subCategory: PostSubCategory.VIDEO,
    })

    const task: PublishMetaPostTask = {
      id: publishTask.id,
    }
    this.queueService.addPostMediaTaskJob(
      {
        taskId: task.id,
        attempts: 0,
      },
      {
        attempts: 5,
        backoff: {
          type: 'fixed',
          delay: 10000,
        },
        removeOnComplete: true,
        removeOnFail: true,
      },
    )
    res.status = PublishStatus.PUBLISHING
    res.message = 'Medias processing'
    return res
  }

  async doPub(publishTask: PublishTask): Promise<DoPubRes> {
    const res: DoPubRes = {
      status: -1,
      message: 'publish task not found',
    }

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
    return res
  }

  async publish(task: PublishTask): Promise<DoPubRes> {
    try {
      this.logger.log(`publish: Starting to process task ID: ${task.id}`)
      const medias = await this.postMediaContainerService.getContainers(
        task.id,
      )
      if (!medias || medias.length === 0) {
        return {
          status: PublishStatus.FAILED,
          message: '没有找到媒体文件',
          noRetry: true,
        }
      }
      const unProcessedMedias = medias.filter(
        media => media.status !== PostMediaStatus.FINISHED,
      )
      this.logger.log(
        `Found ${medias.length} media files for task ID: ${task.id}`,
      )
      let processedCount = 0
      for (const media of unProcessedMedias) {
        const mediaStatusInfo = await this.twitterService.getMediaUploadStatus(
          task.accountId,
          media.taskId,
        )
        if (!mediaStatusInfo || !mediaStatusInfo.data.processing_info.state) {
          this.logger.error(
            `Failed to get media status for task ID: ${task.id}, media ID: ${media.taskId}`,
          )
          continue
        }
        this.logger.log(
          `Media status for task ID ${task.id}, media ID ${media.taskId}: ${JSON.stringify(mediaStatusInfo)}`,
        )
        if (mediaStatusInfo.data.processing_info.state === 'failed') {
          this.logger.error(
            `Media processing failed for task ID: ${task.id}, media ID: ${media.taskId}`,
          )
          await this.postMediaContainerService.updateContainer(media.id, {
            status: PostMediaStatus.FAILED,
          })
          return {
            status: PublishStatus.FAILED,
            message: '资源处理失败',
            noRetry: true,
          }
        }
        let mediaStatus = PostMediaStatus.CREATED
        if (mediaStatusInfo.data.processing_info.state === 'in_progress') {
          mediaStatus = PostMediaStatus.IN_PROGRESS
        }
        if (mediaStatusInfo.data.processing_info.state === 'succeeded') {
          this.logger.log(
            `Media processing finished for task ID: ${task.id}, media ID: ${media.taskId}`,
          )
          mediaStatus = PostMediaStatus.FINISHED
          processedCount++
        }
        await this.postMediaContainerService.updateContainer(media.id, {
          status: mediaStatus,
        })
      }
      const isMediaCompleted = processedCount === unProcessedMedias.length
      if (!isMediaCompleted) {
        this.logger.warn(
          `Not all media files processed for task ID: ${task.id}. Processed: ${processedCount}, Total: ${medias.length}`,
        )
        return {
          status: PublishStatus.PUBLISHING,
          message: '媒体文件处理中',
        }
      }
      this.logger.log(`All media files processed for task ID: ${task.id}`)
      const postMedia: PostMedia = {
        media_ids: medias.map(media => media.taskId),
      }
      const post: XCreatePostRequest = {
        text: this.generatePostMessage(task) || '',
        media: postMedia,
      }
      const createPostRes = await this.twitterService.createPost(
        task.accountId,
        post,
      )
      this.logger.log(
        `publish: Media container published for task ID: ${task.id}, response: ${JSON.stringify(createPostRes)}`,
      )
      if (!createPostRes || !createPostRes.data.id) {
        this.logger.log(
          `Failed to publish media container for task ID: ${task.id}`,
        )
        return {
          status: PublishStatus.FAILED,
          message: '发布媒体容器失败',
          noRetry: true,
        }
      }
      let permalink = `https://x.com/${task.uid}/status/${createPostRes.data.id}`
      const account = await this.AccountModel.findOne({ _id: task.accountId })
      if (account && account.account) {
        permalink = `https://x.com/${account.account}/status/${createPostRes.data.id}`
      }

      this.logger.log(
        `Successfully published media container for task ID: ${task.id}`,
      )
      await this.completePublishTask(task, createPostRes.data.id, {
        workLink: permalink,
      })
      this.logger.log(`completed: Task ID ${task.id} processed successfully`)
      return {
        status: PublishStatus.PUBLISHED,
        message: '所有媒体文件已处理完成',
      }
    }
    catch (error) {
      this.logger.error(
        `Error processing task ID ${task.id}: ${error.message || error}`,
      )
      return {
        status: PublishStatus.FAILED,
        message: `${error.message || error}`,
        noRetry: true,
      }
    }
  }
}
