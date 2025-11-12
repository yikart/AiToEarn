import { Injectable, Logger } from '@nestjs/common'
import {
  chunkedDownloadFile,
  fileUrlToBlob,
  getRemoteFileSize,
} from '../../../../common'
import { FacebookService } from '../../../../core/plat/meta/facebook.service'
import {
  PostCategory,
  PostMediaStatus,
  PostSubCategory,
} from '../../../../libs/database/schema/postMediaContainer.schema'
import {
  PublishStatus,
  PublishTask,
} from '../../../../libs/database/schema/publishTask.schema'
import {
  ChunkedVideoUploadRequest,
  FacebookInitialVideoUploadRequest,
  FacebookReelRequest,
  finalizeVideoUploadRequest,
  PublishFeedPostRequest,
  PublishVideoPostRequest,
} from '../../../../libs/facebook/facebook.interfaces'
import { DoPubRes } from '../../common'
import { PublishBase } from '../publish.base'
import { PostMediaContainerService } from './container.service'
import { MetaPostPublisher, PublishMetaPostTask } from './meta.interface'

@Injectable()
export class FacebookPublishService
  extends PublishBase
  implements MetaPostPublisher {
  override queueName: string = 'facebook'

  private readonly logger = new Logger(FacebookPublishService.name, {
    timestamp: true,
  })

  constructor(
    readonly facebookService: FacebookService,
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

  async uploadImage(accountId: string, imgUrl: string): Promise<string> {
    const imgBlob = await fileUrlToBlob(imgUrl)
    const uploadReq = await this.facebookService.uploadImage(
      accountId,
      imgBlob.blob,
    )
    return uploadReq.id
  }

  async publishFeedPost(publishTask: PublishTask): Promise<PublishStatus> {
    this.logger.log(`Received publish task: ${publishTask.id} for Facebook Feed Post`)
    this.logger.debug(`Publish task details: ${JSON.stringify(publishTask)}`)
    if (!publishTask.desc) {
      this.logger.error('Feed Post requires a description')
      throw new Error('Feed Post requires a description')
    }
    const feedPostReq: PublishFeedPostRequest = {
      message: this.generatePostMessage(publishTask),
      published: true,
    }
    const postRes = await this.facebookService.publishFeedPost(
      publishTask.accountId,
      feedPostReq,
    )
    const permalink = `https://www.facebook.com/${publishTask.uid}_${postRes.id}`
    await this.completePublishTask(publishTask, postRes.id, {
      workLink: permalink,
    })
    return PublishStatus.PUBLISHED
  }

  async publishReelPost(publishTask: PublishTask): Promise<PublishStatus> {
    this.logger.log(`Received publish task: ${publishTask.id} for Facebook Reel`)
    this.logger.debug(`Publish task details: ${JSON.stringify(publishTask)}`)
    let status = PublishStatus.FAILED

    const { imgUrlList, accountId, videoUrl } = publishTask
    if (imgUrlList && imgUrlList.length > 0) {
      this.logger.error('Reel does not support image uploads')
      throw new Error('Reel does not support image uploads')
    }
    if (!videoUrl) {
      this.logger.error('Reel requires a video URL')
      throw new Error('Reel requires a video URL')
    }

    const contentLength = await getRemoteFileSize(videoUrl)
    const initUploadReq: FacebookReelRequest = {
      upload_phase: 'start',
    }
    const initUploadRes = await this.facebookService.initReelUpload(
      accountId,
      initUploadReq,
    )
    if (!initUploadRes || !initUploadRes.upload_url) {
      this.logger.error(`Video initialization upload failed, response: ${JSON.stringify(initUploadRes)}`)
      throw new Error('Video initialization upload failed')
    }

    const videoFile = await chunkedDownloadFile(videoUrl, [0, contentLength - 1])
    await this.facebookService.uploadReel(
      accountId,
      initUploadRes.upload_url,
      {
        offset: 0,
        file_size: contentLength,
        file: videoFile,
      },
    )
    await this.postMediaContainerService.createMetaPostMedia({
      accountId: publishTask.accountId,
      publishId: publishTask.id,
      userId: publishTask.userId,
      platform: 'facebook',
      taskId: initUploadRes.video_id,
      status: PostMediaStatus.CREATED,
      category: PostCategory.STORY,
      subCategory: PostSubCategory.VIDEO,
    })
    const task: PublishMetaPostTask = {
      id: publishTask.id,
    }
    await this.queueService.addPostMediaTaskJob(
      {
        taskId: task.id,
        attempts: 0,
      },
      {
        attempts: 30,
        backoff: {
          type: 'fixed',
          delay: 10000, // 每次重试间隔 10 秒, 总共尝试 30 次
        },
        removeOnComplete: true,
        removeOnFail: true,
      },
    )
    status = PublishStatus.PUBLISHING
    return status
  }

  async publishPhotoStory(publishTask: PublishTask): Promise<PublishStatus> {
    this.logger.log(`Received publish task: ${publishTask.id} for Facebook Story`)
    this.logger.debug(`Publish task details: ${JSON.stringify(publishTask)}`)
    let status = PublishStatus.FAILED
    const { imgUrlList, accountId } = publishTask
    if (!imgUrlList) {
      this.logger.error('Story requires images')
      throw new Error('Story requires images')
    }

    if (imgUrlList && imgUrlList.length < 1) {
      this.logger.error('Story requires at least one image')
      throw new Error('Story requires at least one image')
    }

    const imgUrl = imgUrlList[0]
    const containerId = await this.uploadImage(accountId, imgUrl)

    await this.facebookService.publishPhotoStory(
      accountId,
      containerId,
    )
    const permalink = `https://www.facebook.com/stories/${containerId}`
    await this.completePublishTask(publishTask, containerId, {
      workLink: permalink,
    })
    await this.completePublishTask(publishTask, containerId)
    status = PublishStatus.PUBLISHED
    return status
  }

  async publishVideoStory(publishTask: PublishTask): Promise<PublishStatus> {
    let status = PublishStatus.FAILED
    if (!publishTask.videoUrl) {
      this.logger.error('Story requires a video URL')
      throw new Error('Story requires a video URL')
    }
    const contentLength = await getRemoteFileSize(publishTask.videoUrl)
    const initUploadReq: FacebookReelRequest = {
      upload_phase: 'start',
    }
    const initUploadRes = await this.facebookService.initVideoStoryUpload(
      publishTask.accountId,
      initUploadReq,
    )
    if (!initUploadRes || !initUploadRes.upload_url) {
      this.logger.error(`Video initialization upload failed, response: ${JSON.stringify(initUploadRes)}`)
      throw new Error('Video initialization upload failed')
    }
    const videoFile = await chunkedDownloadFile(publishTask.videoUrl, [0, contentLength - 1])
    await this.facebookService.uploadVideoStory(
      publishTask.accountId,
      initUploadRes.upload_url,
      {
        offset: 0,
        file_size: contentLength,
        file: videoFile,
      },
    )
    await this.postMediaContainerService.createMetaPostMedia({
      accountId: publishTask.accountId,
      publishId: publishTask.id,
      userId: publishTask.userId,
      platform: 'facebook',
      taskId: initUploadRes.video_id,
      status: PostMediaStatus.CREATED,
      category: PostCategory.STORY,
      subCategory: PostSubCategory.VIDEO,
    })
    const task: PublishMetaPostTask = {
      id: publishTask.id,
    }
    await this.queueService.addPostMediaTaskJob(
      {
        taskId: task.id,
        attempts: 0,
      },
      {
        attempts: 30,
        backoff: {
          type: 'fixed',
          delay: 10000,
        },
        removeOnComplete: true,
        removeOnFail: true,
      },
    )
    status = PublishStatus.PUBLISHING
    return status
  }

  async publishStory(publishTask: PublishTask): Promise<PublishStatus> {
    this.logger.log(`Received publish task: ${publishTask.id} for Facebook Story`)
    this.logger.debug(`Publish task details: ${JSON.stringify(publishTask)}`)
    const { imgUrlList, videoUrl } = publishTask
    if (!videoUrl && !imgUrlList) {
      this.logger.error('Story requires a video or images')
      throw new Error('Story requires a video or images')
    }

    if (imgUrlList && imgUrlList.length > 0) {
      return await this.publishPhotoStory(publishTask)
    }
    return await this.publishVideoStory(publishTask)
  }

  async publishVideo(publishTask: PublishTask): Promise<PublishStatus> {
    this.logger.log(`Received publish task: ${publishTask.id} for Facebook`)
    this.logger.debug(`Publish task details: ${JSON.stringify(publishTask)}`)
    let status = PublishStatus.FAILED
    const { imgUrlList, accountId, videoUrl } = publishTask
    const facebookMediaIdList: string[] = []
    if (imgUrlList && imgUrlList.length > 0) {
      for (const imgUrl of imgUrlList) {
        const imgBlob = await fileUrlToBlob(imgUrl)
        const uploadReq = await this.facebookService.uploadImage(
          accountId,
          imgBlob.blob,
        )
        facebookMediaIdList.push(uploadReq.id)
      }
      if (facebookMediaIdList.length === 0) {
        throw new Error('Image upload failed')
      }
      const publishMediaPost = await this.facebookService.publicPhotoPost(
        accountId,
        facebookMediaIdList,
        this.generatePostMessage(publishTask),
      )
      const permalink = `https://www.facebook.com/${publishTask.uid}_${publishMediaPost.id}`
      await this.completePublishTask(publishTask, publishMediaPost.id, {
        workLink: permalink,
      })
      status = PublishStatus.PUBLISHED
      return status
    }

    if (videoUrl) {
      const contentLength = await getRemoteFileSize(videoUrl)

      const initUploadReq: FacebookInitialVideoUploadRequest = {
        upload_phase: 'start',
        file_size: contentLength,
        published: false,
      }
      const initUploadRes = await this.facebookService.initVideoUpload(
        accountId,
        initUploadReq,
      )
      let startOffset = initUploadRes.start_offset
      let endOffset = initUploadRes.end_offset

      while (startOffset < contentLength - 1) {
        const range: [number, number] = [startOffset, endOffset - 1]
        const videoBlob = await chunkedDownloadFile(videoUrl, range)
        const chunkedUploadReq: ChunkedVideoUploadRequest = {
          upload_phase: 'transfer',
          upload_session_id: initUploadRes.upload_session_id,
          start_offset: startOffset,
          end_offset: endOffset,
          video_file_chunk: videoBlob,
          published: false,
        }
        this.logger.log(`Chunked upload request: start_offset=${startOffset}, end_offset=${endOffset}`)
        const chunkedUploadRes
          = await this.facebookService.chunkedMediaUpload(
            accountId,
            chunkedUploadReq,
          )
        startOffset = chunkedUploadRes.start_offset
        endOffset = chunkedUploadRes.end_offset
      }
      const finalizeReq: finalizeVideoUploadRequest = {
        upload_phase: 'finish',
        upload_session_id: initUploadRes.upload_session_id,
        published: false,
      }
      const finalizeRes = await this.facebookService.finalizeMediaUpload(
        accountId,
        finalizeReq,
      )
      if (!finalizeRes.success) {
        throw new Error('Video upload finalization failed')
      }
      const videoPostReq: PublishVideoPostRequest = {
        description: this.generatePostMessage(publishTask),
        crossposted_video_id: initUploadRes.video_id,
        published: true,
      }
      const postRes = await this.facebookService.publishVideoPost(
        accountId,
        videoPostReq,
      )
      const permalink = `https://www.facebook.com/${publishTask.uid}_${postRes.id}`
      await this.completePublishTask(publishTask, postRes.id, {
        workLink: permalink,
      })
      status = PublishStatus.PUBLISHED
      return status
    }
    return status
  }

  async doPub(publishTask: PublishTask): Promise<DoPubRes> {
    const res: DoPubRes = {
      status: -1,
      message: 'Publish task not found',
    }

    const contentCategory = publishTask.option?.facebook?.content_category
    if (!contentCategory) {
      this.logger.error('Invalid publish task: no Facebook page contentCategory specified')
      res.message = 'Invalid publish task: no Facebook page contentCategory specified'
      return res
    }
    const { imgUrlList, videoUrl, desc } = publishTask
    if (!imgUrlList && !videoUrl && !desc) {
      this.logger.error('Invalid publish task: no media and no description')
      res.message = 'Invalid publish task: no media and no description'
      return res
    }

    try {
      switch (contentCategory) {
        case 'post':
          if (!imgUrlList && !videoUrl) {
            res.status = await this.publishFeedPost(publishTask)
            res.message = 'Publish feed post successfully'
            return res
          }
          else {
            res.status = await this.publishVideo(publishTask)
            res.message = 'Video post published successfully'
            return res
          }
        case 'reel':
          res.status = await this.publishReelPost(publishTask)
          res.message = 'Waiting for media processing'
          return res
        case 'story':
          res.status = await this.publishStory(publishTask)
          res.message = 'Story published successfully'
          if (res.status === PublishStatus.PUBLISHING) {
            res.message = 'Waiting for media processing'
          }
          return res
        default:
          this.logger.error(`Unsupported content category: ${contentCategory}`)
          res.message = `Unsupported content category: ${contentCategory}`
          return res
      }
    }
    catch (error) {
      this.logger.error(`Publish task failed: ${error.message}`, error.stack)
      res.message = error.message || 'Publish task failed'
      return res
    }
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
          message: 'Media not found for the task',
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
        const mediaStatusInfo = await this.facebookService.getObjectInfo(task.accountId, media.taskId, 'status')
        this.logger.log(`Media status for task ID ${task.id}, media ID ${media.taskId}: ${JSON.stringify(mediaStatusInfo)}`)
        if (mediaStatusInfo.status.video_status === 'error') {
          this.logger.error(
            `Media processing failed for task ID: ${task.id}, media ID: ${media.taskId}`,
          )
          await this.postMediaContainerService.updateContainer(media.id, {
            status: PostMediaStatus.FAILED,
          })
          return {
            status: PublishStatus.FAILED,
            message: 'Media processing failed',
            noRetry: true,
          }
        }
        let mediaStatus = PostMediaStatus.CREATED
        if (
          mediaStatusInfo.status.video_status === 'processing'
          || mediaStatusInfo.status.video_status === 'encoded'
        ) {
          mediaStatus = PostMediaStatus.IN_PROGRESS
        }
        if (mediaStatusInfo.status.video_status === 'upload_complete') {
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
        this.logger.warn(`Not all media files processed for task ID: ${task.id}. Processed: ${processedCount}, Total: ${medias.length}`)
        throw new Error(`Media files are still processing. Processed: ${processedCount}, Total: ${medias.length}`)
      }
      this.logger.log(`All media files processed for task ID: ${task.id}`)
      let publishRes
      if (task.option?.facebook?.content_category === 'reel') {
        publishRes = await this.facebookService.publishReel(task.accountId, {
          upload_phase: 'finish',
          video_state: 'published',
          video_id: unProcessedMedias[0].taskId,
          description: this.generatePostMessage(task),
        })
      }
      if (task.option?.facebook?.content_category === 'story') {
        publishRes = await this.facebookService.publishVideoStory(
          task.accountId,
          {
            upload_phase: 'finish',
            video_state: 'published',
            video_id: unProcessedMedias[0].taskId,
            description: this.generatePostMessage(task),
          },
        )
      }
      this.logger.log(
        `publish: Media container published for task ID: ${task.id}, response: ${JSON.stringify(publishRes)}`,
      )
      if (!publishRes || !publishRes.success) {
        this.logger.log(
          `Failed to publish media container for task ID: ${task.id}`,
        )
        return {
          status: PublishStatus.FAILED,
          message: '发布媒体容器失败',
          noRetry: true,
        }
      }
      let category = 'stories'
      if (task.option?.facebook?.content_category === 'reel') {
        category = 'reel'
      }
      const permalink = `https://www.facebook.com/${category}/${unProcessedMedias[0].taskId}`

      this.logger.log(
        `Successfully published media container for task ID: ${task.id}`,
      )
      await this.completePublishTask(task, unProcessedMedias[0].taskId, {
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
        message: `发布失败: ${error.message || error}`,
        noRetry: true,
      }
    }
  }

  override async pushPubTask(newData: PublishTask, attempts = 0): Promise<boolean> {
    await this.publishQueueOpen(newData.id)
    const jobRes = await this.queueService.addPostPublishJob(
      {
        taskId: newData.id,
        attempts: attempts++, // 进行次数
        jobId: newData.queueId,
      },
      {
        attempts: this.queueAttempts,
        backoff: {
          type: 'exponential',
          delay: 20000, // 每次重试间隔 20 秒
        },
        removeOnComplete: true,
        jobId: newData.queueId, // 确保任务id唯一，防止重复执行
      },
    )
    return jobRes.id === newData.queueId
  }
}
