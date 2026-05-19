import { Injectable, Logger } from '@nestjs/common'
import { AssetsService } from '@yikart/assets'
import { AccountType } from '@yikart/common'
import {
  PublishRecord,
  PublishStatus,
} from '@yikart/mongodb'
import { ShortLinkService } from '../../../short-link/short-link.service'
import { DouyinDownloadType, DouyinPrivateStatus, DouyinShareSchemaOptions } from '../../libs/douyin/common'
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
    publishTask: { desc?: string, title?: string, topics: string[], videoUrl?: string, coverUrl?: string, imgUrlList?: string[] },
    option?: {
      downloadType: DouyinDownloadType
      privateStatus: DouyinPrivateStatus
      shareId?: string
    },
  ): Promise<{
    permalink: string
    shareId: string
  }> {
    const { title, desc, topics, videoUrl, imgUrlList } = publishTask
    const processedImgUrlList = imgUrlList?.map(url => this.assetsService.buildUrl(url))
    const processedVideoUrl = videoUrl ? this.assetsService.buildUrl(videoUrl) : undefined
    const titleText = title || desc || ''
    const title_hashtag_list = topics.map(topic => ({
      name: topic,
      start: titleText.length,
    }))
    const shareId = await this.douyinService.getShareid()
    const options: DouyinShareSchemaOptions = {
      shareId,
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
      shareId,
    }
  }

  async immediatePublish(publishTask: PublishRecord): Promise<PublishingTaskResult> {
    const { desc, title, option, topics, videoUrl, imgUrlList } = publishTask
    const options = {
      downloadType: option?.douyin?.downloadType || DouyinDownloadType.Allow,
      privateStatus: option?.douyin?.privateStatus || DouyinPrivateStatus.All,
    }

    const { permalink, shareId } = await this.doPublish({
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
      postId: shareId,
      permalink,
      shortLink,
      status: PublishStatus.PUBLISHING,
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

  /**
   * 处理抖音发布成功的 webhook 回调，更新发布记录状态和作品链接
   * @param dto
   * @returns
   */
  async handleDouyinPublishWebhook(dto: DouyinWebhookDto): Promise<void> {
    try {
      // 测试数据
      // const content = {
      //   "share_id": "1861446241666108",
      //   "item_id": "@9VwI1aLBStkzKWbyYdo+Us7902ftOfCGO5V1rgqmKFYUavX560zdRmYqig357zEBoMWS3ArmmwPxgMcrFLx92g==",
      //   "has_default_hashtag": false,
      //   "video_id": "7624484004700777445"
      // }

      const { share_id, video_id } = dto.content
      if (!share_id) {
        this.logger.error({
          tag: 'douyin-webhooks-error-no-share-id',
          data: dto.content,
        })
        return
      }

      const publishTask = await this.publishRecordService.getOneByDataId(share_id, AccountType.Douyin)
      if (!publishTask) {
        this.logger.error({
          tag: 'douyin-webhooks-error-no-publishTask',
          data: {
            share_id,
            from_user_id: dto.from_user_id,
          },
        })
        return
      }

      this.logger.log({
        tag: 'douyin-webhooks-publishTask',
        data: {
          publishTask,
        },
      })
      const workLink = `https://www.douyin.com/video/${video_id}`
      if (publishTask.status === PublishStatus.PUBLISHED) {
        await this.publishRecordService.updateById(publishTask.id, { $set: { dataId: video_id, workLink } })
        return
      }
      await this.completePublishTask(publishTask, video_id, { workLink })
    }
    catch (error) {
      this.logger.error(error, '处理抖音 webhook 失败')
    }
  }
}
