import { Injectable, Logger } from '@nestjs/common'
import { AssetsService } from '@yikart/assets'
import {
  PublishRecord,
  PublishStatus,
} from '@yikart/mongodb'
import {
  LinkedinShareCategory,
  LinkedInShareRequest,
  MemberNetworkVisibility,
  ShareMedia,
  ShareMediaCategory,
  UploadRecipe,
} from '../../libs/linkedin/linkedin.interface'
import { LinkedinService } from '../../platforms/meta/linkedin.service'
import { PublishingException } from '../publishing.exception'
import { PublishingTaskResult, VerifyPublishResult } from '../publishing.interface'
import { PublishService } from './base.service'

@Injectable()
export class LinkedinPublishService extends PublishService {
  private readonly logger = new Logger(LinkedinPublishService.name, {
    timestamp: true,
  })

  constructor(
    readonly linkedinService: LinkedinService,
    private readonly assetsService: AssetsService,
  ) {
    super()
  }

  private determinePostCategory(
    publishTask: PublishRecord,
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

  private async publishTextPost(publishTask: PublishRecord): Promise<PublishingTaskResult> {
    if (!publishTask.uid || !publishTask.accountId) {
      throw PublishingException.nonRetryable('publishTask data error')
    }
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

  private async publishImagePost(publishTask: PublishRecord): Promise<PublishingTaskResult> {
    if (!publishTask.accountId || !publishTask.uid) {
      throw new Error('publishTask date error')
    }
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

  private async publishVideoPost(publishTask: PublishRecord): Promise<
    PublishingTaskResult
  > {
    if (!publishTask.accountId || !publishTask.uid) {
      throw PublishingException.nonRetryable('publishTask data error')
    }
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
          shareMediaCategory: ShareMediaCategory.VIDEO,
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

  async immediatePublish(publishTask: PublishRecord): Promise<PublishingTaskResult> {
    if (publishTask.videoUrl)
      publishTask.videoUrl = this.assetsService.buildUrl(publishTask.videoUrl)
    publishTask.imgUrlList = publishTask.imgUrlList?.map(url => this.assetsService.buildUrl(url)) || []
    publishTask.coverUrl = publishTask.coverUrl ? this.assetsService.buildUrl(publishTask.coverUrl) : undefined
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

  async verifyAndCompletePublish(publishRecord: PublishRecord): Promise<VerifyPublishResult> {
    try {
      // LinkedIn 由于缺少获取帖子状态的API，这里直接返回成功
      // 帖子链接已在发布时生成
      if (publishRecord.dataId) {
        const workLink = `https://www.linkedin.com/feed/update/${publishRecord.dataId}`
        return {
          success: true,
          workLink,
        }
      }

      return {
        success: false,
        errorMsg: '发布记录缺少帖子ID',
      }
    }
    catch (error) {
      this.logger.error(`验证 LinkedIn 发布状态失败: ${(error as Error).message}`, (error as Error).stack)
      return {
        success: false,
        errorMsg: `验证发布状态失败: ${(error as Error).message}`,
      }
    }
  }
}
