import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/mongoose'
import { Queue } from 'bullmq'
import { Model } from 'mongoose'
import { chunkedDownloadFile, getFileTypeFromUrl, getRemoteFileSize } from '@/common'
import { PostInfoDto, VideoFileUploadSourceDto } from '@/core/plat/tiktok/dto/tiktok.dto'
import { TiktokService } from '@/core/plat/tiktok/tiktok.service'
import { PublishRecord } from '@/libs/database/schema/publishRecord.schema'
import { PublishStatus, PublishTask } from '@/libs/database/schema/publishTask.schema'
import { TiktokPrivacyLevel, TiktokSourceType } from '@/libs/tiktok/tiktok.enum'
import { DoPubRes } from '../common'
import { TiktokWebhookDto } from '../dto/tiktok.webhook.dto'
import { PublishBase } from './publish.base'

@Injectable()
export class TiktokPubService extends PublishBase {
  queueName: string = 'tiktok'
  private readonly logger = new Logger(TiktokPubService.name, {
    timestamp: true,
  });

  constructor(
    readonly eventEmitter: EventEmitter2,
    @InjectModel(PublishTask.name)
    readonly publishTaskModel: Model<PublishTask>,
     @InjectModel(PublishRecord.name)
    readonly publishRecordModel: Model<PublishRecord>,
    @InjectQueue('post_publish') publishQueue: Queue,
    readonly tiktokService: TiktokService,
  ) {
    super(eventEmitter, publishTaskModel, publishQueue)
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

    const { accountId, videoUrl } = publishTask

    if (videoUrl) {
      const fileName = getFileTypeFromUrl(videoUrl, true)
      const ext = fileName.split('.').pop()?.toLowerCase()
      const mimeType = ext === 'mp4' ? 'video/mp4' : `video/${ext}`

      const contentLength = await getRemoteFileSize(videoUrl)
      if (!contentLength) {
        res.message = '视频信息解析失败'
        return res
      }
      let chunkSize = 5 * 1024 * 1024 // 5MB
      if (contentLength < chunkSize) {
        chunkSize = contentLength
      }

      const postInfo: PostInfoDto = {
        title: publishTask.desc,
        privacy_level: TiktokPrivacyLevel.PUBLIC,
        brand_content_toggle: false,
        brand_organic_toggle: false,
      }

      const sourceInfo: VideoFileUploadSourceDto = {
        source: TiktokSourceType.FILE_UPLOAD,
        video_size: contentLength,
        chunk_size: chunkSize,
        total_chunk_count: Math.ceil(contentLength / chunkSize),
      }
      const initUploadRes = await this.tiktokService.initVideoPublish(
        accountId,
        postInfo,
        sourceInfo,
      )
      this.logger.log(`视频初始化上传结果: ${JSON.stringify(initUploadRes)}`)
      if (!initUploadRes || !initUploadRes.upload_url) {
        res.message = '视频初始化上传失败'
        return res
      }
      const totalParts = Math.ceil(contentLength / chunkSize)
      for (let partNumber = 0; partNumber < totalParts; partNumber++) {
        const start = partNumber * chunkSize
        const end = Math.min(start + chunkSize - 1, contentLength - 1)
        const range: [number, number] = [start, end]
        const videoBlob = await chunkedDownloadFile(videoUrl, range)
        if (!videoBlob) {
          res.message = '视频分片下载失败'
          return res
        }

        const uploadResult = await this.tiktokService.chunkedUploadVideoFile(
          initUploadRes.upload_url,
          videoBlob,
          partNumber,
          contentLength,
          mimeType,
        )
        this.logger.log(`视频分片上传完成: ${JSON.stringify(uploadResult)}`)
      }

      publishTask.status = PublishStatus.PUBLISHING
      await this.createPublishRecord({
        ...publishTask,
        dataId: initUploadRes.publish_id,
        publishTime: new Date(),
      })
      res.status = PublishStatus.PUBLISHING
      res.message = '发布任务已提交，等待处理'
      // 完成发布任务
      // await this.overPublishTask(publishTask, initUploadRes.publish_id)
      return res
    }
    return res
  }

  async getPublishRecord(uid: string, dataId: string) {
    return this.publishRecordModel.findOne({
      uid,
      dataId,
    })
  }

  async handleTiktokPostWebhook(dto: TiktokWebhookDto): Promise<void> {
    try {
      const content = JSON.parse(dto.content);
      if (!dto.event.startsWith('post.publish')) {
        this.logger.error(`未知 TikTok 事件类型: ${dto.event}`);
        return
      }
      const publishId = content?.publish_id;
      if (!publishId) {
        this.logger.error(`invalid publish_id in webhook: ${JSON.stringify(content)}`);
        return;
      }
      const publishRecord = await this.getPublishRecord(dto.user_openid, publishId);
      if (!publishRecord) {
        this.logger.error(`未找到发布记录: ${publishId}, 用户: ${dto.user_openid}`);
        return;
      }
      switch (dto.event) {
        case 'post.publish.failed':
          this.logger.error(`发布失败: ${JSON.stringify(content)}`);
          publishRecord.status = PublishStatus.FAILED;
          publishRecord.errorMsg = content.reason || '发布失败';
          await this.publishRecordModel.updateOne(
            { _id: publishRecord._id },
            { $set: publishRecord },
          );
          await this.publishTaskModel.updateOne({ _id: publishRecord._id }, {
            status: PublishStatus.FAILED,
            errorMsg: content.reason || '发布失败',
          });
          break;
        case 'post.publish.complete':
          this.logger.log(`发布成功: ${JSON.stringify(content)}`);
          publishRecord.status = PublishStatus.PUBLISHED;
          await this.publishRecordModel.updateOne(
            { _id: publishRecord._id },
            { $set: publishRecord },
          );
          this.publishTaskModel.deleteOne({ _id: publishRecord.id });
          break;
        case 'post.publish.inbox_delivered':
          this.logger.log(`发布已送达: ${JSON.stringify(content)}`);
          publishRecord.status = PublishStatus.PUBLISHED;
          await this.publishRecordModel.updateOne(
            { _id: publishRecord._id },
            { $set: publishRecord },
          );
          this.publishTaskModel.deleteOne({ _id: publishRecord.id });
          break;
        case 'post.publish.publicly_available':
          publishRecord.status = PublishStatus.PUBLISHED;
          publishRecord.dataId = content.post_id || publishRecord.dataId;
          await this.publishRecordModel.updateOne(
            { _id: publishRecord._id },
            { $set: publishRecord },
          );
          break;
        default:
          this.logger.error(`未知事件类型: ${dto.event}`);
          break;
      }
    }
    catch (error) {
      this.logger.error(`处理 TikTok webhook 失败: ${error.message}`, error.stack);
    }
  }
}
