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
import { KwaiService } from '@/core/plat/kwai/kwai.service'
import { PublishRecord } from '@/libs/database/schema/publishRecord.schema'
import { PublishStatus, PublishTask } from '@/libs/database/schema/publishTask.schema'
import { DoPubRes } from '../common'
import { PublishBase } from './publish.base'
import { EventEmitter2 } from '@nestjs/event-emitter'

@Injectable()
export class kwaiPubService extends PublishBase {
  queueName: string = AccountType.KWAI

  constructor(
    readonly eventEmitter: EventEmitter2,
    @InjectModel(PublishTask.name)
    readonly publishTaskModel: Model<PublishTask>,
    @InjectQueue('post_publish') publishQueue: Queue,
    readonly kwaiService: KwaiService,
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
    try {
      const res = await this.kwaiService.videoPub(publishTask.accountId, {
        coverUrl: publishTask.coverUrl!,
        videoUrl: publishTask.videoUrl!,
        describe: publishTask.desc,
      })
      Logger.log('快手发布结果', res)

      if (res.success) {
        void this.overPublishTask(publishTask, res.worksId!, {
          workLink: `https://www.kuaishou.com/short-video/${res.worksId}`,
        })
        return {
          message: '发布成功',
          status: PublishStatus.PUBLISHED,
        }
      }
      else {
        return {
          message: res.failMsg || '发布失败，未知原因',
          status: PublishStatus.FAILED,
        }
      }
    }
    catch (e) {
      return {
        message: e.message || '发布失败，未知原因',
        status: PublishStatus.FAILED,
      }
    }
  }
}
