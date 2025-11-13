import { Injectable, Logger } from '@nestjs/common'
import {
  PublishStatus,
  PublishTask,
  PublishType,
} from '../../../libs/database/schema/publishTask.schema'
import { MediaType } from '../../../libs/wx-gzh/common'
import { WxGzhService } from '../../platforms/wx-plat/wx-gzh.service'
import { PublishingException } from '../publishing.exception'
import { PublishingTaskResult } from '../publishing.interface'
import { PublishService } from './base.service'

@Injectable()
export class WxGzhPubService extends PublishService {
  logger = new Logger(WxGzhPubService.name)

  constructor(
    readonly wxGzhService: WxGzhService,
  ) {
    super()
  }

  async immediatePublish(publishTask: PublishTask): Promise<PublishingTaskResult> {
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
}
