import { Injectable, Logger } from '@nestjs/common'
import { AccountType } from '@yikart/aitoearn-server-client'
import * as _ from 'lodash'
import { PinterestService } from '../../../core/plat/pinterest/pinterest.service'
import { PublishStatus, PublishTask } from '../../../libs/database/schema/publishTask.schema'
import { SourceType } from '../../../libs/pinterest/common'
import { DoPubRes } from '../common'
import { PublishBase } from './publish.base'

@Injectable()
export class PinterestPubService extends PublishBase {
  override queueName: string = AccountType.PINTEREST
  private readonly logger = new Logger(PinterestPubService.name)

  constructor(
    readonly pinterestService: PinterestService,
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

  doPub(publishTask: PublishTask): Promise<DoPubRes> {
    return new Promise(async (resolve) => {
      const res: DoPubRes = {
        status: -1,
        message: '任务不存在',
      }
      // 判断是创建图片还是上传视频pin
      const { imgUrlList, videoUrl } = publishTask

      if (videoUrl)
        return this.handleVideoUpload(publishTask, resolve, res)
      if (imgUrlList)
        return this.handlePicUpload(publishTask, resolve, res)
    })
  }

  async handlePicUpload(publishTask: PublishTask, resolve: any, res: DoPubRes) {
    const { desc: description, accountId, imgUrlList, title, option } = publishTask
    if (_.isEmpty(option) || _.isEmpty(option?.pinterest)) {
      return resolve({
        message: '必须要上传board_id',
        status: PublishStatus.FAILED,
      })
    }
    const { boardId: board_id } = option.pinterest
    const body: any
      = {
        accountId,
        board_id,
        description,
        title,
        media_source:
          {
            source_type: SourceType.image_url,
            url: _.first(imgUrlList),
          },
      }
    const data = await this.pinterestService.createPin(body)
    if (_.isEmpty(data)) {
      res.message = '稿件发布失败'
      return resolve(res)
    }
    await this.completePublishTask(publishTask, data.data.id, {
      workLink: `https://www.pinterest.com/pin/${data.data.id}/`,
    })
    res.message = '发布成功'
    res.status = PublishStatus.PUBLISHED
    resolve(res)
  }

  async handleVideoUpload(publishTask: PublishTask, resolve: any, res: DoPubRes) {
    const { desc: description, accountId, coverUrl, title, videoUrl, option } = publishTask
    if (_.isEmpty(option) || _.isEmpty(option?.pinterest) || !_.isString(videoUrl)) {
      return resolve({
        message: '必须要上传board_id',
        status: PublishStatus.FAILED,
      })
    }
    // 上传视频获取到视频id
    const result = await this.pinterestService.uploadVideo(videoUrl, accountId)
    if (_.isEmpty(result) || _.isEmpty(result?.data) || !_.isString(result.data.media_id)) {
      return resolve({
        message: '上传视频失败',
        status: PublishStatus.FAILED,
      })
    }
    const { media_id } = result.data
    const { boardId: board_id } = option.pinterest
    const body: any
      = {
        accountId,
        board_id,
        description,
        title,
        media_source:
        {
          source_type: SourceType.video_id,
          media_id,
          cover_image_url: coverUrl,
        },
      }
    const data = await this.pinterestService.createPin(body)
    if (_.isEmpty(data)) {
      res.message = '稿件发布失败'
      return resolve(res)
    }
    res.message = '发布成功'
    res.status = PublishStatus.PUBLISHED
    await this.completePublishTask(publishTask, data.data.id, {
      workLink: `https://www.pinterest.com/pin/${data.data.id}/`,
    })
    resolve(res)
  }
}
