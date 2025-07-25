import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Queue } from 'bullmq'

import { Model } from 'mongoose'
import { InstagramService } from '@/core/plat/meta/instagram.service'
import { PublishRecord } from '@/libs/database/schema/publishRecord.schema'
import { PublishTask } from '@/libs/database/schema/publishTask.schema'
import { InstagramMediaType } from '@/libs/instagram/instagram.enum'
import { CreateMediaContainerRequest } from '@/libs/instagram/instagram.interfaces'
import { DoPubRes } from '../common'
import { PublishBase } from './publish.base'

@Injectable()
export class InstagramPubService extends PublishBase {
  queueName: string = 'instagram'

  constructor(
    @InjectModel(PublishTask.name)
    readonly publishTaskModel: Model<PublishTask>,
    @InjectModel(PublishRecord.name)
    readonly publishRecordModel: Model<PublishRecord>,
    @InjectQueue('bull_publish') publishQueue: Queue,
    readonly instagramService: InstagramService,
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
    try {
      const { imgUrlList, accountId, videoUrl } = publishTask
      const igContainerIDList: string[] = []
      let containerID = ''
      let containerType = InstagramMediaType.CAROUSEL
      if (!(imgUrlList && imgUrlList.length > 1) && videoUrl) {
        containerType = InstagramMediaType.REELS
      }
      if (imgUrlList && imgUrlList.length > 1) {
        for (const imgUrl of imgUrlList) {
          const createContainerReq: CreateMediaContainerRequest = {
            is_carousel_item: true,
            media_type: InstagramMediaType.IMAGE,
            image_url: imgUrl,
          }
          const initUploadRes = await this.instagramService.createMediaContainer(
            accountId,
            createContainerReq,
          )
          if (!initUploadRes || !initUploadRes.id) {
            res.message = '图片初始化上传失败'
            return res
          }
          igContainerIDList.push(initUploadRes.id)
        }
      }

      if (videoUrl) {
        const downloadULR = videoUrl.replace('undefined', 'https://ai-to-earn.oss-cn-beijing.aliyuncs.com/')
        const createContainerReq: CreateMediaContainerRequest = {
          video_url: downloadULR,
          media_type: InstagramMediaType.REELS,
        }
        if (containerType === 'CAROUSEL') {
          createContainerReq.is_carousel_item = true
        }
        const initUploadRes = await this.instagramService.createMediaContainer(
          accountId,
          createContainerReq,
        )
        if (!initUploadRes || !initUploadRes.id) {
          res.message = '视频初始化上传失败'
          return res
        }
        igContainerIDList.push(initUploadRes.id)
      }
      if (igContainerIDList.length === 0) {
        res.message = '没有可发布的内容'
        return res
      }

      if (containerType === InstagramMediaType.CAROUSEL) {
        const carouselContainerReq: CreateMediaContainerRequest = {
          media_type: containerType,
          children: igContainerIDList,
        }
        const createMediaContainerRes = await this.instagramService.createMediaContainer(
          accountId,
          carouselContainerReq,
        )
        if (!createMediaContainerRes || !createMediaContainerRes.id) {
          res.message = '轮播图创建失败'
          return res
        }
        containerID = createMediaContainerRes.id
      }
      else {
        containerID = igContainerIDList[0]
      }
      const createPostRes = await this.instagramService.publishMediaContainer(
        accountId,
        containerID,
      )
      if (!createPostRes || !createPostRes.id) {
        res.message = '推文创建失败'
        return res
      }
      res.status = 1
      res.message = '发布成功'
      // 完成发布任务
      await this.overPublishTask(publishTask, createPostRes.id)
      return res
    }
    catch (error) {
      res.message = `发布失败: ${error.message || error}`
      return res
    }
  }
}
