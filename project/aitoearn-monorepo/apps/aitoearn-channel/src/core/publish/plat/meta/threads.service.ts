import { Injectable, Logger } from '@nestjs/common'
import { ThreadsService } from '../../../../core/plat/meta/threads.service'
import { PostMediaStatus } from '../../../../libs/database/schema/postMediaContainer.schema'
import {
  PublishStatus,
  PublishTask,
} from '../../../../libs/database/schema/publishTask.schema'
import { ThreadsMediaType } from '../../../../libs/threads/threads.enum'
import { ThreadsContainerRequest } from '../../../../libs/threads/threads.interfaces'
import { DoPubRes } from '../../common'
import { PublishBase } from '../publish.base'
import { PostMediaContainerService } from './container.service'
import { MetaPostPublisher, PublishMetaPostTask } from './meta.interface'

@Injectable()
export class ThreadsPublishService
  extends PublishBase
  implements MetaPostPublisher {
  override queueName: string = 'threads'
  private readonly logger = new Logger(ThreadsPublishService.name, {
    timestamp: true,
  })

  constructor(
    readonly threadsService: ThreadsService,
    private readonly postMediaContainerService: PostMediaContainerService,
  ) {
    super()
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

  async doPub(publishTask: PublishTask): Promise<DoPubRes> {
    const res: DoPubRes = {
      status: -1,
      message: '任务不存在',
    }
    try {
      const { imgUrlList, accountId, videoUrl } = publishTask
      if (imgUrlList && imgUrlList.length > 0) {
        const isCarouselItem = imgUrlList.length > 1
        for (const imgUrl of imgUrlList) {
          const createContainerReq: ThreadsContainerRequest = {
            media_type: 'IMAGE',
            image_url: imgUrl,
            text: publishTask.desc || '',
          }
          if (
            publishTask.option
            && publishTask.option.threads
            && publishTask.option.threads.location_id
          ) {
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
          if (!container) {
            res.message = '创建容器失败'
            return res
          }
          await this.postMediaContainerService.createMetaPostMedia({
            accountId: publishTask.accountId,
            publishId: publishTask.id,
            userId: publishTask.userId,
            platform: 'threads',
            taskId: container.id,
            status: PostMediaStatus.CREATED,
          })
        }
      }
      else if (videoUrl) {
        const createContainerReq: ThreadsContainerRequest = {
          media_type: 'VIDEO',
          video_url: videoUrl,
          text: publishTask.desc || '',
        }
        if (publishTask.topics && publishTask.topics.length > 0) {
          createContainerReq.topic_tag = publishTask.topics[0]
        }
        if (imgUrlList && imgUrlList.length > 0) {
          createContainerReq.is_carousel_item = true
        }
        if (
          publishTask.option
          && publishTask.option.threads
          && publishTask.option.threads.location_id
        ) {
          createContainerReq.location_id
            = publishTask.option.threads.location_id
        }
        const container = await this.threadsService.createItemContainer(
          accountId,
          createContainerReq,
        )
        if (!container) {
          res.message = '创建视频容器失败'
          return res
        }
        await this.postMediaContainerService.createMetaPostMedia({
          accountId: publishTask.accountId,
          publishId: publishTask.id,
          userId: publishTask.userId,
          platform: 'threads',
          taskId: container.id,
          status: PostMediaStatus.CREATED,
        })
      }
      else {
        const createContainerReq: ThreadsContainerRequest = {
          media_type: 'TEXT',
          text: publishTask.desc || '',
        }
        if (publishTask.topics && publishTask.topics.length > 0) {
          createContainerReq.topic_tag = publishTask.topics[0]
        }
        if (
          publishTask.option
          && publishTask.option.threads
          && publishTask.option.threads.location_id
        ) {
          createContainerReq.location_id
            = publishTask.option.threads.location_id
        }
        const container = await this.threadsService.createItemContainer(
          accountId,
          createContainerReq,
        )
        if (!container) {
          res.message = '创建视频容器失败'
          return res
        }
        await this.postMediaContainerService.createMetaPostMedia({
          accountId: publishTask.accountId,
          publishId: publishTask.id,
          userId: publishTask.userId,
          platform: 'threads',
          taskId: container.id,
          status: PostMediaStatus.CREATED,
        })
      }
      const task: PublishMetaPostTask = {
        id: publishTask.id,
      }
      const result = this.queueService.addPostMediaTaskJob(
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

      this.logger.log(`Media task added to queue: ${result}`)
      res.status = PublishStatus.PUBLISHING
      res.message = '发布中'
      return res
    }
    catch (error) {
      res.message = `发布失败: ${error.message}`
      return res
    }
  }

  async publish(task: PublishTask): Promise<DoPubRes> {
    const containers = await this.postMediaContainerService.getContainers(
      task.id,
    )
    if (!containers || containers.length === 0) {
      return {
        status: PublishStatus.FAILED,
        message: '没有找到媒体文件',
        noRetry: true,
      }
    }
    const unProcessedContainers = containers.filter(
      media => media.status !== PostMediaStatus.FINISHED,
    )
    this.logger.log(
      `Found ${containers.length} media files for task ID: ${task.id}`,
    )
    let processedCount = 0
    for (const media of unProcessedContainers) {
      const mediaStatusInfo = await this.threadsService.getObjectInfo(
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
    const isMediaCompleted = processedCount === unProcessedContainers.length
    if (!isMediaCompleted) {
      this.logger.warn(
        `Not all media files processed for task ID: ${task.id}. Processed: ${processedCount}, Total: ${containers.length}`,
      )
      return {
        status: PublishStatus.PUBLISHING,
        message: '媒体文件处理中',
      }
    }
    this.logger.log(`All media files processed for task ID: ${task.id}`)
    let containerTypes = ThreadsMediaType.VIDEO
    let containerId = containers[0].taskId

    if (containers.length > 1) {
      containerTypes = ThreadsMediaType.CAROUSEL
      const containerIdList = containers.map(media => media.taskId)
      const createContainerReq: ThreadsContainerRequest = {
        media_type: containerTypes,
        children: containerIdList,
        text: task.desc || '',
      }
      if (task.topics && task.topics.length > 0) {
        createContainerReq.topic_tag = task.topics[0]
      }
      if (
        task.option
        && task.option.threads
        && task.option.threads.location_id
      ) {
        createContainerReq.location_id = task.option.threads.location_id
      }
      const postContainer = await this.threadsService.createItemContainer(
        task.accountId,
        createContainerReq,
      )
      if (!postContainer || !postContainer.id) {
        this.logger.error(
          `Failed to create media container for task ID: ${task.id}`,
        )
        return {
          status: PublishStatus.FAILED,
          message: '创建媒体容器失败',
          noRetry: true,
        }
      }
      containerId = postContainer.id
    }
    this.logger.log(`Container ID for task ID ${task.id}: ${containerId}`)
    const publishRes = await this.threadsService.publishPost(
      task.accountId,
      containerId,
    )
    if (!publishRes || !publishRes.id) {
      this.logger.error(
        `Failed to publish media container for task ID: ${task.id}`,
      )
      return {
        status: PublishStatus.FAILED,
        message: '发布媒体容器失败',
        noRetry: true,
      }
    }
    this.logger.log(
      `Successfully published media container for task ID: ${task.id}`,
    )
    let permalink = ''
    try {
      const objectInfo = await this.threadsService.getObjectInfo(
        task.accountId,
        publishRes.id,
        '',
        'permalink',
      )
      if (objectInfo && objectInfo.permalink) {
        permalink = objectInfo.permalink
      }
    }
    catch (error) {
      this.logger.error(
        `Failed to get object info for published post: ${error.message}`,
        error.stack,
      )
    }
    await this.completePublishTask(task, publishRes.id, {
      workLink: permalink,
    })
    this.logger.log(`completed: Task ID ${task.id} processed successfully`)
    return {
      status: PublishStatus.PUBLISHED,
      message: '所有媒体文件已处理完成',
    }
  }
}
