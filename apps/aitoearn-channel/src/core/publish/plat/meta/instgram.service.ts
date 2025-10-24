import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'

import { InjectModel } from '@nestjs/mongoose'
import { Queue } from 'bullmq'
import { Model } from 'mongoose'
import { InstagramService } from '../../../../core/plat/meta/instagram.service'
import {
  PostCategory,
  PostMediaStatus,
  PostSubCategory,
} from '../../../../libs/database/schema/postMediaContainer.schema'
import {
  PublishStatus,
  PublishTask,
} from '../../../../libs/database/schema/publishTask.schema'
import { InstagramMediaType } from '../../../../libs/instagram/instagram.enum'
import { CreateMediaContainerRequest } from '../../../../libs/instagram/instagram.interfaces'
import { DoPubRes } from '../../common'
import { PublishBase } from '../publish.base'
import { PostMediaContainerService } from './container.service'
import { MetaPostPublisher, PublishMetaPostTask } from './meta.interface'

@Injectable()
export class InstagramPublishService
  extends PublishBase
  implements MetaPostPublisher {
  override queueName: string = 'instagram'
  private readonly metaMediaTaskQueue: Queue
  private readonly logger = new Logger(InstagramPublishService.name, {
    timestamp: true,
  })

  constructor(
    override readonly eventEmitter: EventEmitter2,
    @InjectModel(PublishTask.name)
    override readonly publishTaskModel: Model<PublishTask>,
    @InjectQueue('post_publish') publishQueue: Queue,
    @InjectQueue('post_media_task') metaMediaTaskQueue: Queue,
    readonly instagramService: InstagramService,
    private readonly postMediaContainerService: PostMediaContainerService,
  ) {
    super(eventEmitter, publishTaskModel, publishQueue)
    this.metaMediaTaskQueue = metaMediaTaskQueue
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

  private async createMediaContainer(publishTask: PublishTask, srcImgURL, mediaType = InstagramMediaType.IMAGE): Promise<void> {
    const createContainerReq: CreateMediaContainerRequest = {
      media_type: mediaType,
      image_url: srcImgURL,
      caption: this.generatePostMessage(publishTask) || publishTask.title || '',
    }
    if (mediaType === InstagramMediaType.CAROUSEL) {
      createContainerReq.is_carousel_item = true
    }
    const initUploadRes = await this.instagramService.createMediaContainer(
      publishTask.accountId,
      createContainerReq,
    )
    try {
      await this.postMediaContainerService.createMetaPostMedia({
        accountId: publishTask.accountId,
        publishId: publishTask.id,
        userId: publishTask.userId,
        platform: 'instagram',
        taskId: initUploadRes.id,
        status: PostMediaStatus.CREATED,
        category: PostCategory.POST,
        subCategory: PostSubCategory.PHOTO,
      })
    }
    catch (error) {
      this.logger.error(`Create media record failed: ${error.message || error}`, error.stack)
      throw new Error(`Create media record failed: ${error.message || error}`)
    }
  }

  async publishPost(publishTask: PublishTask): Promise<PublishStatus> {
    let status = PublishStatus.FAILED
    if (!publishTask.imgUrlList || publishTask.imgUrlList.length === 0) {
      throw new Error('No image resources')
    }
    const mediaType = publishTask.imgUrlList.length === 1 ? InstagramMediaType.IMAGE : InstagramMediaType.CAROUSEL
    for (const imgUrl of publishTask.imgUrlList) {
      await this.createMediaContainer(publishTask, imgUrl, mediaType)
    }
    const task: PublishMetaPostTask = {
      id: publishTask.id,
    }
    await this.metaMediaTaskQueue.add(
      `instagram:post:task:${task.id}`,
      {
        taskId: task.id,
        attempts: 0,
      },
      {
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 20000,
        },
        removeOnComplete: true,
        removeOnFail: true,
      },
    )

    status = PublishStatus.PUBLISHING
    return status
  }

  async publishReel(publishTask: PublishTask): Promise<PublishStatus> {
    let status = PublishStatus.FAILED
    if (!publishTask.videoUrl) {
      throw new Error('No video resources')
    }

    const createContainerReq: CreateMediaContainerRequest = {
      video_url: publishTask.videoUrl,
      media_type: InstagramMediaType.REELS,
      caption: publishTask.desc || publishTask.title || '',
    }
    const initUploadRes = await this.instagramService.createMediaContainer(
      publishTask.accountId,
      createContainerReq,
    )
    await this.postMediaContainerService.createMetaPostMedia({
      accountId: publishTask.accountId,
      publishId: publishTask.id,
      userId: publishTask.userId,
      platform: 'instagram',
      taskId: initUploadRes.id,
      status: PostMediaStatus.CREATED,
      category: PostCategory.REELS,
      subCategory: PostSubCategory.VIDEO,
    })

    const task: PublishMetaPostTask = {
      id: publishTask.id,
    }
    await this.metaMediaTaskQueue.add(
      `instagram:reel:task:${task.id}`,
      {
        taskId: task.id,
        attempts: 0,
      },
      {
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 20000,
        },
        removeOnComplete: true,
        removeOnFail: true,
      },
    )
    status = PublishStatus.PUBLISHING
    return status
  }

  async publishVideoStory(publishTask: PublishTask): Promise<PublishStatus> {
    let status = PublishStatus.FAILED
    if (!publishTask.videoUrl) {
      throw new Error('No video resources')
    }
    const createContainerReq: CreateMediaContainerRequest = {
      video_url: publishTask.videoUrl,
      media_type: InstagramMediaType.STORIES,
      caption: this.generatePostMessage(publishTask) || publishTask.title || '',
    }
    const initUploadRes = await this.instagramService.createMediaContainer(
      publishTask.accountId,
      createContainerReq,
    )
    await this.postMediaContainerService.createMetaPostMedia({
      accountId: publishTask.accountId,
      publishId: publishTask.id,
      userId: publishTask.userId,
      platform: 'instagram',
      taskId: initUploadRes.id,
      status: PostMediaStatus.CREATED,
      category: PostCategory.STORY,
      subCategory: PostSubCategory.VIDEO,
    })

    const task: PublishMetaPostTask = {
      id: publishTask.id,
    }
    await this.metaMediaTaskQueue.add(
      `instagram:story:task:${task.id}`,
      {
        taskId: task.id,
        attempts: 0,
      },
      {
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 20000,
        },
        removeOnComplete: true,
        removeOnFail: true,
      },
    )
    status = PublishStatus.PUBLISHING
    return status
  }

  async publishPhotoStory(publishTask: PublishTask): Promise<PublishStatus> {
    let status = PublishStatus.FAILED
    if (!publishTask.imgUrlList || publishTask.imgUrlList.length === 0) {
      throw new Error('No image resources')
    }
    const createContainerReq: CreateMediaContainerRequest = {
      media_type: InstagramMediaType.STORIES,
      image_url: publishTask.imgUrlList[0],
    }
    const initUploadRes = await this.instagramService.createMediaContainer(
      publishTask.accountId,
      createContainerReq,
    )
    await this.postMediaContainerService.createMetaPostMedia({
      accountId: publishTask.accountId,
      publishId: publishTask.id,
      userId: publishTask.userId,
      platform: 'instagram',
      taskId: initUploadRes.id,
      status: PostMediaStatus.CREATED,
      category: PostCategory.STORY,
      subCategory: PostSubCategory.PHOTO,
    })

    const task: PublishMetaPostTask = {
      id: publishTask.id,
    }
    await this.metaMediaTaskQueue.add(
      `instagram:photo:story:task:${task.id}`,
      {
        taskId: task.id,
        attempts: 0,
      },
      {
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 20000,
        },
        removeOnComplete: true,
        removeOnFail: true,
      },
    )
    status = PublishStatus.PUBLISHING
    return status
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
        const mediaStatusInfo = await this.instagramService.getObjectInfo(
          task.accountId,
          media.taskId,
          '',
        )
        if (!mediaStatusInfo || !mediaStatusInfo.id) {
          this.logger.error(
            `Failed to get media status for task ID: ${task.id}, media ID: ${media.taskId}`,
          )
          continue
        }
        this.logger.log(
          `Media status for task ID ${task.id}, media ID ${media.taskId}: ${JSON.stringify(mediaStatusInfo)}`,
        )
        if (mediaStatusInfo.status === 'FAILED') {
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
        if (mediaStatusInfo.status === 'IN_PROGRESS') {
          mediaStatus = PostMediaStatus.IN_PROGRESS
        }
        if (mediaStatusInfo.status === 'FINISHED') {
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
          message: 'Waiting for media processing to complete',
        }
      }
      this.logger.log(`All media files processed for task ID: ${task.id}`)

      const postCategory = unProcessedMedias[0].category

      let containerTypes = InstagramMediaType.IMAGE
      if (postCategory === PostCategory.STORY) {
        containerTypes = InstagramMediaType.STORIES
      }
      else if (postCategory === PostCategory.REELS) {
        containerTypes = InstagramMediaType.REELS
      }

      let containerId = medias[0].taskId

      if (postCategory === PostCategory.POST && medias.length > 1) {
        containerTypes = InstagramMediaType.CAROUSEL
        const containerIdList = medias.map(media => media.taskId)
        const createContainerReq: CreateMediaContainerRequest = {
          media_type: containerTypes,
          children: containerIdList,
          caption: this.generatePostMessage(task) || task.title || '',
        }
        const postContainer = await this.instagramService.createMediaContainer(
          task.accountId,
          createContainerReq,
        )
        containerId = postContainer.id
      }
      this.logger.log(`Container ID for task ID ${task.id}: ${containerId}`)
      const publishRes = await this.instagramService.publishMediaContainer(
        task.accountId,
        containerId,
      )
      this.logger.log(`publish: Media container published for task ID: ${task.id}, response: ${JSON.stringify(publishRes)}`)
      let permalink = ''
      try {
        const objectInfo = await this.instagramService.getObjectInfo(
          task.accountId,
          publishRes.id,
          '',
          'permalink',
        )
        this.logger.log(
          `publish: Retrieved object info for task ID: ${task.id}, response: ${JSON.stringify(objectInfo)}`,
        )
        if (objectInfo && objectInfo.permalink) {
          permalink = objectInfo.permalink
        }
      }
      catch (error) {
        this.logger.error(
          `Failed to get permalink for task ID: ${task.id}, error: ${error.message || error}`,
        )
      }
      this.logger.log(
        `Successfully published media container for task ID: ${task.id}`,
      )
      await this.completePublishTask(task, publishRes.id, {
        workLink: permalink,
      })
      this.logger.log(`completed: Task ID ${task.id} processed successfully`)
      return {
        status: PublishStatus.PUBLISHED,
        message: 'Post published successfully',
      }
    }
    catch (error) {
      this.logger.error(
        `Error processing task ID ${task.id}: ${error.message || error}`,
      )
      return {
        status: PublishStatus.FAILED,
        message: error.message || 'Post publish failed',
        noRetry: true,
      }
    }
  }

  async doPub(publishTask: PublishTask): Promise<DoPubRes> {
    const res: DoPubRes = {
      status: PublishStatus.FAILED,
      message: 'Publish task not found',
    }
    try {
      const postCategory = publishTask.option?.instagram?.content_category
      switch (postCategory) {
        case 'post':
          res.status = await this.publishPost(publishTask)
          break
        case 'reel':
          res.status = await this.publishReel(publishTask)
          break
        case 'story':
          if (publishTask.videoUrl) {
            res.status = await this.publishVideoStory(publishTask)
          }
          else {
            res.status = await this.publishPhotoStory(publishTask)
          }
          break
        default:
          res.message = 'Unknown content category'
          return res
      }
      res.message = 'Post published successfully'
      if (res.status === PublishStatus.PUBLISHING) {
        res.message = 'Media processing, publishing in progress'
      }
      return res
    }
    catch (error) {
      this.logger.error(`Publish error for task ID ${publishTask.id}: ${error.message || error}`, error.stack)
      res.message = error.message || 'Post publish failed'
      return res
    }
  }
}
