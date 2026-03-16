import { Injectable, Logger } from '@nestjs/common'
import { AssetsService } from '@yikart/assets'
import {
  PublishRecord,
  PublishStatus,
  PublishType,
} from '@yikart/mongodb'
import { MediaType } from '../../libs/wx-gzh/common'
import { WxGzhService } from '../../platforms/wx-plat/wx-gzh.service'
import { PublishingException } from '../publishing.exception'
import { PublishingTaskResult, VerifyPublishResult } from '../publishing.interface'
import { PublishService } from './base.service'

@Injectable()
export class WxGzhPubService extends PublishService {
  logger = new Logger(WxGzhPubService.name)

  constructor(
    readonly wxGzhService: WxGzhService,
    private readonly assetsService: AssetsService,
  ) {
    super()
  }

  async immediatePublish(publishTask: PublishRecord): Promise<PublishingTaskResult> {
    if (!publishTask.accountId) {
      this.logger.error('Account ID is required')
      throw PublishingException.nonRetryable('Account ID is required')
    }
    if (publishTask.videoUrl)
      publishTask.videoUrl = this.assetsService.buildUrl(publishTask.videoUrl)
    publishTask.imgUrlList = publishTask.imgUrlList?.map(url => this.assetsService.buildUrl(url)) || []
    publishTask.coverUrl = publishTask.coverUrl ? this.assetsService.buildUrl(publishTask.coverUrl) : undefined
    // 开始任务
    const { coverUrl, accountId, imgUrlList, title, desc, type, option }
      = publishTask
    if (!imgUrlList || imgUrlList.length === 0) {
      this.logger.error('No images found for image post')
      throw PublishingException.nonRetryable('No images found for image post')
    }
    if (!title) {
      this.logger.error('Title is required')
      throw PublishingException.nonRetryable('Title is required')
    }
    if (!desc) {
      this.logger.error('Description is required')
      throw PublishingException.nonRetryable('Description is required')
    }
    if (type !== PublishType.ARTICLE) {
      this.logger.error('Only article publishing is supported for WeChat Official Account')
      throw PublishingException.nonRetryable('Only article publishing is supported for WeChat Official Account')
    }

    const wxGzhImgMaterialIdList: {
      image_media_id: string
    }[] = []

    if (coverUrl) {
      const coverUrlRes = await this.wxGzhService.addMaterial(
        accountId,
        MediaType.image,
        coverUrl,
      )
      wxGzhImgMaterialIdList.push({
        image_media_id: coverUrlRes.media_id,
      })
    }

    for (const imgUrl of imgUrlList) {
      const imgUrlRes = await this.wxGzhService.addMaterial(
        accountId,
        MediaType.image,
        imgUrl,
      )
      wxGzhImgMaterialIdList.push({ image_media_id: imgUrlRes.media_id })
    }

    const draftAddRes = await this.wxGzhService.draftAdd(accountId, {
      article_type: 'newspic',
      title,
      content: desc,
      image_info: {
        image_list: wxGzhImgMaterialIdList,
      },
      ...option?.wxGzh,
    })

    const freePublishRes = await this.wxGzhService.freePublish(
      accountId,
      draftAddRes.media_id,
    )

    return {
      postId: freePublishRes.publish_id,
      permalink: `https://mp.weixin.qq.com/s/${freePublishRes.publish_id}`,
      extra: {
        publish_id: freePublishRes.publish_id,
        msg_data_id: freePublishRes.msg_data_id,
      },
      status: PublishStatus.PUBLISHED,
    }
  }

  async verifyAndCompletePublish(publishRecord: PublishRecord): Promise<VerifyPublishResult> {
    try {
      // 微信公众号由于缺少获取发布状态的API，这里直接返回成功
      // 文章链接已在发布时生成
      if (publishRecord.dataId) {
        const workLink = `https://mp.weixin.qq.com/s/${publishRecord.dataId}`
        return {
          success: true,
          workLink,
        }
      }

      return {
        success: false,
        errorMsg: '发布记录缺少文章ID',
      }
    }
    catch (error) {
      this.logger.error(`验证微信公众号发布状态失败: ${(error as Error).message}`, (error as Error).stack)
      return {
        success: false,
        errorMsg: `验证发布状态失败: ${(error as Error).message}`,
      }
    }
  }
}
