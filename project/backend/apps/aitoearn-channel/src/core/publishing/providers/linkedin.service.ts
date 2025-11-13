import { Injectable, Logger } from '@nestjs/common'

import { LinkedinService } from '../../../core/platforms/meta/linkedin.service'
import {
  PublishStatus,
  PublishTask,
} from '../../../libs/database/schema/publishTask.schema'
import {
  LinkedinShareCategory,
  LinkedInShareRequest,
  MemberNetworkVisibility,
  ShareMedia,
  ShareMediaCategory,
  UploadRecipe,
} from '../../../libs/linkedin/linkedin.interface'
import { PublishingException } from '../publishing.exception'
import { PublishingTaskResult } from '../publishing.interface'
import { PublishService } from './base.service'

@Injectable()
export class LinkedinPublishService extends PublishService {
  private readonly logger = new Logger(LinkedinPublishService.name, {
    timestamp: true,
  })

  constructor(
    readonly linkedinService: LinkedinService,
  ) {
    super()
  }

  private determinePostCategory(
    publishTask: PublishTask,
  ): LinkedinShareCategory {
    const { imgUrlList, videoUrl } = publishTask
    if (videoUrl) {
      return LinkedinShareCategory.VIDEO
    }
    if (imgUrlList && imgUrlList.length > 0) {
      return LinkedinShareCategory.IMAGE
    }
    return LinkedinShareCategory.TEXT
  }

  private async publishTextPost(publishTask: PublishTask): Promise<PublishingTaskResult> {
    const createShareReq: LinkedInShareRequest = {
      author: this.linkedinService.generateURN(publishTask.uid),
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: this.generatePostMessage(publishTask) || '' },
          shareMediaCategory: ShareMediaCategory.NONE,
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility':
          MemberNetworkVisibility.PUBLIC,
      },
    }
    this.logger.log(`Create share request: ${JSON.stringify(createShareReq)}`)
    const postId = await this.linkedinService.publish(
      publishTask.accountId,
      createShareReq,
    )
    return {
      postId,
      permalink: `https://www.linkedin.com/feed/update/${postId}`,
      status: PublishStatus.PUBLISHED,
    }
  }

  private async publishImagePost(publishTask: PublishTask): Promise<PublishingTaskResult> {
    if (!publishTask.imgUrlList || publishTask.imgUrlList.length < 1) {
      throw new Error('imgUrlList is empty')
    }
    const medias: ShareMedia[] = []
    for (const imgUrl of publishTask.imgUrlList) {
      const resourceId = await this.linkedinService.uploadMedia(
        publishTask.accountId,
        imgUrl,
        UploadRecipe.IMAGE,
      )
      if (!resourceId) {
        throw PublishingException.nonRetryable(`upload image failed: ${imgUrl}`)
      }
      const media: ShareMedia = {
        status: 'READY',
        description: { text: '' },
        media: resourceId,
        title: { text: '' },
      }
      medias.push(media)
    }
    const createShareReq: LinkedInShareRequest = {
      author: this.linkedinService.generateURN(publishTask.uid),
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: this.generatePostMessage(publishTask) || '' },
          shareMediaCategory: ShareMediaCategory.IMAGE,
          media: medias,
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility':
          MemberNetworkVisibility.PUBLIC,
      },
    }
    const postId = await this.linkedinService.publish(
      publishTask.accountId,
      createShareReq,
    )
    return {
      postId,
      permalink: `https://www.linkedin.com/feed/update/${postId}`,
      status: PublishStatus.PUBLISHED,
    }
  }

  private async publishVideoPost(publishTask: PublishTask): Promise<
    PublishingTaskResult
  > {
    if (!publishTask.videoUrl) {
      throw PublishingException.nonRetryable('videoUrl is empty')
    }
    const resourceId = await this.linkedinService.uploadMedia(
      publishTask.accountId,
      publishTask.videoUrl,
      UploadRecipe.VIDEO,
    )
    const createShareReq: LinkedInShareRequest = {
      author: this.linkedinService.generateURN(publishTask.uid),
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: this.generatePostMessage(publishTask) || '' },
          shareMediaCategory: ShareMediaCategory.IMAGE,
          media: [
            {
              status: 'READY',
              description: { text: '' },
              media: resourceId,
              title: { text: '' },
            },
          ],
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility':
          MemberNetworkVisibility.PUBLIC,
      },
    }
    const postId = await this.linkedinService.publish(
      publishTask.accountId,
      createShareReq,
    )
    return {
      postId,
      permalink: `https://www.linkedin.com/feed/update/${postId}`,
      status: PublishStatus.PUBLISHED,
    }
  }

  async immediatePublish(publishTask: PublishTask): Promise<PublishingTaskResult> {
    const category = this.determinePostCategory(publishTask)
    switch (category) {
      case LinkedinShareCategory.TEXT:
        return await this.publishTextPost(publishTask)
      case LinkedinShareCategory.IMAGE:
        return await this.publishImagePost(publishTask)
      case LinkedinShareCategory.VIDEO:
        return await this.publishVideoPost(publishTask)
      default:
        throw PublishingException.nonRetryable('Unsupported post category')
    }
  }
}
