import { Injectable, Logger } from '@nestjs/common'
import {
  chunkedDownloadFile,
  fileUrlToBlob,
  getFileTypeFromUrl,
  getRemoteFileSize,
} from '../../../common'
import { TwitterService } from '../../../core/platforms/twitter/twitter.service'
import {
  PostCategory,
  PostMediaStatus,
  PostSubCategory,
} from '../../../libs/database/schema/postMediaContainer.schema'
import {
  PublishStatus,
  PublishTask,
} from '../../../libs/database/schema/publishTask.schema'
import { XMediaCategory, XMediaType } from '../../../libs/twitter/twitter.enum'
import {
  PostMedia,
  XChunkedMediaUploadRequest,
  XCreatePostRequest,
  XMediaUploadInitRequest,
} from '../../../libs/twitter/twitter.interfaces'
import { PublishingException } from '../publishing.exception'
import { PublishingTaskResult } from '../publishing.interface'
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
  ) {
    super()
  }

  private isPlainTextPost(publishTask: PublishTask): boolean {
    const { imgUrlList, videoUrl } = publishTask
    return (!imgUrlList || imgUrlList.length === 0) && !videoUrl
  }

  override async getMediaProcessingStatus(accountId: string, mediaId: string): Promise<string | void> {
    const mediaStatusInfo = await this.twitterService.getMediaUploadStatus(accountId, mediaId)
    return mediaStatusInfo.data.processing_info.state
  }

  async publishPlainTextPost(task: PublishTask): Promise<PublishingTaskResult> {
    const post: XCreatePostRequest = {
      text: this.generatePostMessage(task) || '',
    }
    const createPostRes = await this.twitterService.createPost(
      task.accountId,
      post,
    )
    const permalink = `https://x.com/${task.uid}/status/${createPostRes.data.id}`
    return {
      postId: createPostRes.data.id,
      permalink,
      status: PublishStatus.PUBLISHED,
    }
  }

  async publishImagePost(publishTask: PublishTask): Promise<PublishingTaskResult> {
    const { accountId, imgUrlList } = publishTask
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
        media_id: initUploadRes.data.id,
        segment_index: 0,
      }

      await this.twitterService.chunkedMediaUploadRequest(
        accountId,
        uploadReq,
      )
      await this.twitterService.finalizeMediaUpload(
        accountId,
        initUploadRes.data.id,
      )
      await this.savePostMedia(publishTask, 'twitter', PostCategory.POST, PostSubCategory.PHOTO, initUploadRes.data.id, PostMediaStatus.FINISHED)
    }
    await this.publishPostMediaTask(publishTask.id, publishTask.queueId)
    return {
      status: PublishStatus.PUBLISHING,
    }
  }

  async publishVideoPost(publishTask: PublishTask): Promise<PublishingTaskResult> {
    const { accountId, videoUrl } = publishTask
    if (!videoUrl) {
      throw PublishingException.nonRetryable('No video found for video post')
    }
    const fileName = getFileTypeFromUrl(videoUrl, true)
    const ext = fileName.split('.').pop()?.toLowerCase()
    const mimeType = ext === 'mp4' ? 'video/mp4' : `video/${ext}`

    const contentLength = await getRemoteFileSize(videoUrl)
    if (!contentLength) {
      throw PublishingException.nonRetryable('Get video size failed')
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

    const chunkSize = 4 * 1024 * 1024 // 4MB
    const totalChunks = Math.ceil(contentLength / chunkSize)
    for (let sequenceNum = 0; sequenceNum < totalChunks; sequenceNum++) {
      const start = sequenceNum * chunkSize
      const end = Math.min(start + chunkSize - 1, contentLength - 1)
      const range: [number, number] = [start, end]
      const fileSegment = await chunkedDownloadFile(videoUrl, range)
      if (!fileSegment) {
        throw PublishingException.nonRetryable('Download video segment failed')
      }
      this.logger.log(
        `chunked upload, Size: ${fileSegment.length}, Range: ${start}-${end}, Sequence: ${sequenceNum}`,
      )
      const uploadReq: XChunkedMediaUploadRequest = {
        media: new Blob([fileSegment]),
        media_id: initUploadRes.data.id,
        segment_index: sequenceNum,
      }
      await this.twitterService.chunkedMediaUploadRequest(
        accountId,
        uploadReq,
      )
    }
    await this.twitterService.finalizeMediaUpload(
      accountId,
      initUploadRes.data.id,
    )
    await this.savePostMedia(publishTask, 'twitter', PostCategory.POST, PostSubCategory.VIDEO, initUploadRes.data.id)
    await this.publishPostMediaTask(publishTask.id, publishTask.queueId)
    return {
      status: PublishStatus.PUBLISHING,
    }
  }

  async immediatePublish(publishTask: PublishTask): Promise<PublishingTaskResult> {
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

  override async finalizePublish(publishTask: PublishTask): Promise<PublishingTaskResult> {
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

    const permalink = `https://x.com/${publishTask.uid}/status/${createPostRes.data.id}`
    return {
      postId: createPostRes.data.id,
      permalink,
      status: PublishStatus.PUBLISHED,
    }
  }
}
