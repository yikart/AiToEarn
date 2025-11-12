import { Injectable, Logger } from '@nestjs/common'
import { AccountType } from '@yikart/aitoearn-server-client'
import { getFileSizeFromUrl, streamDownloadAndUpload } from '../../../common'
import { YoutubeService } from '../../../core/plat/youtube/youtube.service'
import {
  PublishStatus,
  PublishTask,
} from '../../../libs/database/schema/publishTask.schema'
import { DoPubRes } from '../common'
import { PublishBase } from './publish.base'

@Injectable()
export class YoutubePubService extends PublishBase {
  override queueName: string = AccountType.YOUTUBE
  private readonly logger = new Logger(YoutubePubService.name)

  constructor(
    readonly youtubeService: YoutubeService,
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
      }

      if (!TaskInfo.videoUrl) {
        res.message = '视频不存在'
        res.noRetry = true
        return resolve(res)
      }

      this.logger.log('TaskInfo:----', TaskInfo)
      //   const fileName = this.fileToolsService.getFileTypeFromUrl(TaskInfo.videoUrl)
      const contentLength = await getFileSizeFromUrl(TaskInfo.videoUrl)
      this.logger.log('视频大小：----', contentLength)
      if (!contentLength) {
        res.message = '视频大小获取失败'
        return resolve(res)
      }
      this.logger.log('正在分片上传...')
      // 视频分片上传初始化
      const videoUpToken = await this.youtubeService.initVideoUpload(
        TaskInfo.accountId,
        TaskInfo.title || '',
        TaskInfo.desc || '',
        TaskInfo.tag?.split(',') || [],
        publishTask?.option?.youtube?.license || 'youtube',
        TaskInfo.categoryId || '22',
        TaskInfo.privacyStatus || 'private',
        publishTask?.option?.youtube?.notifySubscribers || false,
        publishTask?.option?.youtube?.embeddable || false,
        publishTask?.option?.youtube?.selfDeclaredMadeForKids || false,
        Number(contentLength),
      )
      if (!videoUpToken) {
        res.message = '视频初始化失败'
        return resolve(res)
      }

      // 视频URL分片上传
      void streamDownloadAndUpload(
        TaskInfo.videoUrl,
        async (upData: Buffer, partNumber: number) => {
          this.logger.log(`分片：${partNumber}`)
          await this.youtubeService.uploadVideoPart(
            TaskInfo.accountId,
            upData,
            videoUpToken,
            partNumber,
          )
        },
        async () => {
          this.logger.log('发布...')
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
          //   this.logger.log('正在上传封面...')
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

          //   this.logger.log('封面上传成功：', coverRes)

          //   publishTask.coverUrl = coverRes
          // }

          // 设置封面
          // await this.youtubeService.uploadThumbnails(
          //   TaskInfo.accountId,
          //   resourceId,
          //   TaskInfo.coverUrl,
          // )

          // 完成发布任务
          void this.completePublishTask(publishTask, resourceId, {
            workLink: `https://www.youtube.com/watch?v=${resourceId}`,
          })
          res.message = '发布成功'
          res.status = 1

          resolve(res)
        },
      ).catch((e) => {
        resolve({
          message: e.message,
          status: PublishStatus.FAILED,
        })
      })
    })
  }
}
