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

  async uploadReelVideo(accountId: string, videoUrl: string): Promise<string> {
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
      throw PublishingException.nonRetryable('Video initialization upload failed')
    }

    const videoFile = await chunkedDownloadFile(videoUrl, [0, contentLength - 1])
    const uploadRes = await this.facebookService.uploadReel(
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

  async uploadVideoStory(accountId: string, videoUrl: string): Promise<string> {
    const contentLength = await getRemoteFileSize(videoUrl)
    const initUploadReq: FacebookReelRequest = {
      upload_phase: 'start',
    }
    const initUploadRes = await this.facebookService.initVideoStoryUpload(
      accountId,
      initUploadReq,
    )
    if (!initUploadRes || !initUploadRes.upload_url) {
      this.logger.error(`Video initialization upload failed, response: ${JSON.stringify(initUploadRes)}`)
      throw new Error('Video initialization upload failed')
    }
    const videoFile = await chunkedDownloadFile(videoUrl, [0, contentLength - 1])
    await this.facebookService.uploadVideoStory(
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

  async publishFeedPost(publishTask: PublishTask): Promise<PublishingTaskResult> {
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

  async publishReelPost(publishTask: PublishTask): Promise<PublishingTaskResult> {
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
    const videoId = await this.uploadVideoStory(publishTask.accountId, publishTask.videoUrl)
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

  async publishVideo(publishTask: PublishTask): Promise<PublishingTaskResult> {
    this.logger.log(`Received publish task: ${publishTask.id} for Facebook`)
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
        throw PublishingException.nonRetryable('Image upload failed')
      }
      const publishPost = await this.facebookService.publicPhotoPost(
        accountId,
        facebookMediaIdList,
        this.generatePostMessage(publishTask),
      )
      const permalink = `https://www.facebook.com/${publishTask.uid}_${publishPost.id}`
      const result = {
        postId: publishPost.id,
        permalink,
        status: PublishStatus.PUBLISHED,
      }
      return result
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
      const result = {
        postId: postRes.id,
        permalink,
        status: PublishStatus.PUBLISHED,
      }
      return result
    }
    throw PublishingException.nonRetryable('Invalid publish task: no media and no description')
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
          return await this.publishFeedPost(publishTask)
        }
        else {
          return await this.publishVideo(publishTask)
        }
      case 'reel':
        return await this.publishReelPost(publishTask)
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
}
