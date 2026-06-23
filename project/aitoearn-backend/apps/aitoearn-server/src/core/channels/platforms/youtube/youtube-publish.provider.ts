import type { ChannelPlatformErrorContext } from '../platforms.exception'
import type {
  NormalizedPublishTask,
  PublishNormalizeInput,
  PublishProvider,
  PublishProviderResult,
  PublishPublishInput,
  PublishUpdateInput,
  PublishValidateInput,
  PublishValidationResult,
  PublishVerifyInput,
  PublishVerifyResult,
} from '../platforms.interface'
import type { YoutubeOption } from './youtube.schema'
import { Injectable, Logger } from '@nestjs/common'
import { AccountType, ResponseCode } from '@yikart/common'
import { PlatformErrorCategory } from '../platforms.exception'
import { parseTopicsFromBody, PublishValidationField, PublishValidationIssueCode, stripTopicsFromBody } from '../publish.schema'
import { YOUTUBE_METADATA } from './youtube.constants'
import { YouTubePlatformException } from './youtube.exception'
import { YoutubePrivacyStatus } from './youtube.schema'
import { YoutubeService } from './youtube.service'

@Injectable()
export class YoutubePublishProvider implements PublishProvider<YoutubeOption, undefined> {
  private readonly logger = new Logger(YoutubePublishProvider.name)

  readonly platform = AccountType.YouTube

  constructor(private readonly youtubeService: YoutubeService) {}

  async validate(input: PublishValidateInput<YoutubeOption>): Promise<PublishValidationResult> {
    const option: Partial<YoutubeOption> = input.option ?? {}
    const issues: PublishValidationResult['issues'] = []
    if (option.publishAt && option.privacyStatus !== YoutubePrivacyStatus.Private) {
      issues.push({
        code: PublishValidationIssueCode.InvalidCombination,
        path: ['option', 'publishAt'],
        params: {
          field: PublishValidationField.Option,
          publishAt: option.publishAt,
          privacyStatus: option.privacyStatus,
        },
      })
    }

    const topics = parseTopicsFromBody(input.content.body)
    const maxTopicTotalLength = YOUTUBE_METADATA.topic.maxTotalLength
    if (maxTopicTotalLength !== undefined && topics.join(',').length > maxTopicTotalLength) {
      issues.push({
        code: PublishValidationIssueCode.TooBig,
        path: ['content', 'topics'],
        params: { field: PublishValidationField.Topic, maximum: maxTopicTotalLength, unit: 'characters' },
      })
    }

    return { valid: issues.length === 0, issues: issues.length ? issues : undefined }
  }

  async normalize(input: PublishNormalizeInput<YoutubeOption>): Promise<NormalizedPublishTask<YoutubeOption>> {
    return {
      content: input.content,
      option: input.option,
    }
  }

  private async assertCategoryAssignable(
    accessToken: string,
    categoryId: string | undefined,
    context: ChannelPlatformErrorContext,
  ): Promise<void> {
    if (!categoryId) {
      return
    }

    const categories = await this.youtubeService.listVideoCategories(accessToken, { id: categoryId })
    const category = categories.find(item => item.id === categoryId)
    if (category?.snippet?.assignable === true) {
      return
    }

    throw YouTubePlatformException.invalidCategoryId({
      code: ResponseCode.ChannelPlatformApiFailed,
      category: PlatformErrorCategory.Validation,
      context: {
        ...context,
        metadata: {
          ...context.metadata,
          categoryId,
        },
      },
    })
  }

  async publish(input: PublishPublishInput<YoutubeOption>): Promise<PublishProviderResult<undefined>> {
    const channelId = input.credential.account
    if (!channelId) {
      throw YouTubePlatformException.validation({
        code: ResponseCode.ChannelPlatformAccountMissing,
        category: PlatformErrorCategory.Auth,
        context: {
          endpoint: 'publish.channel',
          taskId: input.taskId,
          accountId: input.accountId,
        },
      })
    }

    const video = input.content.media[0]
    if (!video) {
      const exception = YouTubePlatformException.validation({
        code: ResponseCode.ChannelPlatformMediaUnsupported,
        category: PlatformErrorCategory.MediaProcessingFailed,
        context: { endpoint: 'publish', taskId: input.taskId, accountId: input.accountId },
      })
      this.logger.warn(exception, 'YouTube publish video missing')
      throw exception
    }

    const option: Partial<YoutubeOption> = input.option ?? {}
    const privacyStatus = option.privacyStatus ?? YoutubePrivacyStatus.Public
    await this.assertCategoryAssignable(input.credential.accessToken, option.categoryId, {
      endpoint: 'publish.category',
      taskId: input.taskId,
      accountId: input.accountId,
    })

    const result = await this.youtubeService.uploadVideo(input.credential.accessToken, {
      title: input.content.title ?? 'Untitled',
      description: stripTopicsFromBody(input.content.body),
      tags: parseTopicsFromBody(input.content.body),
      privacyStatus,
      videoUrl: video.url,
      categoryId: option.categoryId,
      publishAt: option.publishAt,
      license: option.license,
      embeddable: option.embeddable,
      notifySubscribers: option.notifySubscribers,
      selfDeclaredMadeForKids: option.selfDeclaredMadeForKids,
      containsSyntheticMedia: option.containsSyntheticMedia,
    })

    const uploadedVideo = await this.youtubeService.getVideoDetails(input.credential.accessToken, result.videoId)
    if (uploadedVideo.channelId !== channelId) {
      throw YouTubePlatformException.validation({
        code: ResponseCode.ChannelPlatformResponseInvalid,
        category: PlatformErrorCategory.Validation,
        context: {
          endpoint: 'publish.verifyChannel',
          taskId: input.taskId,
          accountId: input.accountId,
          platformWorkId: result.videoId,
          metadata: {
            expectedChannelId: channelId,
            actualChannelId: uploadedVideo.channelId,
          },
        },
      })
    }

    // Set thumbnail if provided
    if (input.content.cover?.url) {
      try {
        await this.youtubeService.setThumbnail(
          input.credential.accessToken,
          result.videoId,
          input.content.cover.url,
        )
      }
      catch (err) {
        this.logger.warn(err, `Failed to set thumbnail for video ${result.videoId}`)
      }
    }

    return {
      status: 200,
      platformWorkId: result.videoId,
      permalink: `https://www.youtube.com/watch?v=${result.videoId}`,
    }
  }

  async verify(input: PublishVerifyInput<undefined>): Promise<PublishVerifyResult> {
    try {
      const channelId = input.credential.account
      if (!channelId) {
        return { published: false }
      }
      const video = await this.youtubeService.getVideoDetails(
        input.credential.accessToken,
        input.platformWorkId,
      )
      if (video.channelId !== channelId) {
        return { published: false }
      }

      return {
        published: true,
        platformWorkId: input.platformWorkId,
        permalink: `https://www.youtube.com/watch?v=${input.platformWorkId}`,
      }
    }
    catch (err) {
      this.logger.warn(err, `Failed to verify YouTube video ${input.platformWorkId}`)
      return { published: false }
    }
  }

  async update(input: PublishUpdateInput<YoutubeOption>): Promise<PublishProviderResult<undefined>> {
    const option: Partial<YoutubeOption> = input.option ?? {}
    await this.assertCategoryAssignable(input.credential.accessToken, option.categoryId, {
      endpoint: 'update.category',
      taskId: input.taskId,
      platformWorkId: input.platformWorkId,
    })

    await this.youtubeService.updateVideo(input.credential.accessToken, input.platformWorkId, {
      title: input.content.title,
      description: stripTopicsFromBody(input.content.body),
      tags: parseTopicsFromBody(input.content.body),
      privacyStatus: option.privacyStatus,
      categoryId: option.categoryId,
      publishAt: option.publishAt,
      license: option.license,
      embeddable: option.embeddable,
      selfDeclaredMadeForKids: option.selfDeclaredMadeForKids,
      containsSyntheticMedia: option.containsSyntheticMedia,
    })

    return {
      status: 200,
      platformWorkId: input.platformWorkId,
    }
  }
}
