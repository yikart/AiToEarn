import { InjectQueue } from '@nestjs/bullmq'
/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 17:58:21
 * @LastEditors: nevin
 * @Description: b站
 */
import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { AccountType } from '@transports/account/common'
import { Queue } from 'bullmq'
import { Model } from 'mongoose'
import { FileToolsService } from '@/core/file/fileTools.service'
import { YoutubeService } from '@/core/plat/youtube/youtube.service'
import { PublishRecord } from '@/libs/database/schema/publishRecord.schema'
import { PublishStatus, PublishTask } from '@/libs/database/schema/publishTask.schema'
import { DoPubRes } from '../common'
import { PublishBase } from './publish.base'

@Injectable()
export class YoutubePubService extends PublishBase {
  queueName: string = AccountType.YOUTUBE

  constructor(
    @InjectModel(PublishTask.name)
    readonly publishTaskModel: Model<PublishTask>,
    @InjectModel(PublishRecord.name)
    readonly publishRecordModel: Model<PublishRecord>,
    @InjectQueue('bull_publish') publishQueue: Queue,
    readonly youtubeService: YoutubeService,
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

  doPub(publishTask: PublishTask): Promise<DoPubRes> {
    return new Promise(async (resolve) => {
      const res: DoPubRes = {
        status: -1,
        message: '任务不存在',
      }

      // const { coverUrl, accountId, videoUrl } = publishTask

      const TaskInfo = {
        coverUrl: publishTask.coverUrl,
        accountId: publishTask.accountId,
        videoUrl: publishTask.videoUrl,
        title: publishTask.title,
        desc: publishTask.desc,
        tag: publishTask.topics.join(','),
        categoryId: publishTask?.option?.youtube?.categoryId,
        privacyStatus: publishTask?.option?.youtube?.privacyStatus,
        publishAt: publishTask?.option?.youtube?.publishAt,
      }

      if (!TaskInfo.videoUrl) {
        res.message = '视频不存在'
        res.noRetry = true
        return resolve(res)
      }

      Logger.log('TaskInfo:----', TaskInfo)
      //   const fileName = this.fileToolsService.getFileTypeFromUrl(TaskInfo.videoUrl)
      const contentLength = await this.fileToolsService.getFileSizeFromUrl(TaskInfo.videoUrl)
      Logger.log('视频大小：----', contentLength)
      if (!contentLength) {
        res.message = '视频大小获取失败'
        return resolve(res)
      }
      Logger.log('正在分片上传...')
      // 视频分片上传初始化
      const videoUpToken = await this.youtubeService.initVideoUpload(
        TaskInfo.accountId,
        TaskInfo.title || '',
        TaskInfo.desc || '',
        TaskInfo.tag?.split(',') || [],
        TaskInfo.categoryId || '22',
        TaskInfo.privacyStatus || 'private',
        TaskInfo.publishAt,
        Number(contentLength),
      )
      if (!videoUpToken) {
        res.message = '视频初始化失败'
        return resolve(res)
      }

      // 视频URL分片上传
      void this.fileToolsService.streamDownloadAndUpload(
        TaskInfo.videoUrl,
        async (upData: Buffer, partNumber: number) => {
          Logger.log(`分片：${partNumber}`)
          await this.youtubeService.uploadVideoPart(
            TaskInfo.accountId,
            upData,
            videoUpToken,
            partNumber,
          )
        },
        async () => {
          Logger.log('发布...')
          // 发布
          const resourceId = await this.youtubeService.videoComplete(
            TaskInfo.accountId,
            videoUpToken,
            Number(contentLength),
          )
          if (!resourceId) {
            res.message = '稿件发布失败'
            return resolve(res)
          }

          if (!resourceId) {
            res.message = '稿件发布失败'
            return resolve(res)
          }

          // 封面上传
          // 有封面
          // if (TaskInfo.coverUrl) {
          //   Logger.log('正在上传封面...')
          //   const urlBase64 = await this.fileToolsService.fileUrlToBase64(TaskInfo.coverUrl)
          //   const coverRes = await this.youtubeService.uploadThumbnails(
          //     TaskInfo.accountId,
          //     resourceId,
          //     urlBase64,
          //   )
          //   if (!coverRes) {
          //     res.message = '封面上传失败'
          //     return resolve(res)
          //   }

          //   Logger.log('封面上传成功：', coverRes)

          //   publishTask.coverUrl = coverRes
          // }

          // 设置封面
          // await this.youtubeService.uploadThumbnails(
          //   TaskInfo.accountId,
          //   resourceId,
          //   TaskInfo.coverUrl,
          // )

          // 完成发布任务
          void this.overPublishTask(publishTask, resourceId)
          res.message = '发布成功'
          res.status = 1

          resolve(res)
        },
      ).catch((e) => {
        resolve({
          message: e.message,
          status: PublishStatus.FAIL,
        })
      })
    })
  }
}
