import { Injectable, Logger } from '@nestjs/common'
import { AssetsService } from '@yikart/assets'
import {
  PublishRecord,
  PublishStatus,
} from '@yikart/mongodb'
import { ShortLinkService } from '../../../short-link/short-link.service'
import { DouyinDownloadType, DouyinPrivateStatus, DouyinShareSchemaOptions } from '../../libs/douyin/common'
import { WebhookEvent } from '../../platforms/douyin/common'
import { DouyinService } from '../../platforms/douyin/douyin.service'
import { DouyinWebhookDto } from '../douyin-webhook.dto'
import { PublishingTaskResult, VerifyPublishResult } from '../publishing.interface'
import { PublishService } from './base.service'

@Injectable()
export class DouyinPubService extends PublishService {
  private readonly logger = new Logger(DouyinPubService.name)

  constructor(
    readonly douyinService: DouyinService,
    private readonly assetsService: AssetsService,
    private readonly shortLinkService: ShortLinkService,
  ) {
    super()
  }

  async doPublish(
    publishTask: { desc?: string, title?: string, topics: string[], videoUrl?: string, imgUrlList?: string[] },
    option?: {
      downloadType: DouyinDownloadType
      privateStatus: DouyinPrivateStatus
      shareId?: string
    },
  ): Promise<{
    permalink: string
    // , shareId: string
  }> {
    const { title, desc, topics, videoUrl, imgUrlList } = publishTask
    // const shareId = option?.shareId || await this.douyinService.getShareid()
    const processedImgUrlList = imgUrlList?.map(url => this.assetsService.buildUrl(url))
    const processedVideoUrl = videoUrl ? this.assetsService.buildUrl(videoUrl) : undefined
    const titleText = title || desc || ''
    const title_hashtag_list = topics.map(topic => ({
      name: topic,
      start: titleText.length,
    }))
    const options: DouyinShareSchemaOptions = {
      // shareId,
      title: titleText,
      title_hashtag_list,
      downloadType: option?.downloadType || DouyinDownloadType.Allow,
      privateStatus: option?.privateStatus || DouyinPrivateStatus.All,
      image_list_path: processedImgUrlList,
      video_path: processedVideoUrl,
    }

    const permalink = await this.douyinService.generateShareSchema(options)
    return {
      permalink,
      // shareId,
    }
  }

  async immediatePublish(publishTask: PublishRecord): Promise<PublishingTaskResult> {
    const { desc, title, option, topics, videoUrl, imgUrlList } = publishTask
    const options = {
      downloadType: option?.douyin?.downloadType || DouyinDownloadType.Allow,
      privateStatus: option?.douyin?.privateStatus || DouyinPrivateStatus.All,
    }

    const { permalink } = await this.doPublish({
      desc,
      title,
      topics,
      videoUrl,
      imgUrlList,
    }, options)

    // 短链接
    const shortLink = await this.shortLinkService.create(permalink, {
      expiresInSeconds: 60 * 60 * 24 * 7, // 7 days
    })

    return {
      postId: '',
      permalink,
      shortLink,
      status: PublishStatus.PUBLISHED,
    }
  }

  async verifyAndCompletePublish(publishRecord: PublishRecord): Promise<VerifyPublishResult> {
    // 抖音使用 shareSchema 方式发布，发布即完成，无需额外验证
    // 作品链接已在 immediatePublish 返回时设置
    if (publishRecord.workLink) {
      return {
        success: true,
        workLink: publishRecord.workLink,
      }
    }
    return {
      success: true,
    }
  }

  async handleDouyinPublishWebhook(dto: DouyinWebhookDto): Promise<void> {
    try {
      if (dto.event !== WebhookEvent.PublishVideo) {
        this.logger.error(`未知抖音事件类型: ${dto.event}`)
        return
      }

      const { share_id, item_id } = dto.content
      if (!share_id) {
        this.logger.error(`invalid share_id in webhook: ${JSON.stringify(dto.content)}`)
        return
      }

      const publishTask = await this.publishRecordService.getOneByData(share_id, dto.from_user_id)
      if (!publishTask) {
        this.logger.error(`未找到发布记录: share_id=${share_id}, from_user_id=${dto.from_user_id}`)
        return
      }

      const workLink = `https://www.douyin.com/video/${item_id}`
      this.logger.log(`抖音发布成功: share_id=${share_id}, item_id=${item_id}`)

      if (publishTask.status === PublishStatus.PUBLISHED) {
        this.logger.log(`抖音发布记录已完成，仅更新 dataId 和 workLink: ${publishTask.id}`)
        await this.publishRecordService.updateById(publishTask.id, { $set: { dataId: item_id, workLink } })
        return
      }
      await this.completePublishTask(publishTask, item_id, { workLink })
    }
    catch (error) {
      this.logger.error(`处理抖音 webhook 失败: ${(error as Error).message}`, (error as Error).stack)
    }
  }
}
