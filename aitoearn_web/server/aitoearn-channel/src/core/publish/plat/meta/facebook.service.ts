import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Queue } from 'bullmq';
import { Model } from 'mongoose';
import {
  chunkedDownloadFile,
  fileUrlToBlob,
  getRemoteFileSize,
} from '@/common';
import { FacebookService } from '@/core/plat/meta/facebook.service';
import { MetaMediaStatus } from '@/libs/database/schema/metaContainer.schema';
import { PublishRecord } from '@/libs/database/schema/publishRecord.schema';
import { PublishStatus, PublishTask } from '@/libs/database/schema/publishTask.schema';
import {
  ChunkedVideoUploadRequest,
  FacebookInitialVideoUploadRequest,
  FacebookReelRequest,
  finalizeVideoUploadRequest,
  PublishVideoPostRequest,
} from '@/libs/facebook/facebook.interfaces';
import { DoPubRes } from '../../common';
import { PublishBase } from '../publish.base';
import { MetaContainerService } from './container.service';
import { MetaPostPublisher, PublishMetaPostTask } from './meta.interface';

@Injectable()
export class FacebookPublishService extends PublishBase implements MetaPostPublisher {
  queueName: string = 'facebook';

  private readonly metaMediaTaskQueue: Queue
  private readonly logger = new Logger(FacebookPublishService.name, {
    timestamp: true,
  });

  constructor(
    @InjectModel(PublishTask.name)
    readonly publishTaskModel: Model<PublishTask>,
    @InjectModel(PublishRecord.name)
    readonly publishRecordModel: Model<PublishRecord>,
    @InjectQueue('bull_publish') publishQueue: Queue,
    @InjectQueue('meta_media_task') metaMediaTaskQueue: Queue,
    readonly facebookService: FacebookService,
    private readonly metaContainerService: MetaContainerService,
  ) {
    super(publishTaskModel, publishRecordModel, publishQueue);
    this.metaMediaTaskQueue = metaMediaTaskQueue
    this.metaContainerService = metaContainerService
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
      await this.metaContainerService.createMetaPostMedia({
        accountId: publishTask.accountId,
        publishId: publishTask.id,
        userId: publishTask.userId,
        platform: 'instagram',
        taskId: initUploadRes.video_id,
        status: MetaMediaStatus.CREATED,
      })
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
      if (imgUrlList && imgUrlList.length > 0) {
        res.message = 'Facebook 不支持图片 Story 发布';
        return res;
      }
      if (!videoUrl) {
        res.message = 'Story 发布需要视频';
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
      const initUploadRes = await this.facebookService.initStoryUpload(
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
      const uploadRes = await this.facebookService.uploadStory(
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
      await this.metaContainerService.createMetaPostMedia({
        accountId: publishTask.accountId,
        publishId: publishTask.id,
        userId: publishTask.userId,
        platform: 'facebook',
        taskId: initUploadRes.video_id,
        status: MetaMediaStatus.CREATED,
      });
      const task: PublishMetaPostTask = {
        id: publishTask.id,
      };
      await this.metaMediaTaskQueue.add(
        'facebook:media:task',
        task,
        {
          attempts: 0,
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
      res.status = PublishStatus.PUB_LOADING;
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

  // async publishStory
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
            Buffer.from(await imgBlob.blob.arrayBuffer()),
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
    try {
      if (contentCategory === 'video') {
        return await this.publishVideo(publishTask);
      }
      if (contentCategory === 'reel') {
        return await this.publishReelPost(publishTask);
      }
      if (contentCategory === 'story') {
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
        const mediaStatusInfo = await this.facebookService.getObjectInfo(task.accountId, media.taskId, 'status');
        if (!mediaStatusInfo || !mediaStatusInfo.id) {
          this.logger.error(`Failed to get media status for task ID: ${task.id}, media ID: ${media.taskId}`);
          continue;
        }
        this.logger.log(`Media status for task ID ${task.id}, media ID ${media.taskId}: ${JSON.stringify(mediaStatusInfo)}`);
        if (mediaStatusInfo.status.video_status === 'error') {
          this.logger.error(`Media processing failed for task ID: ${task.id}, media ID: ${media.taskId}`);
          await this.metaContainerService.updateContainer(media.id, { status: MetaMediaStatus.FAILED });
          return {
            status: PublishStatus.FAIL,
            message: '资源处理失败',
            noRetry: true,
          }
        }
        let mediaStatus = MetaMediaStatus.CREATED
        if (mediaStatusInfo.status.video_status === 'processing' || mediaStatusInfo.status.video_status === 'encoded') {
          mediaStatus = MetaMediaStatus.IN_PROGRESS;
        }
        if (mediaStatusInfo.status.video_status === 'ready') {
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
        publishRes = await this.facebookService.publishStory(
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
          status: PublishStatus.FAIL,
          message: '发布媒体容器失败',
          noRetry: true,
        }
      }
      const permalink = `https://www.facebook.com/${task.uid}_${unProcessedMedias[0].taskId}`;

      this.logger.log(`Successfully published media container for task ID: ${task.id}`);
      await this.overPublishTask(task, unProcessedMedias[0].taskId, { workLink: permalink });
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
