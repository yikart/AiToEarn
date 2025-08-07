import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { AccountType } from '@transports/account/common'
import { Queue } from 'bullmq'
import { Model } from 'mongoose'
import { chunkedDownloadFile, fileUrlToBlob, getFileTypeFromUrl, getRemoteFileSize } from '@/common'
import { TwitterService } from '@/core/plat/twitter/twitter.service'
import { MetaMediaStatus } from '@/libs/database/schema/metaContainer.schema'
import { PublishRecord } from '@/libs/database/schema/publishRecord.schema'
import { PublishStatus, PublishTask } from '@/libs/database/schema/publishTask.schema'
import { XMediaCategory, XMediaType } from '@/libs/twitter/twitter.enum'
import { PostMedia, XChunkedMediaUploadRequest, XCreatePostRequest, XMediaUploadInitRequest } from '@/libs/twitter/twitter.interfaces'
import { DoPubRes } from '../../common'
import { PublishBase } from '../publish.base'
import { MetaContainerService } from './container.service'
import { MetaPostPublisher, PublishMetaPostTask } from './meta.interface'

@Injectable()
export class TwitterPublishService extends PublishBase implements MetaPostPublisher {
  queueName: string = AccountType.TWITTER

  private readonly metaMediaTaskQueue: Queue
  private readonly logger = new Logger(TwitterPublishService.name, {
    timestamp: true,
  })

  constructor(
    @InjectModel(PublishTask.name)
    readonly publishTaskModel: Model<PublishTask>,
    @InjectModel(PublishRecord.name)
    readonly publishRecordModel: Model<PublishRecord>,
    @InjectQueue('bull_publish') publishQueue: Queue,
    @InjectQueue('meta_media_task') metaMediaTaskQueue: Queue,
    readonly twitterService: TwitterService,
    private readonly metaContainerService: MetaContainerService,
  ) {
    super(publishTaskModel, publishRecordModel, publishQueue)
    this.metaMediaTaskQueue = metaMediaTaskQueue
    this.metaContainerService = metaContainerService
  }

  // TODO: 校验账户授权状态
  async checkAuth(accountId: string): Promise<{
    status: 0 | 1;
    timeout?: number; // 秒
  }> {
    Logger.log(`checkAuth: ${accountId}`)
    return {
      status: 1,
      timeout: 10000,
    }
  }

  async doPub(publishTask: PublishTask): Promise<DoPubRes> {
    const res: DoPubRes = {
      status: -1,
      message: '任务不存在',
    }

    const { imgUrlList, accountId, videoUrl } = publishTask
    if (imgUrlList) {
      for (const imgUrl of imgUrlList) {
        const imgBlob = await fileUrlToBlob(imgUrl)
        if (!imgBlob) {
          res.message = '图片下载失败'
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
          res.message = '图片初始化上传失败'
          return res
        }
        const uploadReq: XChunkedMediaUploadRequest = {
          media: Buffer.from(await imgBlob.blob.arrayBuffer()),
          media_id: initUploadRes.data.id,
          segment_index: 0,
        }

        const updateRes = await this.twitterService.chunkedMediaUploadRequest(
          accountId,
          uploadReq,
        )
        if (!updateRes || !updateRes.data.expires_at) {
          res.message = '图片分片上传失败'
          return res
        }
        const finalizeUploadRes = await this.twitterService.finalizeMediaUpload(
          accountId,
          initUploadRes.data.id,
        )
        if (!finalizeUploadRes || !finalizeUploadRes.data.id) {
          res.message = '确认图片上传失败'
          return res
        }
        await this.metaContainerService.createMetaPostMedia({
          publishId: publishTask.id,
          userId: publishTask.userId,
          platform: 'twitter',
          taskId: initUploadRes.data.id,
          status: MetaMediaStatus.CREATED,
        })
      }
    }

    if (videoUrl) {
      const fileName = getFileTypeFromUrl(videoUrl, true)
      const ext = fileName.split('.').pop()?.toLowerCase()
      const mimeType = ext === 'mp4' ? 'video/mp4' : `video/${ext}`

      const contentLength = await getRemoteFileSize(videoUrl)
      if (!contentLength) {
        res.message = '视频信息解析失败'
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
        res.message = '视频初始化上传失败'
        return res
      }
      const chunkSize = 5 * 1024 * 1024 // 5MB
      const totalParts = Math.ceil(contentLength / chunkSize)
      for (let partNumber = 0; partNumber < totalParts; partNumber++) {
        const start = partNumber * chunkSize
        const end = Math.min(start + chunkSize, contentLength - 1)
        const range: [number, number] = [start, end]
        const videoBlob = await chunkedDownloadFile(videoUrl, range)
        if (!videoBlob) {
          res.message = '视频分片下载失败'
          return res
        }

        const uploadReq: XChunkedMediaUploadRequest = {
          media: videoBlob,
          media_id: initUploadRes.data.id,
          segment_index: partNumber,
        }
        const upload = await this.twitterService.chunkedMediaUploadRequest(
          accountId,
          uploadReq,
        )
        if (!upload || !upload.data.expires_at) {
          res.message = '视频分片上传失败'
          return res
        }
      }
      const finalizeUploadRes = await this.twitterService.finalizeMediaUpload(
        accountId,
        initUploadRes.data.id,
      )
      if (!finalizeUploadRes || !finalizeUploadRes.data.id) {
        res.message = '确认视频上传完成失败'
        return res
      }
      await this.metaContainerService.createMetaPostMedia({
        accountId: publishTask.accountId,
        publishId: publishTask.id,
        userId: publishTask.userId,
        platform: 'twitter',
        taskId: initUploadRes.data.id,
        status: MetaMediaStatus.CREATED,
      })
    }
    const task: PublishMetaPostTask = {
      id: publishTask.id,
    }
    await this.metaMediaTaskQueue.add(
      'twitter:media:task',
      task,
      {
        attempts: 0,
        removeOnComplete: true,
        removeOnFail: true,
      },
    )

    res.status = PublishStatus.PUB_LOADING
    res.message = '发布中'
    return res;
  }

  async publish(task: PublishTask): Promise<DoPubRes> {
    try {
      this.logger.log(`publish: Starting to process task ID: ${task.id}`);
      const medias = await this.metaContainerService.getContainers(task.id);
      if (!medias || medias.length === 0) {
        return {
          status: PublishStatus.FAIL,
          message: '没有找到媒体文件',
          noRetry: true,
        }
      }
      const unProcessedMedias = medias.filter(media => media.status !== MetaMediaStatus.FINISHED);
      this.logger.log(`Found ${medias.length} media files for task ID: ${task.id}`);
      let processedCount = 0;
      for (const media of unProcessedMedias) {
        const mediaStatusInfo = await this.twitterService.getMediaUploadStatus(task.accountId, media.taskId);
        if (!mediaStatusInfo || !mediaStatusInfo.data.processing_info.state) {
          this.logger.error(`Failed to get media status for task ID: ${task.id}, media ID: ${media.taskId}`);
          continue;
        }
        this.logger.log(`Media status for task ID ${task.id}, media ID ${media.taskId}: ${JSON.stringify(mediaStatusInfo)}`);
        if (mediaStatusInfo.data.processing_info.state === 'failed') {
          this.logger.error(`Media processing failed for task ID: ${task.id}, media ID: ${media.taskId}`);
          await this.metaContainerService.updateContainer(media.id, { status: MetaMediaStatus.FAILED });
          return {
            status: PublishStatus.FAIL,
            message: '资源处理失败',
            noRetry: true,
          }
        }
        let mediaStatus = MetaMediaStatus.CREATED
        if (mediaStatusInfo.data.processing_info.state === 'in_progress') {
          mediaStatus = MetaMediaStatus.IN_PROGRESS;
        }
        if (mediaStatusInfo.data.processing_info.state === 'succeeded') {
          this.logger.log(`Media processing finished for task ID: ${task.id}, media ID: ${media.taskId}`);
          mediaStatus = MetaMediaStatus.FINISHED;
          processedCount++;
        }
        await this.metaContainerService.updateContainer(media.id, { status: mediaStatus });
      }
      const isMediaCompleted = processedCount === unProcessedMedias.length;
      if (!isMediaCompleted) {
        this.logger.warn(`Not all media files processed for task ID: ${task.id}. Processed: ${processedCount}, Total: ${medias.length}`);
        return {
          status: PublishStatus.PUB_LOADING,
          message: '媒体文件处理中',
        }
      }
      this.logger.log(`All media files processed for task ID: ${task.id}`);
      const postMedia: PostMedia = {
        media_ids: medias.map(media => media.taskId),
      }
      const post: XCreatePostRequest = {
        text: task.desc || '',
        media: postMedia,
      }
      const createPostRes = await this.twitterService.createPost(
        task.accountId,
        post,
      )
      this.logger.log(`publish: Media container published for task ID: ${task.id}, response: ${JSON.stringify(createPostRes)}`);
      if (!createPostRes || !createPostRes.data.id) {
        this.logger.log(`Failed to publish media container for task ID: ${task.id}`);
        return {
          status: PublishStatus.FAIL,
          message: '发布媒体容器失败',
          noRetry: true,
        }
      }
      const permalink = `https://x.com/${task.accountId}/status/${createPostRes.data.id}`;

      this.logger.log(`Successfully published media container for task ID: ${task.id}`);
      await this.overPublishTask(task, createPostRes.data.id, { workLink: permalink });
      this.logger.log(`completed: Task ID ${task.id} processed successfully`);
      return {
        status: PublishStatus.RELEASED,
        message: '所有媒体文件已处理完成',
      }
    }
    catch (error) {
      this.logger.error(`Error processing task ID ${task.id}: ${error.message || error}`);
      return {
        status: PublishStatus.FAIL,
        message: `发布失败: ${error.message || error}`,
        noRetry: true,
      }
    }
  }
}
