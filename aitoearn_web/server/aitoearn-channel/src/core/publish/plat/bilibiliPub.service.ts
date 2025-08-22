import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/mongoose'
import { AccountType } from '@transports/account/common'
import { Queue } from 'bullmq'
import { Model } from 'mongoose'
import { fileUrlToBase64, getFileTypeFromUrl, streamDownloadAndUpload } from '@/common'
import { BilibiliService } from '@/core/plat/bilibili/bilibili.service'
import { PublishStatus, PublishTask } from '@/libs/database/schema/publishTask.schema'
import { DoPubRes } from '../common'
import { PublishBase } from './publish.base'

@Injectable()
export class BilibiliPubService extends PublishBase {
  queueName: string = AccountType.BILIBILI

  constructor(
    readonly eventEmitter: EventEmitter2,
    @InjectModel(PublishTask.name)
    readonly publishTaskModel: Model<PublishTask>,
    @InjectQueue('post_publish') publishQueue: Queue,
    readonly bilibiliService: BilibiliService,
  ) {
    super(eventEmitter, publishTaskModel, publishQueue)
    // this.createPublishRecord(null as any)
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

      // 封面上传
      const { coverUrl, accountId, videoUrl } = publishTask
      let biblCoverUrl = ''
      // 有封面
      if (coverUrl) {
        Logger.log('正在上传封面...')
        const urlBase64 = await fileUrlToBase64(coverUrl)
        const coverRes = await this.bilibiliService.coverUpload(
          accountId,
          urlBase64,
        )
        if (!coverRes) {
          res.message = '封面上传失败'
          return resolve(res)
        }
        biblCoverUrl = coverRes

        Logger.log('封面上传成功：', coverRes)
      }

      if (!videoUrl) {
        res.message = '视频不存在'
        res.noRetry = true
        return resolve(res)
      }
      const fileName = getFileTypeFromUrl(videoUrl)

      Logger.log('正在分片上传...')
      // 视频分片上传初始化
      const videoUpToken = await this.bilibiliService.videoInit(
        accountId,
        fileName,
        0,
      )
      if (!videoUpToken) {
        res.message = '视频初始化失败'
        return resolve(res)
      }

      // 视频URL分片上传
      void streamDownloadAndUpload(
        videoUrl,
        async (upData: Buffer, partNumber: number) => {
          Logger.log(`分片：${partNumber}`)
          await this.bilibiliService.uploadVideoPart(
            accountId,
            upData,
            videoUpToken,
            partNumber,
          )
        },
        async () => {
          Logger.log('合并分片...')
          // 合并
          await this.bilibiliService.videoComplete(accountId, videoUpToken)

          Logger.log('发布...')
          // 发布
          const resourceId = await this.bilibiliService.archiveAddByUtoken(
            accountId,
            videoUpToken,
            {
              title: publishTask.title || '',
              cover: biblCoverUrl,
              desc: publishTask.desc,
              ...(publishTask.option!.bilibili!),
              tag: publishTask.topics?.join(','),
            },
          )

          if (!resourceId) {
            res.message = '稿件发布失败'
            return resolve(res)
          }

          // 完成发布任务
          void this.overPublishTask(publishTask, resourceId, {
            workLink: `https://www.bilibili.com/video/${resourceId}`,
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
