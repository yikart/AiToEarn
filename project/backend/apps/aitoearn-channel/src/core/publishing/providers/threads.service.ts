import { Injectable, Logger } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import { ThreadsService } from '../../../core/platforms/meta/threads.service'
import { PostCategory, PostSubCategory } from '../../../libs/database/schema/postMediaContainer.schema'
import {
  PublishStatus,
  PublishTask,
} from '../../../libs/database/schema/publishTask.schema'
import { ThreadsMediaType } from '../../../libs/threads/threads.enum'
import { ThreadsContainerRequest } from '../../../libs/threads/threads.interfaces'
import { PublishingException } from '../publishing.exception'
import { PublishingTaskResult } from '../publishing.interface'
import { PublishService } from './base.service'

@Injectable()
export class ThreadsPublishService extends PublishService {
  private readonly logger = new Logger(ThreadsPublishService.name, {
    timestamp: true,
  })

  protected override readonly ProcessMediaFailed = 'FAILED'
  protected override readonly ProcessMediaInProgress = 'IN_PROGRESS'
  protected override readonly ProcessMediaCompleted = 'FINISHED'

  constructor(
    readonly threadsService: ThreadsService,
  ) {
    super()
  }

  private async getPostPermalink(accountId: string, postId: string): Promise<string> {
    try {
      const objectInfo = await this.threadsService.getObjectInfo(
        accountId,
        postId,
        '',
        'permalink',
      )
      return objectInfo.permalink ?? ''
    }
    catch (error) {
      this.logger.error(`Failed to get threads post permalink, accountId: ${accountId}, postId: ${postId}, error: ${error}`)
      return ''
    }
  }

  protected override generatePostMessage(publishTask: PublishTask): string {
    if (!publishTask) {
      return ''
    }
    if (publishTask.topics && publishTask.topics.length > 1) {
      const topics = publishTask.topics.slice(1)
      if (publishTask.desc) {
        return `${publishTask.desc} #${topics.join(' #')}`
      }
      return `#${topics.join(' #')}`
    }
    return publishTask.desc || ''
  }

  async determinePostType(publishTask: PublishTask): Promise<string> {
    const { imgUrlList, videoUrl } = publishTask
    if (imgUrlList && imgUrlList.length > 0) {
      return 'image'
    }
    if (videoUrl) {
      return 'video'
    }
    return 'plainText'
  }

  async publishPlainTextPost(publishTask: PublishTask): Promise<PublishingTaskResult> {
    const locationId = publishTask.option?.threads?.location_id
    const createContainerReq: ThreadsContainerRequest = {
      media_type: 'TEXT',
      text: this.generatePostMessage(publishTask),
    }
    if (publishTask.topics && publishTask.topics.length > 0) {
      createContainerReq.topic_tag = publishTask.topics[0]
    }
    if (locationId) {
      createContainerReq.location_id = locationId
    }
    const container = await this.threadsService.createItemContainer(
      publishTask.accountId,
      createContainerReq,
    )
    await this.processUploadMedia(publishTask, 'threads', PostCategory.POST, PostSubCategory.PLAINTEXT, container.id)
    return {
      status: PublishStatus.PUBLISHING,
    }
  }

  async publishImagePost(publishTask: PublishTask): Promise<PublishingTaskResult> {
    const { accountId, imgUrlList } = publishTask
    const locationId = publishTask.option?.threads?.location_id
    const isCarouselItem = imgUrlList.length > 1
    for (const imgUrl of imgUrlList) {
      const createContainerReq: ThreadsContainerRequest = {
        media_type: 'IMAGE',
        image_url: imgUrl,
        text: publishTask.desc || '',
      }
      if (locationId) {
        createContainerReq.location_id
          = publishTask.option.threads.location_id
      }
      if (publishTask.topics && publishTask.topics.length > 0) {
        createContainerReq.topic_tag = publishTask.topics[0]
      }
      if (isCarouselItem) {
        createContainerReq.is_carousel_item = true
      }
      const container = await this.threadsService.createItemContainer(
        accountId,
        createContainerReq,
      )
      await this.savePostMedia(publishTask, 'threads', PostCategory.POST, PostSubCategory.PHOTO, container.id)
    }
    await this.publishPostMediaTask(publishTask.id, publishTask.queueId)
    return {
      status: PublishStatus.PUBLISHING,
    }
  }

  async publishVideoPost(publishTask: PublishTask): Promise<PublishingTaskResult> {
    const locationId = publishTask.option?.threads?.location_id
    const createContainerReq: ThreadsContainerRequest = {
      media_type: 'VIDEO',
      video_url: publishTask.videoUrl,
      text: this.generatePostMessage(publishTask),
    }
    if (publishTask.topics && publishTask.topics.length > 0) {
      createContainerReq.topic_tag = publishTask.topics[0]
    }
    if (locationId) {
      createContainerReq.location_id = locationId
    }
    const container = await this.threadsService.createItemContainer(
      publishTask.accountId,
      createContainerReq,
    )
    await this.processUploadMedia(publishTask, 'threads', PostCategory.POST, PostSubCategory.VIDEO, container.id)
    return {
      status: PublishStatus.PUBLISHING,
    }
  }

  async immediatePublish(publishTask: PublishTask): Promise<PublishingTaskResult> {
    const postType = await this.determinePostType(publishTask)
    switch (postType) {
      case 'image':
        return this.publishImagePost(publishTask)
      case 'video':
        return this.publishVideoPost(publishTask)
      case 'plainText':
        return this.publishPlainTextPost(publishTask)
      default:
        throw PublishingException.nonRetryable('Unsupported post type for Threads publishing')
    }
  }

  override async getMediaProcessingStatus(accountId: string, mediaId: string): Promise<string | void> {
    const mediaStatusInfo = await this.threadsService.getObjectInfo(accountId, mediaId, '')
    return mediaStatusInfo.status
  }

  override async finalizePublish(task: PublishTask): Promise<PublishingTaskResult> {
    const locationId = task.option?.threads?.location_id
    const mediasStatus = await this.getMediasProcessingStatus(task)
    if (mediasStatus.hasFailed) {
      throw PublishingException.nonRetryable(`Media processing failed for task ID: ${task.id}`)
    }
    if (!mediasStatus.isCompleted) {
      throw PublishingException.retryable(`Media files are still processing. Please wait for media processing to complete.`)
    }
    this.logger.log(`All media files processed for task ID: ${task.id}`)
    let containerTypes = ThreadsMediaType.VIDEO

    if (mediasStatus.medias.length > 1) {
      containerTypes = ThreadsMediaType.CAROUSEL
      const containerIdList = mediasStatus.medias.map(media => media.taskId)
      const createContainerReq: ThreadsContainerRequest = {
        media_type: containerTypes,
        children: containerIdList,
        text: this.generatePostMessage(task),
      }
      if (task.topics && task.topics.length > 0) {
        createContainerReq.topic_tag = task.topics[0]
      }
      if (locationId) {
        createContainerReq.location_id = locationId
      }
      const postContainer = await this.threadsService.createItemContainer(
        task.accountId,
        createContainerReq,
      )
      const queueId = uuidv4().toString()
      task.queueId = queueId
      await this.publishTaskModel.updateOne({ _id: task.id }, { queueId }).exec()
      await this.savePostMedia(task, 'threads', PostCategory.POST, PostSubCategory.PHOTO, postContainer.id)
      await this.publishPostMediaTask(task.id, task.queueId)
      return {
        status: PublishStatus.PUBLISHING,
      }
    }
    const containerId = mediasStatus.medias[0].taskId
    this.logger.log(`Container ID for task ID ${task.id}: ${containerId}`)
    const publishRes = await this.threadsService.publishPost(
      task.accountId,
      containerId,
    )
    const permalink = await this.getPostPermalink(task.accountId, publishRes.id)
    return {
      postId: publishRes.id,
      permalink,
      status: PublishStatus.PUBLISHED,
    }
  }
}
