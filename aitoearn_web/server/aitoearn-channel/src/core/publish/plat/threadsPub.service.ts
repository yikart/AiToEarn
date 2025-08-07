import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Queue } from 'bullmq'
import { Model } from 'mongoose'
import { ThreadsService } from '@/core/plat/meta/threads.service'
import { PublishRecord } from '@/libs/database/schema/publishRecord.schema'
import { PublishTask } from '@/libs/database/schema/publishTask.schema'
import { ThreadsContainerRequest } from '@/libs/threads/threads.interfaces'
import { DoPubRes } from '../common'
import { PublishBase } from './publish.base'

@Injectable()
export class ThreadPubService extends PublishBase {
  queueName: string = 'threads'

  constructor(
    @InjectModel(PublishTask.name)
    readonly publishTaskModel: Model<PublishTask>,
    @InjectModel(PublishRecord.name)
    readonly publishRecordModel: Model<PublishRecord>,
    @InjectQueue('bull_publish') publishQueue: Queue,
    readonly threadsService: ThreadsService,
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
    const containerItems: string[] = []
    if (imgUrlList && imgUrlList.length > 0) {
      for (const imgUrl of imgUrlList) {
        const createContainerReq: ThreadsContainerRequest = {
          is_carousel_item: true,
          media_type: 'IMAGE',
          image_url: imgUrl,
        }
        const container = await this.threadsService.createItemContainer(accountId, createContainerReq)
        if (!container) {
          res.message = '创建容器失败'
          return res
        }
        containerItems.push(container.id)
      }
    }
    if (videoUrl) {
      const createContainerReq: ThreadsContainerRequest = {
        media_type: 'VIDEO',
        video_url: videoUrl,
      }
      if (imgUrlList && imgUrlList.length > 0) {
        createContainerReq.is_carousel_item = true;
      }
      const container = await this.threadsService.createItemContainer(accountId, createContainerReq)
      if (!container) {
        res.message = '创建视频容器失败'
        return res
      }
      containerItems.push(container.id)
    }
    if (containerItems.length === 0) {
      res.message = '没有可发布的内容'
      return res
    }
    let creationId = containerItems[0]
    if (containerItems.length > 1) {
      const carouselContainer: ThreadsContainerRequest = {
        text: publishTask.desc,
        media_type: 'CAROUSEL',
        children: containerItems,
      }
      const createPostRes = await this.threadsService.createItemContainer(accountId, carouselContainer)
      if (!createPostRes) {
        res.message = '创建帖子失败'
        return res
      }
      creationId = createPostRes.id
    }

    const pubPostRes = await this.threadsService.publishPost(accountId, creationId)
    if (!pubPostRes) {
      res.message = '发布帖子失败'
      return res
    }
    res.status = 1
    res.message = '发布成功'
    // 完成发布任务
    await this.overPublishTask(publishTask, pubPostRes.id)
    return res
  }
}
