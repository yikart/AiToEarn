import { InjectQueue } from '@nestjs/bullmq'

import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Queue } from 'bullmq'
import { Model } from 'mongoose'

import { FileToolsService } from '@/core/file/fileTools.service'
import { FacebookService } from '@/core/plat/meta/facebook.service'
import { PublishRecord } from '@/libs/database/schema/publishRecord.schema'
import { PublishTask } from '@/libs/database/schema/publishTask.schema'
import {
  ChunkedFileUploadRequest,
  FacebookInitialUploadRequest,
  finalizeUploadRequest,
  PublishUploadedVideoPostRequest,
} from '@/libs/facebook/facebook.interfaces'
import { DoPubRes } from '../../common'
import { PublishBase } from '../publish.base'

@Injectable()
export class FacebookPublishService extends PublishBase {
  queueName: string = 'facebook'

  private readonly logger = new Logger(FacebookPublishService.name, {
    timestamp: true,
  })

  constructor(
    @InjectModel(PublishTask.name)
    readonly publishTaskModel: Model<PublishTask>,
    @InjectModel(PublishRecord.name)
    readonly publishRecordModel: Model<PublishRecord>,
    @InjectQueue('bull_publish') publishQueue: Queue,
    readonly facebookService: FacebookService,
    private readonly fileToolsService: FileToolsService,
  ) {
    super(publishTaskModel, publishRecordModel, publishQueue)
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
    this.logger.log(`Received publish task: ${publishTask.id} for Facebook`)
    this.logger.debug(`Publish task details: ${JSON.stringify(publishTask)}`)
    try {
      const res: DoPubRes = {
        status: -1,
        message: '任务不存在',
      }

      const pageId = publishTask.option?.facebook?.page_id
      if (!pageId) {
        this.logger.error('未指定 Facebook 页面 ID')
        res.message = '未指定 Facebook 页面 ID'
        return res
      }
      const { imgUrlList, accountId, videoUrl } = publishTask
      const facebookMediaIdList: string[] = []
      if (imgUrlList && imgUrlList.length > 0) {
        for (const imgUrl of imgUrlList) {
          const imgBlob = await this.fileToolsService.fileUrlToBlob(imgUrl)
          if (!imgBlob) {
            res.message = '图片下载失败'
            return res
          }
          const uploadReq = await this.facebookService.uploadImage(
            pageId,
            accountId,
            Buffer.from(await imgBlob.blob.arrayBuffer()),
          )
          if (!uploadReq || !uploadReq.id) {
            res.message = '图片初始化上传失败'
            return res
          }
          facebookMediaIdList.push(uploadReq.id)
        }
        if (facebookMediaIdList.length === 0) {
          res.message = '没有图片可上传'
          return res
        }
        const publishMediaPost = await this.facebookService.publicPhotoPost(
          pageId,
          accountId,
          facebookMediaIdList,
        )
        if (!publishMediaPost || !publishMediaPost.id) {
          res.message = '图片发布失败'
          return res
        }
        res.status = 1
        res.message = '发布成功'
        await this.overPublishTask(publishTask, publishMediaPost.id)
        return res
      }

      if (videoUrl) {
        const contentLength = await this.fileToolsService.getFileSizeFromUrl(videoUrl)
        if (!contentLength) {
          res.message = '视频信息解析失败'
          return res
        }

        const initUploadReq: FacebookInitialUploadRequest = {
          upload_phase: 'start',
          file_size: contentLength,
          published: false,
        }
        const initUploadRes = await this.facebookService.initVideoUpload(
          accountId,
          pageId,
          initUploadReq,
        )
        if (!initUploadRes || !initUploadRes.upload_session_id) {
          res.message = '视频初始化上传失败'
          return res
        }

        let startOffset = initUploadRes.start_offset
        let endOffset = initUploadRes.end_offset

        while (startOffset < contentLength - 1) {
          const range: [number, number] = [startOffset, endOffset - 1]
          const videoBlob = await this.fileToolsService.chunkedDownloadFile(videoUrl, range)
          if (!videoBlob) {
            res.message = '视频分片下载失败'
            return res
          }
          const chunkedUploadReq: ChunkedFileUploadRequest = {
            upload_phase: 'transfer',
            upload_session_id: initUploadRes.upload_session_id,
            start_offset: startOffset,
            end_offset: endOffset,
            video_file_chunk: videoBlob,
            published: false,
          }
          const chunkedUploadRes = await this.facebookService.chunkedMediaUpload(
            accountId,
            pageId,
            chunkedUploadReq,
          )
          if (!chunkedUploadRes || !chunkedUploadRes.start_offset || !chunkedUploadRes.end_offset) {
            res.message = '视频分片上传失败'
            return res
          }
          startOffset = chunkedUploadRes.start_offset
          endOffset = chunkedUploadRes.end_offset
        }
        const finalizeReq: finalizeUploadRequest = {
          upload_phase: 'finish',
          upload_session_id: initUploadRes.upload_session_id,
          published: false,
        }
        const finalizeRes = await this.facebookService.finalizeMediaUpload(
          accountId,
          pageId,
          finalizeReq,
        )
        if (!finalizeRes || !finalizeRes.success) {
          res.message = '视频上传完成失败'
          return res
        }
        const videoPostReq: PublishUploadedVideoPostRequest = {
          description: publishTask.desc,
          crossposted_video_id: initUploadRes.video_id,
          published: true,
        }
        const postRes = await this.facebookService.publishVideoPost(
          accountId,
          pageId,
          videoPostReq,
        )
        if (!postRes || !postRes.id) {
          res.message = '确认视频上传完成失败'
          return res
        }
        let permalink = '';
        try {
          const postInfo = await this.facebookService.getObjectInfo(
            accountId,
            postRes.id,
            pageId,
            'id,permalink_url',
          )
          permalink = postInfo.permalink_url || '';
        }
        catch (error) {
          this.logger.error(`获取视频链接失败: ${error.message}`, error.stack)
        }
        permalink = permalink ? `https://www.facebook.com/${permalink}` : '';
        await this.overPublishTask(publishTask, postRes.id, { workLink: permalink })
        res.status = 1
        res.message = '视频发布成功'
        return res
      }
      return res
    }
    catch (error) {
      this.logger.error(`发布任务失败: ${error.message}`, error.stack)
      return {
        status: -1,
        message: `发布任务失败: ${error.message}`,
      }
    }
  }
}
