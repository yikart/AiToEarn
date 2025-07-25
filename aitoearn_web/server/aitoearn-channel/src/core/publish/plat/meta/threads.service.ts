import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Queue } from 'bullmq'

import { Model } from 'mongoose'
import { ThreadsService } from '@/core/plat/meta/threads.service'
import { MetaMediaStatus } from '@/libs/database/schema/metaContainer.schema'
import { PublishRecord } from '@/libs/database/schema/publishRecord.schema'
import { PublishStatus, PublishTask } from '@/libs/database/schema/publishTask.schema'
import { ThreadsMediaType } from '@/libs/threads/threads.enum'
import { ThreadsContainerRequest } from '@/libs/threads/threads.interfaces'
import { DoPubRes } from '../../common'
import { PublishBase } from '../publish.base'
import { MetaContainerService } from './container.service'
import { MetaPostPublisher, PublishMetaPostTask } from './meta.interface'

@Injectable()
export class ThreadsPublishService extends PublishBase implements MetaPostPublisher {
  queueName: string = 'threads'
  private readonly metaMediaTaskQueue: Queue
  private readonly logger = new Logger(ThreadsPublishService.name, {
    timestamp: true,
  })

  constructor(
    @InjectModel(PublishTask.name)
    readonly publishTaskModel: Model<PublishTask>,
    @InjectModel(PublishRecord.name)
    readonly publishRecordModel: Model<PublishRecord>,
    @InjectQueue('bull_publish') publishQueue: Queue,
    readonly threadsService: ThreadsService,
    @InjectQueue('meta_media_task') metaMediaTaskQueue: Queue,
    private readonly metaContainerService: MetaContainerService,

  ) {
    super(publishTaskModel, publishRecordModel, publishQueue)
    this.metaMediaTaskQueue = metaMediaTaskQueue
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
    try {
      const { imgUrlList, accountId, videoUrl } = publishTask
      if (imgUrlList && imgUrlList.length > 0) {
        for (const imgUrl of imgUrlList) {
          const createContainerReq: ThreadsContainerRequest = {
            is_carousel_item: true,
            media_type: 'IMAGE',
            image_url: imgUrl,
          }
          const container = await this.threadsService.createItemContainer(accountId, createContainerReq)
          if (!container) {
            res.message = '创建容器失败'
            return res
          }
          await this.metaContainerService.createMetaPostMedia({
            accountId: publishTask.accountId,
            publishId: publishTask.id,
            userId: publishTask.userId,
            platform: 'threads',
            taskId: container.id,
            status: MetaMediaStatus.CREATED,
          })
        }
      }
      if (videoUrl) {
        const downloadULR = videoUrl.replace('undefined', 'https://ai-to-earn.oss-cn-beijing.aliyuncs.com/')
        const createContainerReq: ThreadsContainerRequest = {
          media_type: 'VIDEO',
          video_url: downloadULR,
        }
        if (imgUrlList && imgUrlList.length > 0) {
          createContainerReq.is_carousel_item = true;
        }
        const container = await this.threadsService.createItemContainer(accountId, createContainerReq)
        if (!container) {
          res.message = '创建视频容器失败'
          return res
        }
        await this.metaContainerService.createMetaPostMedia({
          accountId: publishTask.accountId,
          publishId: publishTask.id,
          userId: publishTask.userId,
          platform: 'threads',
          taskId: container.id,
          status: MetaMediaStatus.CREATED,
        })
      }
      const task: PublishMetaPostTask = {
        id: publishTask.id,
      }
      await this.metaMediaTaskQueue.add(
        'threads:media:task',
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
    catch (error) {
      res.message = `发布失败: ${error.message}`
      return res
    }
  }

  async publish(task: PublishTask): Promise<DoPubRes> {
    const containers = await this.metaContainerService.getContainers(task.id);
    if (!containers || containers.length === 0) {
      return {
        status: PublishStatus.FAIL,
        message: '没有找到媒体文件',
        noRetry: true,
      }
    }
    const unProcessedContainers = containers.filter(media => media.status !== MetaMediaStatus.FINISHED);
    this.logger.log(`Found ${containers.length} media files for task ID: ${task.id}`);
    let processedCount = 0;
    for (const media of unProcessedContainers) {
      const mediaStatusInfo = await this.threadsService.getObjectInfo(task.accountId, media.taskId, '');
      if (!mediaStatusInfo || !mediaStatusInfo.id) {
        this.logger.error(`Failed to get media status for task ID: ${task.id}, media ID: ${media.taskId}`);
        continue;
      }
      this.logger.log(`Media status for task ID ${task.id}, media ID ${media.taskId}: ${JSON.stringify(mediaStatusInfo)}`);
      if (mediaStatusInfo.status === 'FAILED') {
        this.logger.error(`Media processing failed for task ID: ${task.id}, media ID: ${media.taskId}`);
        await this.metaContainerService.updateContainer(media.id, { status: MetaMediaStatus.FAILED });
        return {
          status: PublishStatus.FAIL,
          message: '资源处理失败',
          noRetry: true,
        }
      }
      let mediaStatus = MetaMediaStatus.CREATED
      if (mediaStatusInfo.status === 'IN_PROGRESS') {
        mediaStatus = MetaMediaStatus.IN_PROGRESS;
      }
      if (mediaStatusInfo.status === 'FINISHED') {
        this.logger.log(`Media processing finished for task ID: ${task.id}, media ID: ${media.taskId}`);
        mediaStatus = MetaMediaStatus.FINISHED;
        processedCount++;
      }
      await this.metaContainerService.updateContainer(media.id, { status: mediaStatus });
    }
    const isMediaCompleted = processedCount === unProcessedContainers.length;
    if (!isMediaCompleted) {
      this.logger.warn(`Not all media files processed for task ID: ${task.id}. Processed: ${processedCount}, Total: ${containers.length}`);
      return {
        status: PublishStatus.PUB_LOADING,
        message: '媒体文件处理中',
      }
    }
    this.logger.log(`All media files processed for task ID: ${task.id}`);
    let containerTypes = ThreadsMediaType.VIDEO;
    let containerId = containers[0].taskId;

    if (containers.length > 1) {
      containerTypes = ThreadsMediaType.CAROUSEL;
      const containerIdList = containers.map(media => media.taskId);
      const createContainerReq: ThreadsContainerRequest = {
        media_type: containerTypes,
        children: containerIdList,
      }
      const postContainer = await this.threadsService.createItemContainer(
        task.accountId,
        createContainerReq,
      )
      if (!postContainer || !postContainer.id) {
        this.logger.error(`Failed to create media container for task ID: ${task.id}`);
        return {
          status: PublishStatus.FAIL,
          message: '创建媒体容器失败',
          noRetry: true,
        }
      }
      containerId = postContainer.id;
    }
    this.logger.log(`Container ID for task ID ${task.id}: ${containerId}`);
    const publishRes = await this.threadsService.publishPost(
      task.accountId,
      containerId,
    )
    if (!publishRes || !publishRes.id) {
      this.logger.error(`Failed to publish media container for task ID: ${task.id}`);
      return {
        status: PublishStatus.FAIL,
        message: '发布媒体容器失败',
        noRetry: true,
      }
    }
    this.logger.log(`Successfully published media container for task ID: ${task.id}`);
    let permalink = '';
    try {
      const objectInfo = await this.threadsService.getObjectInfo(task.accountId, publishRes.id, '', 'permalink');
      if (objectInfo && objectInfo.permalink) {
        permalink = objectInfo.permalink;
      }
    }
    catch (error) {
      this.logger.error(`Failed to get object info for published post: ${error.message}`, error.stack);
    }
    await this.overPublishTask(task, publishRes.id, { workLink: permalink });
    this.logger.log(`completed: Task ID ${task.id} processed successfully`);
    return {
      status: PublishStatus.RELEASED,
      message: '所有媒体文件已处理完成',
    }
  }
}
