import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Queue } from 'bullmq';
import { Model } from 'mongoose';
import {
  chunkedDownloadFile,
  fileUrlToBlob,
  getRemoteFileSize,
} from '@/common';
import { FacebookService } from '@/core/plat/meta/facebook.service';
import { PostCategory, PostMediaStatus, PostSubCategory } from '@/libs/database/schema/postMediaContainer.schema';
import { PublishStatus, PublishTask } from '@/libs/database/schema/publishTask.schema';
import {
  ChunkedVideoUploadRequest,
  FacebookInitialVideoUploadRequest,
  FacebookReelRequest,
  finalizeVideoUploadRequest,
  PublishFeedPostRequest,
  PublishVideoPostRequest,
} from '@/libs/facebook/facebook.interfaces';
import { DoPubRes } from '../../common';
import { PublishBase } from '../publish.base';
import { PostMediaContainerService } from './container.service';
import { MetaPostPublisher, PublishMetaPostTask } from './meta.interface';

@Injectable()
export class FacebookPublishService extends PublishBase implements MetaPostPublisher {
  queueName: string = 'facebook';

  private readonly metaMediaTaskQueue: Queue
  private readonly logger = new Logger(FacebookPublishService.name, {
    timestamp: true,
  });

  constructor(
    readonly eventEmitter: EventEmitter2,
    @InjectModel(PublishTask.name)
    readonly publishTaskModel: Model<PublishTask>,
    @InjectQueue('post_publish') publishQueue: Queue,
    @InjectQueue('post_media_task') metaMediaTaskQueue: Queue,
    readonly facebookService: FacebookService,
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
    Logger.log(`checkAuth: ${accountId}`);
    return {
      status: 1,
      timeout: 10000,
    };
  }

  async uploadImage(accountId: string, imgUrl: string): Promise<string> {
    const imgBlob = await fileUrlToBlob(imgUrl);
    if (!imgBlob) {
      throw new Error(`上传图片失败： 下载图片失败 ${imgUrl}`);
    }
    try {
      const uploadReq = await this.facebookService.uploadImage(
        accountId,
        imgBlob.blob,
      );
      this.logger.log(`上传图片成功： ${JSON.stringify(uploadReq)}`);
      if (!uploadReq || !uploadReq.id) {
        throw new Error(`上传图片失败： 图片上传到facebook失败 ${imgUrl}`);
      }
      return uploadReq.id
    }
    catch (error) {
      Logger.error(`上传图片失败： ${error.message}`, error.stack);
      throw new Error(`上传图片失败： ${error.message}`);
    }
  }

  async publishFeedPost(publishTask: PublishTask): Promise<DoPubRes> {
    this.logger.log(`Received publish task: ${publishTask.id} for Facebook Feed Post`);
    this.logger.debug(`Publish task details: ${JSON.stringify(publishTask)}`);
    try {
      const res: DoPubRes = {
        status: -1,
        message: '任务不存在',
      };

      if (!publishTask.desc) {
        res.message = 'Feed Post 发布需要描述';
        return res;
      }
      const feedPostReq: PublishFeedPostRequest = {
        message: publishTask.desc,
        published: true,
      };
      const postRes = await this.facebookService.publishFeedPost(
        publishTask.accountId,
        feedPostReq,
      );
      if (!postRes || !postRes.id) {
        res.message = 'Feed Post 发布失败';
        return res;
      }

      const permalink = `https://www.facebook.com/${publishTask.uid}_${postRes.id}`;
      await this.overPublishTask(publishTask, postRes.id, {
        workLink: permalink,
      });
      res.status = 1;
      res.message = '视频发布成功';
      return res;
    }
    catch (error) {
      this.logger.error(`发布任务失败: ${error.message}`, error.stack);
      return {
        status: -1,
        message: `发布任务失败: ${error.message}`,
      };
    }
  }

  async publishReelPost(publishTask: PublishTask): Promise<DoPubRes> {
    this.logger.log(`Received publish task: ${publishTask.id} for Facebook Reel`);
    this.logger.debug(`Publish task details: ${JSON.stringify(publishTask)}`);
    try {
      const res: DoPubRes = {
        status: -1,
        message: '任务不存在',
      };

      const { imgUrlList, accountId, videoUrl } = publishTask;
      if (imgUrlList && imgUrlList.length > 0) {
        res.message = 'Facebook 不支持图片 Reel 发布';
        return res;
      }
      if (!videoUrl) {
        res.message = 'Reel 发布需要视频';
        return res;
      }

      const contentLength = await getRemoteFileSize(videoUrl);
      if (!contentLength) {
        res.message = '视频信息解析失败';
        return res;
      }

      const initUploadReq: FacebookReelRequest = {
        upload_phase: 'start',
      };
      const initUploadRes = await this.facebookService.initReelUpload(
        accountId,
        initUploadReq,
      );
      if (!initUploadRes || !initUploadRes.upload_url) {
        res.message = '视频初始化上传失败';
        return res;
      }

      const videoFile = await chunkedDownloadFile(videoUrl, [0, contentLength - 1]);
      if (!chunkedDownloadFile) {
        res.message = '视频下载失败';
        return res;
      }
      const uploadRes = await this.facebookService.uploadReel(
        accountId,
        initUploadRes.upload_url,
        {
          offset: 0,
          file_size: contentLength,
          file: videoFile,
        },
      );
      if (!uploadRes || !uploadRes.success) {
        res.message = '视频上传失败';
        return res;
      }
      await this.postMediaContainerService.createMetaPostMedia({
        accountId: publishTask.accountId,
        publishId: publishTask.id,
        userId: publishTask.userId,
        platform: 'facebook',
        taskId: initUploadRes.video_id,
        status: PostMediaStatus.CREATED,
        category: PostCategory.STORY,
        subCategory: PostSubCategory.VIDEO,
      })
      const task: PublishMetaPostTask = {
        id: publishTask.id,
      }
      await this.metaMediaTaskQueue.add(
        `facebook:reel:media:task:${task.id}`,
        {
          taskId: task.id,
          attempts: 0,
        },
        {
          attempts: 3,
          backoff: {
            type: 'fixed',
            delay: 20000, // 每次重试间隔 5 秒
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
      this.logger.error(`发布任务失败: ${error.message}`, error.stack);
      return {
        status: -1,
        message: `发布任务失败: ${error.message}`,
      };
    }
  }

  async publishPhotoStory(publishTask: PublishTask): Promise<DoPubRes> {
    this.logger.log(`Received publish task: ${publishTask.id} for Facebook Story`);
    this.logger.debug(`Publish task details: ${JSON.stringify(publishTask)}`);
    try {
      const res: DoPubRes = {
        status: -1,
        message: '任务不存在',
      };
      const { imgUrlList, accountId } = publishTask;
      if (!imgUrlList) {
        res.message = 'Story 发布需要图片';
        return res;
      }

      if (imgUrlList && imgUrlList.length < 1) {
        res.message = 'Facebook Story 发布需要图片';
        return res;
      }

      const imgUrl = imgUrlList[0];
      const containerId = await this.uploadImage(accountId, imgUrl);
      if (!containerId) {
        res.message = '图片上传失败';
        return res;
      }

      const storyRes = await this.facebookService.publishPhotoStory(
        accountId,
        containerId,
      );
      this.logger.log(`Publish Story response: ${JSON.stringify(storyRes)}`);
      if (!storyRes || !storyRes.post_id) {
        res.message = '图片 Story 发布失败';
        return res;
      }
      const permalink = `https://www.facebook.com/stories/${containerId}`;
      await this.overPublishTask(publishTask, containerId, {
        workLink: permalink,
      });
      await this.overPublishTask(publishTask, containerId);
      res.status = 1;
      res.message = '图片 Story 发布成功';
      return res;
    }
    catch (error) {
      this.logger.error(`发布任务失败: ${error.message}`, error.stack);
      return {
        status: -1,
        message: `发布任务失败: ${error.message}`,
      };
    }
  }

  async publishStory(publishTask: PublishTask): Promise<DoPubRes> {
    this.logger.log(`Received publish task: ${publishTask.id} for Facebook Story`);
    this.logger.debug(`Publish task details: ${JSON.stringify(publishTask)}`);
    try {
      const res: DoPubRes = {
        status: -1,
        message: '任务不存在',
      };
      const { imgUrlList, accountId, videoUrl } = publishTask;
      if (!videoUrl && !imgUrlList) {
        res.message = 'Story 发布需要视频或图片';
        return res;
      }

      if (imgUrlList && imgUrlList.length > 0) {
        return await this.publishPhotoStory(publishTask);
      }

      if (!videoUrl) {
        res.message = 'Story 发布需要视频 URL';
        return res;
      }
      const contentLength = await getRemoteFileSize(videoUrl);
      if (!contentLength) {
        res.message = '视频信息解析失败';
        return res;
      }
      const initUploadReq: FacebookReelRequest = {
        upload_phase: 'start',
      };
      const initUploadRes = await this.facebookService.initVideoStoryUpload(
        accountId,
        initUploadReq,
      );
      if (!initUploadRes || !initUploadRes.upload_url) {
        res.message = '视频初始化上传失败';
        return res;
      }
      const videoFile = await chunkedDownloadFile(videoUrl, [0, contentLength - 1]);
      if (!videoFile) {
        res.message = '视频下载失败';
        return res;
      }
      const uploadRes = await this.facebookService.uploadVideoStory(
        accountId,
        initUploadRes.upload_url,
        {
          offset: 0,
          file_size: contentLength,
          file: videoFile,
        },
      );
      if (!uploadRes || !uploadRes.success) {
        res.message = '视频上传失败';
        return res;
      }
      await this.postMediaContainerService.createMetaPostMedia({
        accountId: publishTask.accountId,
        publishId: publishTask.id,
        userId: publishTask.userId,
        platform: 'facebook',
        taskId: initUploadRes.video_id,
        status: PostMediaStatus.CREATED,
        category: PostCategory.STORY,
        subCategory: PostSubCategory.VIDEO,
      });
      const task: PublishMetaPostTask = {
        id: publishTask.id,
      };
      await this.metaMediaTaskQueue.add(
        `facebook:story:media:task:${task.id}`,
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
      );
      res.status = PublishStatus.PUBLISHING;
      res.message = '发布中';
      return res;
    }
    catch (error) {
      this.logger.error(`发布任务失败: ${error.message}`, error.stack);
      return {
        status: -1,
        message: `发布任务失败: ${error.message}`,
      };
    }
  }

  async publishVideo(publishTask: PublishTask): Promise<DoPubRes> {
    this.logger.log(`Received publish task: ${publishTask.id} for Facebook`);
    this.logger.debug(`Publish task details: ${JSON.stringify(publishTask)}`);
    try {
      const res: DoPubRes = {
        status: -1,
        message: '任务不存在',
      };
      const { imgUrlList, accountId, videoUrl } = publishTask;
      const facebookMediaIdList: string[] = [];
      if (imgUrlList && imgUrlList.length > 0) {
        for (const imgUrl of imgUrlList) {
          const imgBlob = await fileUrlToBlob(imgUrl);
          if (!imgBlob) {
            res.message = '图片下载失败';
            return res;
          }
          const uploadReq = await this.facebookService.uploadImage(
            accountId,
            imgBlob.blob,
          );
          if (!uploadReq || !uploadReq.id) {
            res.message = '图片初始化上传失败';
            return res;
          }
          facebookMediaIdList.push(uploadReq.id);
        }
        if (facebookMediaIdList.length === 0) {
          res.message = '没有图片可上传';
          return res;
        }
        const publishMediaPost = await this.facebookService.publicPhotoPost(
          accountId,
          facebookMediaIdList,
          publishTask.desc,
        );
        if (!publishMediaPost || !publishMediaPost.id) {
          res.message = '图片发布失败';
          return res;
        }
        res.status = 1;
        res.message = '发布成功';
        await this.overPublishTask(publishTask, publishMediaPost.id);
        return res;
      }

      if (videoUrl) {
        const contentLength = await getRemoteFileSize(videoUrl);
        if (!contentLength) {
          res.message = '视频信息解析失败';
          return res;
        }

        const initUploadReq: FacebookInitialVideoUploadRequest = {
          upload_phase: 'start',
          file_size: contentLength,
          published: false,
        };
        const initUploadRes = await this.facebookService.initVideoUpload(
          accountId,
          initUploadReq,
        );
        this.logger.log(`Video upload initialization response: ${JSON.stringify(initUploadRes)}`);
        if (!initUploadRes || !initUploadRes.upload_session_id) {
          res.message = '视频初始化上传失败';
          return res;
        }

        let startOffset = initUploadRes.start_offset;
        let endOffset = initUploadRes.end_offset;

        while (startOffset < contentLength - 1) {
          const range: [number, number] = [startOffset, endOffset - 1];
          const videoBlob = await chunkedDownloadFile(videoUrl, range);
          if (!videoBlob) {
            res.message = '视频分片下载失败';
            return res;
          }
          const chunkedUploadReq: ChunkedVideoUploadRequest = {
            upload_phase: 'transfer',
            upload_session_id: initUploadRes.upload_session_id,
            start_offset: startOffset,
            end_offset: endOffset,
            video_file_chunk: videoBlob,
            published: false,
          };
          this.logger.log(`Chunked upload request: start_offset=${startOffset}, end_offset=${endOffset}`);
          const chunkedUploadRes
            = await this.facebookService.chunkedMediaUpload(
              accountId,
              chunkedUploadReq,
            );
          if (
            !chunkedUploadRes
            || !chunkedUploadRes.start_offset
            || !chunkedUploadRes.end_offset
          ) {
            res.message = '视频分片上传失败';
            return res;
          }
          startOffset = chunkedUploadRes.start_offset;
          endOffset = chunkedUploadRes.end_offset;
        }
        const finalizeReq: finalizeVideoUploadRequest = {
          upload_phase: 'finish',
          upload_session_id: initUploadRes.upload_session_id,
          published: false,
        };
        const finalizeRes = await this.facebookService.finalizeMediaUpload(
          accountId,
          finalizeReq,
        );
        if (!finalizeRes || !finalizeRes.success) {
          res.message = '视频上传完成失败';
          return res;
        }
        const videoPostReq: PublishVideoPostRequest = {
          description: publishTask.desc,
          crossposted_video_id: initUploadRes.video_id,
          published: true,
        };
        const postRes = await this.facebookService.publishVideoPost(
          accountId,
          videoPostReq,
        );
        if (!postRes || !postRes.id) {
          res.message = '确认视频上传完成失败';
          return res;
        }

        const permalink = `https://www.facebook.com/${publishTask.uid}_${postRes.id}`;
        await this.overPublishTask(publishTask, postRes.id, {
          workLink: permalink,
        });
        res.status = 1;
        res.message = '视频发布成功';
        return res;
      }
      return res;
    }
    catch (error) {
      this.logger.error(`发布任务失败: ${error.message}`, error.stack);
      return {
        status: -1,
        message: `发布任务失败: ${error.message}`,
      };
    }
  }

  async doPub(publishTask: PublishTask): Promise<DoPubRes> {
    const res: DoPubRes = {
      status: -1,
      message: '任务不存在',
    };
    const contentCategory = publishTask.option?.facebook?.content_category;
    if (!contentCategory) {
      this.logger.error('未指定 Facebook 页面 contentCategory');
      res.message = '未指定 Facebook 页面 contentCategory';
      return res;
    }
    // publish feed post when no media
    const { imgUrlList, videoUrl } = publishTask;
    if (!imgUrlList && !videoUrl) {
      return await this.publishFeedPost(publishTask);
    }
    try {
      if (contentCategory === 'post') {
        if (!videoUrl && !imgUrlList) {
          res.message = 'Post 发布需要视频或图片';
          return res;
        }
        return await this.publishVideo(publishTask);
      }
      if (contentCategory === 'reel') {
        if (!videoUrl) {
          res.message = 'Reel 发布需要视频 URL';
          return res;
        }
        return await this.publishReelPost(publishTask);
      }
      if (contentCategory === 'story') {
        if (!videoUrl && !imgUrlList) {
          res.message = 'Story 发布需要视频或图片';
          return res;
        }
        return await this.publishStory(publishTask);
      }
      res.message = '不支持的平台';
      return res;
    }
    catch (error) {
      this.logger.error(`发布任务失败: ${error.message}`, error.stack);
      res.message = `发布任务失败: ${error.message}`;
      return res;
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
          noRetry: true,
        }
      }
      const unProcessedMedias = medias.filter(media => media.status !== PostMediaStatus.FINISHED);
      this.logger.log(`Found ${medias.length} media files for task ID: ${task.id}`);
      let processedCount = 0;
      for (const media of unProcessedMedias) {
        const mediaStatusInfo = await this.facebookService.getObjectInfo(task.accountId, media.taskId, 'status');
        if (!mediaStatusInfo || !mediaStatusInfo.id) {
          this.logger.error(`Failed to get media status for task ID: ${task.id}, media ID: ${media.taskId}`);
          continue;
        }
        this.logger.log(`Media status for task ID ${task.id}, media ID ${media.taskId}: ${JSON.stringify(mediaStatusInfo)}`);
        if (mediaStatusInfo.status.video_status === 'error') {
          this.logger.error(`Media processing failed for task ID: ${task.id}, media ID: ${media.taskId}`);
          await this.postMediaContainerService.updateContainer(media.id, { status: PostMediaStatus.FAILED });
          return {
            status: PublishStatus.FAILED,
            message: '资源处理失败',
            noRetry: true,
          }
        }
        let mediaStatus = PostMediaStatus.CREATED
        if (mediaStatusInfo.status.video_status === 'processing' || mediaStatusInfo.status.video_status === 'encoded') {
          mediaStatus = PostMediaStatus.IN_PROGRESS;
        }
        if (mediaStatusInfo.status.video_status === 'upload_complete') {
          this.logger.log(`Media processing finished for task ID: ${task.id}, media ID: ${media.taskId}`);
          mediaStatus = PostMediaStatus.FINISHED;
          processedCount++;
        }
        await this.postMediaContainerService.updateContainer(media.id, { status: mediaStatus });
      }
      const isMediaCompleted = processedCount === unProcessedMedias.length;
      if (!isMediaCompleted) {
        this.logger.warn(`Not all media files processed for task ID: ${task.id}. Processed: ${processedCount}, Total: ${medias.length}`);
        // return {
        //   status: PublishStatus.PUB_LOADING,
        //   message: '媒体文件处理中',
        // }
        throw new Error(`媒体文件处理中，已处理 ${processedCount} 个，未处理 ${unProcessedMedias.length - processedCount} 个`);
      }
      this.logger.log(`All media files processed for task ID: ${task.id}`);
      let publishRes;
      if (task.option?.facebook?.content_category === 'reel') {
        publishRes = await this.facebookService.publishReel(
          task.accountId,
          {
            upload_phase: 'finish',
            video_state: 'published',
            video_id: unProcessedMedias[0].taskId,
            description: task.desc,
          },
        )
      }
      if (task.option?.facebook?.content_category === 'story') {
        publishRes = await this.facebookService.publishVideoStory(
          task.accountId,
          {
            upload_phase: 'finish',
            video_state: 'published',
            video_id: unProcessedMedias[0].taskId,
            description: task.desc,
          },
        )
      }
      this.logger.log(`publish: Media container published for task ID: ${task.id}, response: ${JSON.stringify(publishRes)}`);
      if (!publishRes || !publishRes.success) {
        this.logger.log(`Failed to publish media container for task ID: ${task.id}`);
        return {
          status: PublishStatus.FAILED,
          message: '发布媒体容器失败',
          noRetry: true,
        }
      }
      let category = 'stories'
      if (task.option?.facebook?.content_category === 'reel') {
        category = 'reel'
      }
      const permalink = `https://www.facebook.com/${category}/${unProcessedMedias[0].taskId}`;

      this.logger.log(`Successfully published media container for task ID: ${task.id}`);
      await this.overPublishTask(task, unProcessedMedias[0].taskId, { workLink: permalink });
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

  async pushPubTask(newData: PublishTask, attempts = 0): Promise<boolean> {
    await this.publishQueueOpen(newData.id)
    const jobRes = await this.publishQueue.add(
      `publish_${this.queueName}`,
      {
        taskId: newData.id,
        attempts: attempts++, // 进行次数
        jobId: newData.queueId,
      },
      {
        attempts: this.queueAttempts,
        backoff: {
          type: 'exponential',
          delay: 20000, // 每次重试间隔 5 秒
        },
        removeOnComplete: true,
        jobId: newData.queueId, // 确保任务id唯一，防止重复执行
      },
    )
    return jobRes.id === newData.queueId
  }
}
