/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 17:58:21
 * @LastEditors: nevin
 * @Description: b站
 */
import { Injectable, Logger } from '@nestjs/common'
import { AccountType } from '@yikart/aitoearn-server-client'
import { KwaiService } from '../../../core/plat/kwai/kwai.service'
import {
  PublishStatus,
  PublishTask,
} from '../../../libs/database/schema/publishTask.schema'
import { DoPubRes } from '../common'
import { PublishBase } from './publish.base'

@Injectable()
export class kwaiPubService extends PublishBase {
  override queueName: string = AccountType.KWAI

  private readonly logger: Logger = new Logger(kwaiPubService.name)
  constructor(
    readonly kwaiService: KwaiService,
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

  async doPub(publishTask: PublishTask): Promise<DoPubRes> {
    this.logger.log(`Processing Kwai Publish Task: ${publishTask.id}`)
    try {
      const res = await this.kwaiService.publishVideo(publishTask.accountId, {
        coverUrl: publishTask.coverUrl!,
        videoUrl: publishTask.videoUrl!,
        describe: publishTask.desc,
      })
      this.logger.log(`Kwai Publish Result: ${JSON.stringify(res)}`)

      if (res.success) {
        void this.completePublishTask(publishTask, res.worksId!, {
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
