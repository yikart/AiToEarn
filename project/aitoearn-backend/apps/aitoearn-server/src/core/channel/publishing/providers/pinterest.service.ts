import { Injectable, Logger } from '@nestjs/common'
import { AssetsService } from '@yikart/assets'
import { PublishRecord, PublishStatus } from '@yikart/mongodb'
import { CreatePinBody, SourceType } from '../../libs/pinterest/common'
import { PinterestPin } from '../../libs/pinterest/pinterest.interfaces'
import { PinterestService } from '../../platforms/pinterest/pinterest.service'
import { PublishingException } from '../publishing.exception'
import { PublishingTaskResult, VerifyPublishResult } from '../publishing.interface'
import { PublishService } from './base.service'

@Injectable()
export class PinterestPubService extends PublishService {
  private readonly logger = new Logger(PinterestPubService.name)

  constructor(
    readonly pinterestService: PinterestService,
    private readonly assetsService: AssetsService,
  ) {
    super()
  }

  async publishImagePost(boardId: string, publishTask: PublishRecord): Promise<PublishingTaskResult> {
    this.logger.debug({
      path: '--- pinterest publishImagePost --- 1 入参',
      data: {
        boardId,
        accountId: publishTask.accountId,
        taskId: publishTask.id,
        imgUrl: publishTask.imgUrlList?.[0],
      },
    })

    const data: CreatePinBody = {
      accountId: publishTask.accountId,
      board_id: boardId,
      description: this.generatePostMessage(publishTask),
      title: publishTask.title,
      media_source:
      {
        source_type: SourceType.image_url,
        url: publishTask.imgUrlList?.[0],
      },
    }

    this.logger.debug({
      path: '--- pinterest publishImagePost --- 2 createPin 请求前',
      data: {
        createPinBody: data,
      },
    })

    let resp: PinterestPin
    try {
      resp = await this.pinterestService.createPin(data)
      this.logger.debug({
        path: '--- pinterest publishImagePost --- 3 createPin 成功',
        data: {
          pinId: resp.id,
          resp,
        },
      })
    }
    catch (error: any) {
      this.logger.error({
        path: '--- pinterest publishImagePost --- 3 createPin 失败',
        data: {
          errorMessage: error?.message,
          errorName: error?.name,
          errorStatus: error?.status,
          rawError: error?.rawError,
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        },
      })
      throw error
    }

    return {
      postId: resp.id,
      permalink: `https://www.pinterest.com/pin/${resp.id}/`,
      status: PublishStatus.PUBLISHED,
    }
  }

  async publishVideoPost(boardId: string, publishTask: PublishRecord): Promise<PublishingTaskResult> {
    if (!publishTask.accountId || !publishTask.uid) {
      throw new Error('publishTask date error')
    }
    this.logger.debug({
      path: '--- pinterest publishVideoPost --- 1 入参',
      data: {
        boardId,
        accountId: publishTask.accountId,
        taskId: publishTask.id,
        videoUrl: publishTask.videoUrl,
        coverUrl: publishTask.coverUrl,
      },
    })

    let result: { data: { media_id: string }, code: number }
    try {
      result = await this.pinterestService.uploadVideo(publishTask.videoUrl || '', publishTask.accountId)
      this.logger.debug({
        path: '--- pinterest publishVideoPost --- 2 uploadVideo 成功',
        data: {
          mediaId: result?.data?.media_id,
          result,
        },
      })
    }
    catch (error: any) {
      this.logger.error({
        path: '--- pinterest publishVideoPost --- 2 uploadVideo 失败',
        data: {
          errorMessage: error?.message,
          errorName: error?.name,
          errorStatus: error?.status,
          rawError: error?.rawError,
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        },
      })
      throw error
    }

    const body: CreatePinBody = {
      accountId: publishTask.accountId,
      board_id: boardId,
      description: this.generatePostMessage(publishTask),
      title: publishTask.title,
      media_source: {
        source_type: SourceType.video_id,
        media_id: result.data.media_id,
        cover_image_url: publishTask.coverUrl,
      },
    }

    this.logger.debug({
      path: '--- pinterest publishVideoPost --- 3 createPin 请求前',
      data: {
        createPinBody: body,
      },
    })

    let resp: PinterestPin
    try {
      resp = await this.pinterestService.createPin(body)
      this.logger.debug({
        path: '--- pinterest publishVideoPost --- 4 createPin 成功',
        data: {
          pinId: resp.id,
          resp,
        },
      })
    }
    catch (error: any) {
      this.logger.error({
        path: '--- pinterest publishVideoPost --- 4 createPin 失败',
        data: {
          errorMessage: error?.message,
          errorName: error?.name,
          errorStatus: error?.status,
          rawError: error?.rawError,
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        },
      })
      throw error
    }

    this.logger.debug({
      path: '--- pinterest publishVideoPost --- 5 完成',
      data: {
        taskId: publishTask.id,
        pinId: resp.id,
      },
    })

    return {
      postId: resp.id,
      permalink: `https://www.pinterest.com/pin/${resp.id}/`,
      status: PublishStatus.PUBLISHED,
    }
  }

  async immediatePublish(publishTask: PublishRecord): Promise<PublishingTaskResult> {
    this.logger.debug({
      path: '--- pinterest immediatePublish --- 1 入参',
      data: {
        taskId: publishTask.id,
        accountId: publishTask.accountId,
        videoUrl: publishTask.videoUrl,
        imgUrlList: publishTask.imgUrlList,
        coverUrl: publishTask.coverUrl,
        option: publishTask.option,
      },
    })

    if (publishTask.videoUrl)
      publishTask.videoUrl = this.assetsService.buildUrl(publishTask.videoUrl)
    publishTask.imgUrlList = publishTask.imgUrlList?.map(url => this.assetsService.buildUrl(url)) || []
    publishTask.coverUrl = publishTask.coverUrl ? this.assetsService.buildUrl(publishTask.coverUrl) : undefined
    const boardId = publishTask.option?.pinterest?.boardId

    this.logger.debug({
      path: '--- pinterest immediatePublish --- 2 URL 转换后',
      data: {
        videoUrl: publishTask.videoUrl,
        imgUrlList: publishTask.imgUrlList,
        coverUrl: publishTask.coverUrl,
        boardId,
      },
    })

    if (!boardId) {
      this.logger.error({
        path: '--- pinterest immediatePublish --- 2 boardId 缺失',
        data: {
          taskId: publishTask.id,
          option: publishTask.option,
        },
      })
      throw PublishingException.nonRetryable('Pinterest boardId is required')
    }

    if (publishTask.videoUrl) {
      this.logger.debug({
        path: '--- pinterest immediatePublish --- 3 调用 publishVideoPost',
        data: { boardId, taskId: publishTask.id },
      })
      return this.publishVideoPost(boardId, publishTask)
    }

    this.logger.debug({
      path: '--- pinterest immediatePublish --- 3 调用 publishImagePost',
      data: { boardId, taskId: publishTask.id },
    })
    return this.publishImagePost(boardId, publishTask)
  }

  async verifyAndCompletePublish(publishRecord: PublishRecord): Promise<VerifyPublishResult> {
    if (!publishRecord.dataId || !publishRecord.accountId) {
      this.logger.error({
        path: '--- pinterest verifyAndCompletePublish --- 1 缺少必要参数',
        data: { publishRecord },
      })
      return {
        success: false,
        errorMsg: '缺少必要参数',
      }
    }
    try {
      // Pinterest 通过 API 获取 Pin 信息验证发布状态
      const pinInfo = await this.pinterestService.getPinById(
        publishRecord.dataId || '',
        publishRecord.accountId,
      )

      if (pinInfo && pinInfo.id) {
        const workLink = `https://www.pinterest.com/pin/${pinInfo.id}/`
        return {
          success: true,
          workLink,
        }
      }

      return {
        success: false,
        errorMsg: 'Pinterest Pin 不存在或已被删除',
      }
    }
    catch (error) {
      this.logger.error(`验证 Pinterest 发布状态失败: ${(error as Error).message}`, (error as Error).stack)
      return {
        success: false,
        errorMsg: `验证发布状态失败: ${(error as Error).message}`,
      }
    }
  }
}
