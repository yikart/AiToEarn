import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/mongoose'
import { Queue } from 'bullmq'
import { Model } from 'mongoose'
import { WxGzhService } from '../../../core/plat/wxPlat/wxGzh.service'
import {
  PublishTask,
  PublishType,
} from '../../../libs/database/schema/publishTask.schema'
import { MediaType } from '../../../libs/wxGzh/common'
import { AccountType } from '../../../transports/account/common'
import { DoPubRes } from '../common'
import { PublishBase } from './publish.base'

@Injectable()
export class WxGzhPubService extends PublishBase {
  logger = new Logger(WxGzhPubService.name)
  override queueName: string = AccountType.WxGzh

  constructor(
    override readonly eventEmitter: EventEmitter2,
    @InjectModel(PublishTask.name)
    override readonly publishTaskModel: Model<PublishTask>,
    @InjectQueue('post_publish') publishQueue: Queue,
    readonly wxGzhService: WxGzhService,
  ) {
    super(eventEmitter, publishTaskModel, publishQueue)
  }

  async checkAuth(accountId: string): Promise<{
    status: 0 | 1
    timeout?: number // 秒
  }> {
    return this.wxGzhService.checkAuth(accountId)
  }

  async doPub(publishTask: PublishTask) {
    // 开始任务
    const res: DoPubRes = {
      status: -1,
      message: '任务不存在',
    }

    const { coverUrl, accountId, imgUrlList, title, desc, type, option }
      = publishTask
    if (!imgUrlList || imgUrlList.length === 0) {
      res.message = '图片列表不能为空'
      return res
    }
    if (!title) {
      res.message = '标题不能为空'
      return res
    }
    if (!desc) {
      res.message = '描述不能为空'
      return res
    }
    if (type !== PublishType.ARTICLE) {
      res.message = '公众号只有文章发布'
      return res
    }

    // 上传图片
    const wxGzhImgMaterialIdList: {
      image_media_id: string
    }[] = []

    // 封面
    if (coverUrl) {
      this.logger.log('正在上传封面...')
      const coverUrlRes = await this.wxGzhService.addMaterial(
        accountId,
        MediaType.image,
        coverUrl,
      )
      this.logger.log(coverUrlRes)
      if (!coverUrlRes || coverUrlRes.errcode) {
        res.message = '封面上传失败'
        return res
      }
      wxGzhImgMaterialIdList.push({
        image_media_id: coverUrlRes.media_id,
      })
      this.logger.log('封面上传成功：', coverUrlRes)
    }

    // 图片
    for (const imgUrl of imgUrlList) {
      this.logger.log('正在上传图片...')
      const imgUrlRes = await this.wxGzhService.addMaterial(
        accountId,
        MediaType.image,
        imgUrl,
      )
      if (!imgUrlRes || imgUrlRes.errcode) {
        res.message = '图片上传失败'
        return res
      }
      wxGzhImgMaterialIdList.push({ image_media_id: imgUrlRes.media_id })
      this.logger.log('图片上传成功：', imgUrlRes)
    }

    // 创建草稿
    const draftAddRes = await this.wxGzhService.draftAdd(accountId, {
      article_type: 'newspic',
      title,
      content: desc,
      image_info: {
        image_list: wxGzhImgMaterialIdList,
      },
      ...option?.wxGzh,
    })

    if (draftAddRes.errcode) {
      res.message = `稿件草稿创建失败: ${draftAddRes.errmsg}`
      return res
    }

    // 发布
    const freePublishRes = await this.wxGzhService.freePublish(
      accountId,
      draftAddRes.media_id,
    )

    if (freePublishRes.errcode) {
      res.message = `发布任务创建失败: ${freePublishRes.errmsg}`
      return res
    }

    // 完成发布任务
    void this.completePublishTask(publishTask, freePublishRes.publish_id, {
      // workLink: `https://mp.weixin.qq.com/s/${freePublishRes.publish_id}`,
      workLink: '',
      dataOption: {
        publish_id: freePublishRes.publish_id,
        msg_data_id: freePublishRes.msg_data_id,
        article_id: '',
      },
    })
    res.message = '发布成功'
    res.status = 1

    // 进行发布
    return res
  }
}
