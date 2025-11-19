import { Injectable, Logger } from '@nestjs/common'
import {
  chunkedDownloadFile,
  fileUrlToBlob,
  getRemoteFileSize,
} from '../../../common'
import { FacebookService } from '../../../core/platforms/meta/facebook.service'
import {
  PostCategory,
  PostSubCategory,
} from '../../../libs/database/schema/postMediaContainer.schema'
import {
  PublishStatus,
  PublishTask,
} from '../../../libs/database/schema/publishTask.schema'
import {
  ChunkedVideoUploadRequest,
  FacebookInitialVideoUploadRequest,
  FacebookReelRequest,
  FacebookReelResponse,
  finalizeVideoUploadRequest,
  PublishFeedPostRequest,
  PublishVideoPostRequest,
} from '../../../libs/facebook/facebook.interfaces'
import { PublishingException } from '../publishing.exception'
import { PublishingTaskResult } from '../publishing.interface'
import { PublishService } from './base.service'

@Injectable()
export class FacebookPublishService
  extends PublishService {
  private readonly logger = new Logger(FacebookPublishService.name, {
    timestamp: true,
  })

  protected override readonly ProcessMediaFailed = 'error'
  protected override readonly ProcessMediaInProgress = 'processing'
  protected override readonly ProcessMediaCompleted = 'upload_complete'

  constructor(
    readonly facebookService: FacebookService,
  ) {
    super()
  }

  async uploadImage(accountId: string, imgUrl: string): Promise<string> {
    const imgBlob = await fileUrlToBlob(imgUrl)
    const uploadReq = await this.facebookService.uploadImage(
      accountId,
      imgBlob.blob,
    )
    return uploadReq.id
  }

  async uploadVideo(accountId: string, videoUrl: string): Promise<string> {
    if (!videoUrl) {
      throw PublishingException.nonRetryable('Video requires a video URL')
    }
    const contentLength = await getRemoteFileSize(videoUrl)
    if (!contentLength) {
      throw PublishingException.nonRetryable('get video meta failed')
    }
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
    return initUploadRes.video_id
  }

  async uploadReelVideo(accountId: string, videoUrl: string): Promise<string> {
    const contentLength = await getRemoteFileSize(videoUrl)
    const initUploadReq: FacebookReelRequest = {
      upload_phase: 'start',
    }
    const initUploadRes = await this.facebookService.initReelVideoUpload(
      accountId,
      initUploadReq,
    )
    if (!initUploadRes || !initUploadRes.upload_url) {
      this.logger.error(`Video initialization upload failed, response: ${JSON.stringify(initUploadRes)}`)
      throw PublishingException.nonRetryable('Video initialization upload failed')
    }

    const videoFile = await chunkedDownloadFile(videoUrl, [0, contentLength - 1])
    const uploadRes = await this.facebookService.uploadReelVideo(
      accountId,
      initUploadRes.upload_url,
      {
        offset: 0,
        file_size: contentLength,
        file: videoFile,
      },
    )
    if (!uploadRes || !uploadRes.success) {
      throw PublishingException.nonRetryable('Video upload failed')
    }
    return initUploadRes.video_id
  }

  async uploadStoryVideo(accountId: string, videoUrl: string): Promise<string> {
    const contentLength = await getRemoteFileSize(videoUrl)
    const initUploadReq: FacebookReelRequest = {
      upload_phase: 'start',
    }
    const initUploadRes = await this.facebookService.initStoryVideoUpload(
      accountId,
      initUploadReq,
    )
    if (!initUploadRes || !initUploadRes.upload_url) {
      this.logger.error(`Video initialization upload failed, response: ${JSON.stringify(initUploadRes)}`)
      throw new Error('Video initialization upload failed')
    }
    const videoFile = await chunkedDownloadFile(videoUrl, [0, contentLength - 1])
    await this.facebookService.uploadStoryVideo(
      accountId,
      initUploadRes.upload_url,
      {
        offset: 0,
        file_size: contentLength,
        file: videoFile,
      },
    )
    return initUploadRes.video_id
  }

  async publishFeed(publishTask: PublishTask): Promise<PublishingTaskResult> {
    this.logger.log(`Received publish task: ${publishTask.id} for Facebook Feed Post`)
    if (!publishTask.desc) {
      throw PublishingException.nonRetryable('Feed Post requires a description')
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
    return {
      status: PublishStatus.PUBLISHED,
      postId: postRes.id,
      permalink,
    }
  }

  async publishReel(publishTask: PublishTask): Promise<PublishingTaskResult> {
    this.logger.log(`Received publish task: ${publishTask.id} for Facebook Reel`)
    const { imgUrlList, accountId, videoUrl } = publishTask
    if (imgUrlList && imgUrlList.length > 0) {
      throw PublishingException.nonRetryable('Reel does not support image uploads')
    }
    if (!videoUrl) {
      throw PublishingException.nonRetryable('Reel requires a video URL')
    }

    const videoId = await this.uploadReelVideo(accountId, videoUrl)
    await this.processUploadMedia(publishTask, 'facebook', PostCategory.STORY, PostSubCategory.VIDEO, videoId)
    return {
      status: PublishStatus.PUBLISHING,
    }
  }

  async publishPhotoStory(publishTask: PublishTask): Promise<PublishingTaskResult> {
    this.logger.log(`Received publish task: ${publishTask.id} for Facebook Story`)
    const { imgUrlList, accountId } = publishTask
    if (!imgUrlList) {
      throw PublishingException.nonRetryable('Story requires images')
    }

    if (imgUrlList && imgUrlList.length < 1) {
      throw PublishingException.nonRetryable('Story requires at least one image')
    }

    const imgUrl = imgUrlList[0]
    const containerId = await this.uploadImage(accountId, imgUrl)

    await this.facebookService.publishPhotoStory(
      accountId,
      containerId,
    )
    const permalink = `https://www.facebook.com/stories/${containerId}`
    return {
      postId: containerId,
      permalink,
      status: PublishStatus.PUBLISHED,
    }
  }

  async publishVideoStory(publishTask: PublishTask): Promise<PublishingTaskResult> {
    if (!publishTask.videoUrl) {
      throw PublishingException.nonRetryable('Story requires a video URL')
    }
    const videoId = await this.uploadStoryVideo(publishTask.accountId, publishTask.videoUrl)
    await this.processUploadMedia(publishTask, 'facebook', PostCategory.STORY, PostSubCategory.VIDEO, videoId)
    return {
      status: PublishStatus.PUBLISHING,
    }
  }

  async publishStory(publishTask: PublishTask): Promise<PublishingTaskResult> {
    this.logger.log(`Received publish task: ${publishTask.id} for Facebook Story`)
    const { imgUrlList, videoUrl } = publishTask
    if (!videoUrl && !imgUrlList) {
      throw PublishingException.nonRetryable('Story requires a video or images')
    }

    if (imgUrlList && imgUrlList.length > 0) {
      return await this.publishPhotoStory(publishTask)
    }
    return await this.publishVideoStory(publishTask)
  }

  async publishPhotos(publishTask: PublishTask): Promise<PublishingTaskResult> {
    const { imgUrlList, accountId } = publishTask
    if (!imgUrlList) {
      throw PublishingException.nonRetryable('Photos requires images')
    }
    const medias: string[] = []
    for (const imgUrl of imgUrlList) {
      const mediaId = await this.uploadImage(accountId, imgUrl)
      medias.push(mediaId)
    }
    if (medias.length === 0) {
      throw PublishingException.nonRetryable('Image upload failed')
    }
    const publishPost = await this.facebookService.publicPhotos(
      accountId,
      medias,
      this.generatePostMessage(publishTask),
    )
    const permalink = `https://www.facebook.com/${publishTask.uid}_${publishPost.id}`
    return {
      postId: publishPost.id,
      permalink,
      status: PublishStatus.PUBLISHED,
    }
  }

  async publishVideo(publishTask: PublishTask): Promise<PublishingTaskResult> {
    const videoId = await this.uploadVideo(publishTask.accountId, publishTask.videoUrl)
    const videoPostReq: PublishVideoPostRequest = {
      description: this.generatePostMessage(publishTask),
      crossposted_video_id: videoId,
      published: true,
    }
    const postRes = await this.facebookService.publishVideo(
      publishTask.accountId,
      videoPostReq,
    )
    const permalink = `https://www.facebook.com/${publishTask.uid}_${postRes.id}`
    return {
      postId: postRes.id,
      permalink,
      status: PublishStatus.PUBLISHED,
    }
  }

  async immediatePublish(publishTask: PublishTask): Promise<PublishingTaskResult> {
    const contentCategory = publishTask.option?.facebook?.content_category
    if (!contentCategory) {
      throw PublishingException.nonRetryable('Invalid publish task: no Facebook page contentCategory specified')
    }
    const { imgUrlList, videoUrl, desc } = publishTask
    if (!imgUrlList && !videoUrl && !desc) {
      throw PublishingException.nonRetryable('Invalid publish task: no media and no description')
    }
    switch (contentCategory) {
      case 'post':
        if (!imgUrlList && !videoUrl) {
          return await this.publishFeed(publishTask)
        }
        else if (videoUrl) {
          return await this.publishVideo(publishTask)
        }
        else {
          return await this.publishPhotos(publishTask)
        }
      case 'reel':
        return await this.publishReel(publishTask)
      case 'story':
        return await this.publishStory(publishTask)
      default:
        throw PublishingException.nonRetryable(`Unsupported content category: ${contentCategory}`)
    }
  }

  override async getMediaProcessingStatus(accountId: string, mediaId: string): Promise<string | void> {
    const mediaStatusInfo = await this.facebookService.getObjectInfo(accountId, mediaId, 'status')
    if (!mediaStatusInfo || !mediaStatusInfo.id) {
      throw PublishingException.nonRetryable(`Failed to get media status, media ID: ${mediaId}`)
    }
    return mediaStatusInfo.status.video_status
  }

  override async finalizePublish(task: PublishTask): Promise<PublishingTaskResult> {
    const mediasStatus = await this.getMediasProcessingStatus(task)
    if (mediasStatus.hasFailed) {
      throw PublishingException.nonRetryable(`Media processing failed for task ID: ${task.id}`)
    }
    if (!mediasStatus.isCompleted) {
      throw PublishingException.retryable(`Media files are still processing. Please wait for media processing to complete.`)
    }
    this.logger.log(`All media files processed for task ID: ${task.id}`)
    let publishRes: FacebookReelResponse = null
    if (task.option?.facebook?.content_category === 'reel') {
      publishRes = await this.facebookService.publishReel(
        task.accountId,
        {
          upload_phase: 'finish',
          video_state: 'published',
          video_id: mediasStatus.medias[0].taskId,
          description: this.generatePostMessage(task),
        },
      )
    }

    if (task.option?.facebook?.content_category === 'story') {
      publishRes = await this.facebookService.publishVideoStory(
        task.accountId,
        {
          upload_phase: 'finish',
          video_state: 'published',
          video_id: mediasStatus.medias[0].taskId,
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
      throw PublishingException.nonRetryable(`Failed to publish media container for task ID: ${task.id}`)
    }
    let category = 'stories'
    if (task.option?.facebook?.content_category === 'reel') {
      category = 'reel'
    }
    const postId = mediasStatus.medias[0].taskId
    const permalink = `https://www.facebook.com/${category}/${postId}`
    return {
      postId,
      permalink,
      status: PublishStatus.PUBLISHED,
    }
  }

  async updateTextPost(publishTask: PublishTask): Promise<PublishingTaskResult> {
    const { desc, dataId } = publishTask
    if (!desc) {
      throw PublishingException.nonRetryable('Invalid publish task: no description')
    }
    if (!dataId) {
      throw PublishingException.nonRetryable('Invalid publish task: no postId')
    }
    const message = this.generatePostMessage(publishTask)
    await this.facebookService.updatePost(publishTask.accountId, publishTask.dataId, {
      message,
    })
    return {
      status: PublishStatus.PUBLISHED,
    }
  }

  async updateVideoPost(publishTask: PublishTask): Promise<PublishingTaskResult> {
    const { videoUrl, dataId } = publishTask
    if (!videoUrl) {
      throw PublishingException.nonRetryable('Invalid publish task: no video URL')
    }
    if (!dataId) {
      throw PublishingException.nonRetryable('Invalid publish task: no postId')
    }
    const videoId = await this.uploadVideo(publishTask.accountId, videoUrl)
    const message = this.generatePostMessage(publishTask)
    await this.facebookService.updatePost(publishTask.accountId, publishTask.dataId, {
      is_published: true,
      message,
      attachments: [{
        media_fbid: videoId,
        message,
      }],
    })
    return {
      status: PublishStatus.PUBLISHED,
    }
  }

  async updatePhotosPost(publishTask: PublishTask): Promise<PublishingTaskResult> {
    const { imgUrlList, dataId } = publishTask
    if (!imgUrlList) {
      throw PublishingException.nonRetryable('Invalid publish task: no images')
    }
    if (!dataId) {
      throw PublishingException.nonRetryable('Invalid publish task: no postId')
    }
    const medias: string[] = []
    for (const imgUrl of imgUrlList) {
      const mediaId = await this.uploadImage(publishTask.accountId, imgUrl)
      medias.push(mediaId)
    }
    if (medias.length === 0) {
      throw PublishingException.nonRetryable('Image upload failed')
    }
    const message = this.generatePostMessage(publishTask)
    const data = {
      message,
      is_published: true,
      attachments: medias.map(mediaId => ({
        media_fbid: mediaId,
        message,
      })),
    }
    this.logger.log(`Updating photos post: ${publishTask.dataId}, message: ${message}, data: ${JSON.stringify(data)}`)
    await this.facebookService.updatePost(publishTask.accountId, publishTask.dataId, data)
    return {
      status: PublishStatus.PUBLISHED,
    }
  }

  override async updatePublishedPost(publishTask: PublishTask, updatedContentType: string): Promise<PublishingTaskResult> {
    const contentCategory = publishTask.option?.facebook?.content_category
    if (!contentCategory) {
      throw PublishingException.nonRetryable('Invalid publish task: no Facebook page contentCategory specified')
    }
    switch (updatedContentType) {
      case 'text':
        return await this.updateTextPost(publishTask)
      case 'video':
        return await this.updateVideoPost(publishTask)
      case 'image':
        return await this.updatePhotosPost(publishTask)
      default:
        throw PublishingException.nonRetryable(`Unsupported content category: ${contentCategory} for update`)
    }
  }
}
