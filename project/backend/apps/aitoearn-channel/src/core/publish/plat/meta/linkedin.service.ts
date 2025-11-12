import { Injectable, Logger } from '@nestjs/common'

import { LinkedinService } from '../../../../core/plat/meta/linkedin.service'
import {
  PublishStatus,
  PublishTask,
} from '../../../../libs/database/schema/publishTask.schema'
import {
  LinkedinShareCategory,
  LinkedInShareRequest,
  MemberNetworkVisibility,
  ShareMedia,
  ShareMediaCategory,
  UploadRecipe,
} from '../../../../libs/linkedin/linkedin.interface'
import { DoPubRes } from '../../common'
import { PublishBase } from '../publish.base'

@Injectable()
export class LinkedinPublishService extends PublishBase {
  override queueName: string = 'linkedin'

  private readonly logger = new Logger(LinkedinPublishService.name, {
    timestamp: true,
  })

  constructor(
    readonly linkedinService: LinkedinService,
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

  private generatePostMessage(publishTask: PublishTask): string {
    if (!publishTask) {
      return ''
    }
    if (publishTask.topics && publishTask.topics.length > 0) {
      return `${publishTask.desc || ''} #${publishTask.topics.join(' #')}`
    }
    return publishTask.desc || ''
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

  private async publishTextPost(publishTask: PublishTask): Promise<string> {
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
    return await this.linkedinService.publish(
      publishTask.accountId,
      createShareReq,
    )
  }

  private async publishImagePost(publishTask: PublishTask): Promise<string> {
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
        throw new Error(`upload image failed: ${imgUrl}`)
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
    return await this.linkedinService.publish(
      publishTask.accountId,
      createShareReq,
    )
  }

  private async publishVideoPost(publishTask: PublishTask): Promise<string> {
    if (!publishTask.videoUrl) {
      throw new Error('视频 URL 不能为空')
    }
    const resourceId = await this.linkedinService.uploadMedia(
      publishTask.accountId,
      publishTask.videoUrl,
      UploadRecipe.VIDEO,
    )
    if (!resourceId) {
      throw new Error(`upload video failed: ${publishTask.videoUrl}`)
    }
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
    return await this.linkedinService.publish(
      publishTask.accountId,
      createShareReq,
    )
  }

  async doPub(publishTask: PublishTask): Promise<DoPubRes> {
    const res: DoPubRes = {
      status: -1,
      message: '任务不存在',
    }
    try {
      const category = this.determinePostCategory(publishTask)
      let resourceId: string | undefined
      if (category === LinkedinShareCategory.TEXT) {
        resourceId = await this.publishTextPost(publishTask)
      }
      if (category === LinkedinShareCategory.IMAGE) {
        resourceId = await this.publishImagePost(publishTask)
      }
      if (category === LinkedinShareCategory.VIDEO) {
        resourceId = await this.publishVideoPost(publishTask)
      }
      if (resourceId) {
        await this.completePublishTask(publishTask, resourceId, {
          workLink: `https://www.linkedin.com/feed/update/${resourceId}`,
        })
        res.status = PublishStatus.PUBLISHED
        res.message = '发布成功'
        return res
      }
      res.status = PublishStatus.FAILED
      res.message = 'failed to get resourceId'
      return res
    }
    catch (error) {
      this.logger.error(`发布任务失败: ${error.message}`, error.stack)
      res.message = `发布任务失败: ${error.message}`
      return res
    }
  }
}
