import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'

import { Queue } from 'bullmq'
import { Model } from 'mongoose'
import { InstagramService } from '@/core/plat/meta/instagram.service'
import { MetaMediaStatus } from '@/libs/database/schema/metaContainer.schema'
import { PublishRecord } from '@/libs/database/schema/publishRecord.schema'
import { PublishStatus, PublishTask } from '@/libs/database/schema/publishTask.schema'
import { InstagramMediaType } from '@/libs/instagram/instagram.enum'
import { CreateMediaContainerRequest } from '@/libs/instagram/instagram.interfaces'
import { DoPubRes } from '../../common'
import { PublishBase } from '../publish.base'
import { MetaContainerService } from './container.service'
import { MetaPostPublisher, PublishMetaPostTask } from './meta.interface'

@Injectable()
export class InstagramPublishService extends PublishBase implements MetaPostPublisher {
  queueName: string = 'instagram'
  private readonly metaMediaTaskQueue: Queue
  private readonly logger = new Logger(InstagramPublishService.name, {
    timestamp: true,
  })

  constructor(
    @InjectModel(PublishTask.name)
    readonly publishTaskModel: Model<PublishTask>,
    @InjectModel(PublishRecord.name)
    readonly publishRecordModel: Model<PublishRecord>,
    @InjectQueue('bull_publish') publishQueue: Queue,
    @InjectQueue('meta_media_task') metaMediaTaskQueue: Queue,
    readonly instagramService: InstagramService,
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
    try {
      const { imgUrlList, accountId, videoUrl } = publishTask
      let containerType = InstagramMediaType.CAROUSEL
      // Instagram no longer supports standard video posts. Videos will be published as Reels
      if (!(imgUrlList && imgUrlList.length > 1) && videoUrl) {
        containerType = InstagramMediaType.REELS
      }
      if (imgUrlList && imgUrlList.length > 1) {
        for (const imgUrl of imgUrlList) {
          const createContainerReq: CreateMediaContainerRequest = {
            is_carousel_item: true,
            media_type: InstagramMediaType.IMAGE,
            image_url: imgUrl,
          }
          const initUploadRes = await this.instagramService.createMediaContainer(
            accountId,
            createContainerReq,
          )
          if (!initUploadRes || !initUploadRes.id) {
            res.message = '图片初始化上传失败'
            return res
          }
          await this.metaContainerService.createMetaPostMedia({
            publishId: publishTask.id,
            userId: publishTask.userId,
            platform: 'instagram',
            taskId: initUploadRes.id,
            status: MetaMediaStatus.CREATED,
          })
        }
      }

      if (videoUrl) {
        const downloadULR = videoUrl.replace('undefined', 'https://ai-to-earn.oss-cn-beijing.aliyuncs.com/')
        const createContainerReq: CreateMediaContainerRequest = {
          video_url: downloadULR,
          media_type: containerType,
        }
        if (containerType === 'CAROUSEL') {
          createContainerReq.is_carousel_item = true
        }
        const initUploadRes = await this.instagramService.createMediaContainer(
          accountId,
          createContainerReq,
        )
        if (!initUploadRes || !initUploadRes.id) {
          res.message = '视频初始化上传失败'
          return res
        }
        await this.metaContainerService.createMetaPostMedia({
          accountId: publishTask.accountId,
          publishId: publishTask.id,
          userId: publishTask.userId,
          platform: 'instagram',
          taskId: initUploadRes.id,
          status: MetaMediaStatus.CREATED,
        })
      }

      const task: PublishMetaPostTask = {
        id: publishTask.id,
      }
      await this.metaMediaTaskQueue.add(
        'instagram:media:task',
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
      this.logger.error(`发布失败: ${error.message || error}`, error.stack)
      res.message = `发布失败: ${error.message || error}`
      return res
    }
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
        const mediaStatusInfo = await this.instagramService.getObjectInfo(task.accountId, media.taskId, '');
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
      const isMediaCompleted = processedCount === unProcessedMedias.length;
      if (!isMediaCompleted) {
        this.logger.warn(`Not all media files processed for task ID: ${task.id}. Processed: ${processedCount}, Total: ${medias.length}`);
        return {
          status: PublishStatus.PUB_LOADING,
          message: '媒体文件处理中',
        }
      }
      this.logger.log(`All media files processed for task ID: ${task.id}`);
      let containerTypes = InstagramMediaType.REELS;
      let containerId = medias[0].taskId;

      if (medias.length > 1) {
        containerTypes = InstagramMediaType.CAROUSEL;
        const containerIdList = medias.map(media => media.taskId);
        const createContainerReq: CreateMediaContainerRequest = {
          media_type: containerTypes,
          children: containerIdList,
        }
        const postContainer = await this.instagramService.createMediaContainer(
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
      const publishRes = await this.instagramService.publishMediaContainer(
        task.accountId,
        containerId,
      )
      this.logger.log(`publish: Media container published for task ID: ${task.id}, response: ${JSON.stringify(publishRes)}`);
      if (!publishRes || !publishRes.id) {
        this.logger.log(`Failed to publish media container for task ID: ${task.id}`);
        return {
          status: PublishStatus.FAIL,
          message: '发布媒体容器失败',
          noRetry: true,
        }
      }
      let permalink = '';
      try {
        const objectInfo = await this.instagramService.getObjectInfo(
          task.accountId,
          publishRes.id,
          '',
          'permalink',
        );
        this.logger.log(`publish: Retrieved object info for task ID: ${task.id}, response: ${JSON.stringify(objectInfo)}`);
        if (objectInfo && objectInfo.permalink) {
          permalink = objectInfo.permalink;
        }
      }
      catch (error) {
        this.logger.error(`Failed to get permalink for task ID: ${task.id}, error: ${error.message || error}`);
      }
      this.logger.log(`Successfully published media container for task ID: ${task.id}`);
      await this.overPublishTask(task, publishRes.id, { workLink: permalink });
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
