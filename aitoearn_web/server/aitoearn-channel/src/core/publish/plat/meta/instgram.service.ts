import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'

import { InjectModel } from '@nestjs/mongoose'
import { Queue } from 'bullmq'
import { Model } from 'mongoose'
import { InstagramService } from '@/core/plat/meta/instagram.service'
import { PostCategory, PostMediaStatus, PostSubCategory } from '@/libs/database/schema/postMediaContainer.schema'
import { PublishStatus, PublishTask } from '@/libs/database/schema/publishTask.schema'
import { InstagramMediaType } from '@/libs/instagram/instagram.enum'
import { CreateMediaContainerRequest } from '@/libs/instagram/instagram.interfaces'
import { DoPubRes } from '../../common'
import { PublishBase } from '../publish.base'
import { PostMediaContainerService } from './container.service'
import { MetaPostPublisher, PublishMetaPostTask } from './meta.interface'

@Injectable()
export class InstagramPublishService extends PublishBase implements MetaPostPublisher {
  queueName: string = 'instagram'
  private readonly metaMediaTaskQueue: Queue
  private readonly logger = new Logger(InstagramPublishService.name, {
    timestamp: true,
  })

  constructor(
    readonly eventEmitter: EventEmitter2,
    @InjectModel(PublishTask.name)
    readonly publishTaskModel: Model<PublishTask>,
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
    status: 0 | 1;
    timeout?: number; // 秒
  }> {
    Logger.log(`checkAuth: ${accountId}`)
    return {
      status: 1,
      timeout: 10000,
    }
  }

  async publishPost(publishTask: PublishTask): Promise<DoPubRes> {
    const res: DoPubRes = {
      status: -1,
      message: '任务不存在',
    }
    if (!publishTask.imgUrlList || publishTask.imgUrlList.length === 0) {
      res.message = '没有图片资源'
      return res
    }
    try {
      if (publishTask.imgUrlList.length === 1) {
        const createContainerReq: CreateMediaContainerRequest = {
          media_type: InstagramMediaType.IMAGE,
          image_url: publishTask.imgUrlList[0],
          caption: publishTask.desc || publishTask.title || '',
        }
        const initUploadRes = await this.instagramService.createMediaContainer(
          publishTask.accountId,
          createContainerReq,
        )
        if (!initUploadRes || !initUploadRes.id) {
          res.message = '图片初始化上传失败'
          return res
        }
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
      else {
        for (const imgUrl of publishTask.imgUrlList) {
          const createContainerReq: CreateMediaContainerRequest = {
            is_carousel_item: true,
            media_type: InstagramMediaType.IMAGE,
            image_url: imgUrl,
            caption: publishTask.desc || publishTask.title || '',
          }
          const initUploadRes = await this.instagramService.createMediaContainer(
            publishTask.accountId,
            createContainerReq,
          )
          if (!initUploadRes || !initUploadRes.id) {
            res.message = '图片初始化上传失败'
            return res
          }
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

      res.status = PublishStatus.PUBLISHING
      res.message = '发布中'
      return res;
    }
    catch (error) {
      this.logger.error(`发布失败: ${error.message || error}`, error.stack)
      res.message = `发布失败: ${error.message || error}`
      return res
    }
  }

  async publishReel(publishTask: PublishTask): Promise<DoPubRes> {
    const res: DoPubRes = {
      status: -1,
      message: '任务不存在',
    }
    if (!publishTask.videoUrl) {
      res.message = '没有视频资源'
      return res
    }
    try {
      const createContainerReq: CreateMediaContainerRequest = {
        video_url: publishTask.videoUrl,
        media_type: InstagramMediaType.REELS,
        caption: publishTask.desc || publishTask.title || '',
      }
      const initUploadRes = await this.instagramService.createMediaContainer(
        publishTask.accountId,
        createContainerReq,
      )
      if (!initUploadRes || !initUploadRes.id) {
        res.message = '视频初始化上传失败'
        return res
      }
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

      res.status = PublishStatus.PUBLISHING
      res.message = '发布中'
      return res;
    }
    catch (error) {
      this.logger.error(`发布失败: ${error.message || error}`, error.stack)
      res.message = `发布失败: ${error.message || error}`
      return res
    }
  }

  async publishVideoStory(publishTask: PublishTask): Promise<DoPubRes> {
    const res: DoPubRes = {
      status: -1,
      message: '任务不存在',
    }
    if (!publishTask.videoUrl) {
      res.message = '没有视频资源'
      return res
    }
    try {
      const createContainerReq: CreateMediaContainerRequest = {
        video_url: publishTask.videoUrl,
        media_type: InstagramMediaType.STORIES,
        caption: publishTask.desc || publishTask.title || '',
      }
      const initUploadRes = await this.instagramService.createMediaContainer(
        publishTask.accountId,
        createContainerReq,
      )
      if (!initUploadRes || !initUploadRes.id) {
        res.message = '视频初始化上传失败'
        return res
      }
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

      res.status = PublishStatus.PUBLISHING
      res.message = '发布中'
      return res;
    }
    catch (error) {
      this.logger.error(`发布失败: ${error.message || error}`, error.stack)
      res.message = `发布失败: ${error.message || error}`
      return res
    }
  }

  async publishPhotoStory(publishTask: PublishTask): Promise<DoPubRes> {
    const res: DoPubRes = {
      status: -1,
      message: '任务不存在',
    }
    if (!publishTask.imgUrlList || publishTask.imgUrlList.length === 0) {
      res.message = '没有图片资源'
      return res
    }
    try {
      const createContainerReq: CreateMediaContainerRequest = {
        media_type: InstagramMediaType.STORIES,
        image_url: publishTask.imgUrlList[0],
      }
      const initUploadRes = await this.instagramService.createMediaContainer(
        publishTask.accountId,
        createContainerReq,
      )
      if (!initUploadRes || !initUploadRes.id) {
        res.message = '图片初始化上传失败'
        return res
      }
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

      res.status = PublishStatus.PUBLISHING
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
      const medias = await this.postMediaContainerService.getContainers(task.id);
      if (!medias || medias.length === 0) {
        return {
          status: PublishStatus.FAILED,
          message: '没有找到媒体文件',
        }
      }
      const unProcessedMedias = medias.filter(media => media.status !== PostMediaStatus.FINISHED);
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
          await this.postMediaContainerService.updateContainer(media.id, { status: PostMediaStatus.FAILED });
          return {
            status: PublishStatus.FAILED,
            message: '资源处理失败',
            noRetry: true,
          }
        }
        let mediaStatus = PostMediaStatus.CREATED
        if (mediaStatusInfo.status === 'IN_PROGRESS') {
          mediaStatus = PostMediaStatus.IN_PROGRESS;
        }
        if (mediaStatusInfo.status === 'FINISHED') {
          this.logger.log(`Media processing finished for task ID: ${task.id}, media ID: ${media.taskId}`);
          mediaStatus = PostMediaStatus.FINISHED;
          processedCount++;
        }
        await this.postMediaContainerService.updateContainer(media.id, { status: mediaStatus });
      }
      const isMediaCompleted = processedCount === unProcessedMedias.length;
      if (!isMediaCompleted) {
        this.logger.warn(`Not all media files processed for task ID: ${task.id}. Processed: ${processedCount}, Total: ${medias.length}`);
        return {
          status: PublishStatus.PUBLISHING,
          message: '媒体文件处理中',
        }
      }
      this.logger.log(`All media files processed for task ID: ${task.id}`);

      const postCategory = unProcessedMedias[0].category;

      let containerTypes = InstagramMediaType.IMAGE;
      if (postCategory === PostCategory.STORY) {
        containerTypes = InstagramMediaType.STORIES;
      }
      else if (postCategory === PostCategory.REELS) {
        containerTypes = InstagramMediaType.REELS;
      }

      let containerId = medias[0].taskId;

      if (postCategory === PostCategory.POST && medias.length > 1) {
        containerTypes = InstagramMediaType.CAROUSEL;
        const containerIdList = medias.map(media => media.taskId);
        const createContainerReq: CreateMediaContainerRequest = {
          media_type: containerTypes,
          children: containerIdList,
          caption: task.desc || task.title || '',
        }
        const postContainer = await this.instagramService.createMediaContainer(
          task.accountId,
          createContainerReq,
        )
        if (!postContainer || !postContainer.id) {
          this.logger.error(`Failed to create media container for task ID: ${task.id}`);
          return {
            status: PublishStatus.FAILED,
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
          status: PublishStatus.FAILED,
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
        status: PublishStatus.PUBLISHED,
        message: '所有媒体文件已处理完成',
      }
    }
    catch (error) {
      this.logger.error(`Error processing task ID ${task.id}: ${error.message || error}`);
      return {
        status: PublishStatus.FAILED,
        message: `发布失败: ${error.message || error}`,
        noRetry: true,
      }
    }
  }

  async doPub(publishTask: PublishTask): Promise<DoPubRes> {
    const res: DoPubRes = {
      status: -1,
      message: '任务不存在',
    }
    try {
      const postCategory = publishTask.option?.instagram?.content_category;
      switch (postCategory) {
        case 'post':
          return await this.publishPost(publishTask);
        case 'reel':
          return await this.publishReel(publishTask);
        case 'story':
          if (publishTask.videoUrl) {
            return await this.publishVideoStory(publishTask);
          }
          else {
            return await this.publishPhotoStory(publishTask);
          }
        default:
          res.message = '不支持的发布类型';
          return res;
      }
    }
    catch (error) {
      this.logger.error(`发布失败: ${error.message || error}`, error.stack)
      res.message = `发布失败: ${error.message || error}`
      return res
    }
  }
}
