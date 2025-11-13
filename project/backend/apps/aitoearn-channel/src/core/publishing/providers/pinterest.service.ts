import { Injectable, Logger } from '@nestjs/common'
import { PublishStatus, PublishTask } from '../../../libs/database/schema/publishTask.schema'
import { CreatePinBody, SourceType } from '../../../libs/pinterest/common'
import { PinterestService } from '../../platforms/pinterest/pinterest.service'
import { PublishingException } from '../publishing.exception'
import { PublishingTaskResult } from '../publishing.interface'
import { PublishService } from './base.service'

@Injectable()
export class PinterestPubService extends PublishService {
  private readonly logger = new Logger(PinterestPubService.name)

  constructor(
    readonly pinterestService: PinterestService,
  ) {
    super()
  }

  async publishImagePost(boardId: string, publishTask: PublishTask): Promise<PublishingTaskResult> {
    const data: CreatePinBody = {
      accountId: publishTask.accountId,
      board_id: boardId,
      description: publishTask.desc,
      title: publishTask.title,
      media_source:
      {
        source_type: SourceType.image_url,
        url: publishTask.imgUrlList?.[0],
      },
    }
    const resp = await this.pinterestService.createPin(data)
    return {
      postId: resp.id,
      permalink: `https://www.pinterest.com/pin/${resp.id}/`,
      status: PublishStatus.PUBLISHED,
    }
  }

  async publishVideoPost(boardId: string, publishTask: PublishTask): Promise<PublishingTaskResult> {
    const result = await this.pinterestService.uploadVideo(publishTask.videoUrl, publishTask.accountId)
    const body: CreatePinBody
      = {
        accountId: publishTask.accountId,
        board_id: boardId,
        description: publishTask.desc,
        title: publishTask.title,
        media_source:
      {
        source_type: SourceType.video_id,
        media_id: result.data.media_id,
        cover_image_url: publishTask.coverUrl,
      },
      }
    const resp = await this.pinterestService.createPin(body)
    return {
      postId: resp.id,
      permalink: `https://www.pinterest.com/pin/${resp.id}/`,
      status: PublishStatus.PUBLISHED,
    }
  }

  async immediatePublish(publishTask: PublishTask): Promise<PublishingTaskResult> {
    const boardId = publishTask.option?.pinterest?.boardId
    if (!boardId) {
      throw PublishingException.nonRetryable('Pinterest boardId is required')
    }
    if (publishTask.videoUrl) {
      return this.publishVideoPost(boardId, publishTask)
    }
    return this.publishImagePost(boardId, publishTask)
  }
}
