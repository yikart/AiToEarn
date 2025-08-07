import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { AccountType } from '@transports/account/common'

import { Queue } from 'bullmq'
import { Model } from 'mongoose'
import { chunkedDownloadFile, fileUrlToBlob, getFileSizeFromUrl, getFileTypeFromUrl } from '@/common'
import { TwitterService } from '@/core/plat/twitter/twitter.service'
import { PublishRecord } from '@/libs/database/schema/publishRecord.schema'
import { PublishTask } from '@/libs/database/schema/publishTask.schema'
import { XMediaCategory, XMediaType } from '@/libs/twitter/twitter.enum'
import { XChunkedMediaUploadRequest, XCreatePostRequest, XMediaUploadInitRequest } from '@/libs/twitter/twitter.interfaces'
import { DoPubRes } from '../common'
import { PublishBase } from './publish.base'

@Injectable()
export class TwitterPubService extends PublishBase {
  queueName: string = AccountType.TWITTER

  constructor(
    @InjectModel(PublishTask.name)
    readonly publishTaskModel: Model<PublishTask>,
    @InjectModel(PublishRecord.name)
    readonly publishRecordModel: Model<PublishRecord>,
    @InjectQueue('bull_publish') publishQueue: Queue,
    readonly twitterService: TwitterService,
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
    const res: DoPubRes = {
      status: -1,
      message: '任务不存在',
    }

    const { imgUrlList, accountId, videoUrl } = publishTask
    const twitterMediaIDs: string[] = []
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
        twitterMediaIDs.push(initUploadRes.data.id)
      }
    }

    if (videoUrl) {
      const fileName = getFileTypeFromUrl(videoUrl, true)
      const ext = fileName.split('.').pop()?.toLowerCase()
      const mimeType = ext === 'mp4' ? 'video/mp4' : `video/${ext}`

      const contentLength = await getFileSizeFromUrl(videoUrl)
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
      twitterMediaIDs.push(initUploadRes.data.id)
    }
    const post: XCreatePostRequest = {
      text: publishTask.desc || '',
      media: {
        media_ids: twitterMediaIDs,
      },
    }
    const createPostRes = await this.twitterService.createPost(
      accountId,
      post,
    )
    if (!createPostRes || !createPostRes.data.id) {
      res.message = '推文创建失败'
      return res
    }
    res.status = 1
    res.message = '发布成功'
    // 完成发布任务
    await this.overPublishTask(publishTask, createPostRes.data.id)
    return res
  }
}
