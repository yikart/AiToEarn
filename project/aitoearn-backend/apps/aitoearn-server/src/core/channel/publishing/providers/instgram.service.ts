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
import { v4 as uuidv4 } from 'uuid'
import { InstagramMediaType } from '../../libs/instagram/instagram.enum'
import { CreateMediaContainerRequest } from '../../libs/instagram/instagram.interfaces'
import { InstagramService } from '../../platforms/meta/instagram.service'
import { PublishingException } from '../publishing.exception'
import { PublishingTaskResult, VerifyPublishResult } from '../publishing.interface'
import { PublishService } from './base.service'

@Injectable()
export class InstagramPublishService
  extends PublishService {
  private readonly logger = new Logger(InstagramPublishService.name, {
    timestamp: true,
  })

  protected override readonly ProcessMediaFailed = 'FAILED'
  protected override readonly ProcessMediaInProgress = 'IN_PROGRESS'
  protected override readonly ProcessMediaCompleted = 'FINISHED'

  constructor(
    readonly instagramService: InstagramService,
    private readonly assetsService: AssetsService,
  ) {
    super()
  }

  override async getMediaProcessingStatus(accountId: string, mediaId: string): Promise<string | void> {
    const mediaStatusInfo = await this.instagramService.getObjectInfo(accountId, mediaId, 'status')
    return mediaStatusInfo.status
  }

  private async getPostPermalink(accountId: string, postId: string): Promise<string> {
    try {
      const postInfo = await this.instagramService.getObjectInfo(accountId, postId, '', 'permalink')
      return postInfo.permalink
    }
    catch (error) {
      this.logger.error(`Failed to get post permalink for accountId: ${accountId}, postId: ${postId}, error: ${error}`)
      return ''
    }
  }

  protected override generatePostMessage(publishTask: PublishRecord): string {
    const text = publishTask.desc || publishTask.title || ''
    if (publishTask.topics && publishTask.topics.length > 0) {
      if (text) {
        return `${text} #${publishTask.topics.join(' #')}`
      }
      return `#${publishTask.topics.join(' #')}`
    }
    return text
  }

  private async createMediaContainer(publishTask: PublishRecord, srcImgURL: string, mediaType = InstagramMediaType.IMAGE, isCarouselItem = false): Promise<void> {
    if (!publishTask.accountId) {
      throw new PublishingException('Account ID is required', true)
    }
    const createContainerReq: CreateMediaContainerRequest = {
      media_type: mediaType,
      image_url: srcImgURL,
      caption: this.generatePostMessage(publishTask),
    }
    if (isCarouselItem) {
      createContainerReq.is_carousel_item = true
    }
    const initUploadRes = await this.instagramService.createMediaContainer(
      publishTask.accountId,
      createContainerReq,
    )
    await this.savePostMedia(publishTask, 'instagram', PostCategory.POST, PostSubCategory.PHOTO, initUploadRes.id, PostMediaStatus.CREATED)
  }

  async publishPost(publishTask: PublishRecord): Promise<PublishingTaskResult> {
    if (!publishTask.imgUrlList || publishTask.imgUrlList.length === 0) {
      throw PublishingException.nonRetryable('No image resources')
    }
    const isCarouselItem = publishTask.imgUrlList.length > 1
    for (const imgUrl of publishTask.imgUrlList) {
      await this.createMediaContainer(publishTask, imgUrl, InstagramMediaType.IMAGE, isCarouselItem)
    }
    await this.publishPostMediaTask(publishTask.id, publishTask.queueId || '')
    return {
      status: PublishStatus.PUBLISHING,
    }
  }

  async publishReel(publishTask: PublishRecord): Promise<PublishingTaskResult> {
    if (!publishTask.videoUrl) {
      throw PublishingException.nonRetryable('No video resources')
    }
    if (!publishTask.accountId) {
      throw new PublishingException('Account ID is required', true)
    }

    const createContainerReq: CreateMediaContainerRequest = {
      video_url: publishTask.videoUrl,
      media_type: InstagramMediaType.REELS,
      caption: this.generatePostMessage(publishTask),
    }
    const initUploadRes = await this.instagramService.createMediaContainer(
      publishTask.accountId,
      createContainerReq,
    )
    await this.savePostMedia(publishTask, 'instagram', PostCategory.REELS, PostSubCategory.VIDEO, initUploadRes.id)

    await this.publishPostMediaTask(publishTask.id, publishTask.queueId || '')
    return {
      status: PublishStatus.PUBLISHING,
    }
  }

  async publishVideoStory(publishTask: PublishRecord): Promise<PublishingTaskResult> {
    if (!publishTask.videoUrl) {
      throw new PublishingException('No video resources', true)
    }
    if (!publishTask.accountId) {
      throw new PublishingException('Account ID is required', true)
    }
    const createContainerReq: CreateMediaContainerRequest = {
      video_url: publishTask.videoUrl,
      media_type: InstagramMediaType.STORIES,
      caption: this.generatePostMessage(publishTask),
    }
    const initUploadRes = await this.instagramService.createMediaContainer(
      publishTask.accountId,
      createContainerReq,
    )
    await this.savePostMedia(publishTask, 'instagram', PostCategory.STORY, PostSubCategory.VIDEO, initUploadRes.id)
    await this.publishPostMediaTask(publishTask.id, publishTask.queueId || '')
    return {
      status: PublishStatus.PUBLISHING,
    }
  }

  async publishPhotoStory(publishTask: PublishRecord): Promise<PublishingTaskResult> {
    if (!publishTask.imgUrlList || publishTask.imgUrlList.length === 0) {
      throw new Error('No image resources')
    }
    if (!publishTask.accountId) {
      throw new PublishingException('Account ID is required', true)
    }
    const createContainerReq: CreateMediaContainerRequest = {
      media_type: InstagramMediaType.STORIES,
      image_url: publishTask.imgUrlList[0],
      caption: this.generatePostMessage(publishTask),
    }
    const initUploadRes = await this.instagramService.createMediaContainer(
      publishTask.accountId,
      createContainerReq,
    )
    await this.savePostMedia(publishTask, 'instagram', PostCategory.STORY, PostSubCategory.PHOTO, initUploadRes.id)
    await this.publishPostMediaTask(publishTask.id, publishTask.queueId || '')
    return {
      status: PublishStatus.PUBLISHING,
    }
  }

  override async finalizePublish(task: PublishRecord): Promise<PublishingTaskResult> {
    if (!task.accountId) {
      throw new PublishingException('accountId ID is missing', true)
    }
    const mediasStatus = await this.getMediasProcessingStatus(task)
    if (mediasStatus.hasFailed) {
      throw PublishingException.nonRetryable(`Media processing failed for task ID: ${task.id}`)
    }
    if (!mediasStatus.isCompleted) {
      throw PublishingException.retryable(`Task-[${task.id}] Media files are still processing. Please wait for media processing to complete.`)
    }
    this.logger.log(`All media files processed for task ID: ${task.id}`)
    const postCategory = mediasStatus.medias[0].category

    let containerTypes = InstagramMediaType.IMAGE
    if (postCategory === PostCategory.STORY) {
      containerTypes = InstagramMediaType.STORIES
    }
    else if (postCategory === PostCategory.REELS) {
      containerTypes = InstagramMediaType.REELS
    }

    const isCarousel = postCategory === PostCategory.POST && mediasStatus.medias.length > 1
    if (isCarousel) {
      containerTypes = InstagramMediaType.CAROUSEL
      const containerIdList = mediasStatus.medias.map(media => media.taskId)
      const createContainerReq: CreateMediaContainerRequest = {
        media_type: containerTypes,
        children: containerIdList,
        caption: this.generatePostMessage(task),
      }
      const postContainer = await this.instagramService.createMediaContainer(
        task.accountId,
        createContainerReq,
      )
      const queueId = uuidv4().toString()
      task.queueId = queueId
      await this.publishRecordService.updateQueueId(task.id, queueId)
      await this.savePostMedia(task, 'instagram', PostCategory.POST, PostSubCategory.PHOTO, postContainer.id)
      await this.publishPostMediaTask(task.id, task.queueId)
      return {
        status: PublishStatus.PUBLISHING,
      }
    }
    const containerId = mediasStatus.medias[0].taskId
    this.logger.log(`Container ID for task ID ${task.id}: ${containerId}`)
    const publishRes = await this.instagramService.publishMediaContainer(
      task.accountId,
      containerId,
    )
    this.logger.log(`publish: Media container published for task ID: ${task.id}, response: ${JSON.stringify(publishRes)}`)
    const permalink = await this.getPostPermalink(task.accountId, publishRes.id)
    return {
      postId: publishRes.id,
      permalink,
      status: PublishStatus.PUBLISHED,
    }
  }

  async immediatePublish(publishTask: PublishRecord): Promise<PublishingTaskResult> {
    if (publishTask.videoUrl)
      publishTask.videoUrl = this.assetsService.buildUrl(publishTask.videoUrl)
    publishTask.imgUrlList = publishTask.imgUrlList?.map(url => this.assetsService.buildUrl(url)) || []
    publishTask.coverUrl = publishTask.coverUrl ? this.assetsService.buildUrl(publishTask.coverUrl) : undefined
    const postCategory = publishTask.option?.instagram?.content_category
    switch (postCategory) {
      case 'post':
        return await this.publishPost(publishTask)
      case 'reel':
        return await this.publishReel(publishTask)
      case 'story':
        if (publishTask.videoUrl) {
          return await this.publishVideoStory(publishTask)
        }
        else {
          return await this.publishPhotoStory(publishTask)
        }
      default:
        throw PublishingException.nonRetryable('Invalid or missing content category for Instagram publish task')
    }
  }

  async verifyAndCompletePublish(publishRecord: PublishRecord): Promise<VerifyPublishResult> {
    if (!publishRecord.accountId) {
      return {
        success: false,
        errorMsg: `Task ID: ${publishRecord.id} has no associated account, cannot verify publish status`,
      }
    }

    try {
      // Instagram 通过 API 获取帖子信息验证发布状态
      const postInfo = await this.instagramService.getObjectInfo(
        publishRecord.accountId,
        publishRecord.dataId || '',
        '',
        'permalink',
      )

      if (postInfo && postInfo.permalink) {
        return {
          success: true,
          workLink: postInfo.permalink,
        }
      }

      return {
        success: false,
        errorMsg: 'Instagram 帖子不存在或已被删除',
      }
    }
    catch (error) {
      this.logger.error(`验证 Instagram 发布状态失败: ${(error as Error).message}`, (error as Error).stack)
      return {
        success: false,
        errorMsg: `验证发布状态失败: ${(error as Error).message}`,
      }
    }
  }
}
