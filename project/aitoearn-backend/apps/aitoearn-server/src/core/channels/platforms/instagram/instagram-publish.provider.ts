import type { NormalizedPublishTask, PlatformMediaRules, PublishCancelInput, PublishCancelResult, PublishMediaInput, PublishNormalizeInput, PublishProvider, PublishProviderResult, PublishPublishInput, PublishValidateInput, PublishValidationResult, PublishVerifyInput, PublishVerifyResult } from '../platforms.interface'
import type { PublishValidationIssue } from '../publish.schema'
import type { InstagramOption, InstagramPublishDataOption } from './instagram.schema'
import { Injectable, Logger } from '@nestjs/common'
import { AccountType, poll, ResponseCode } from '@yikart/common'
import { PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'
import {

  PublishMediaType,

} from '../platforms.interface'
import { hasUrlPathExtension } from '../platforms.utils'
import { PublishValidationCombination, PublishValidationField, PublishValidationIssueCode } from '../publish.schema'
import { INSTAGRAM_FEED_MEDIA_RULES, INSTAGRAM_REELS_MEDIA_RULES, INSTAGRAM_STORY_MEDIA_RULES } from './instagram.constants'
import { InstagramPlatformException } from './instagram.exception'
import { InstagramMediaContainerStatusCode } from './instagram.interface'
import { InstagramMediaType, InstagramPublishDataOptionSchema } from './instagram.schema'
import { InstagramService } from './instagram.service'

@Injectable()
export class InstagramPublishProvider implements PublishProvider<InstagramOption, InstagramPublishDataOption> {
  private readonly logger = new Logger(InstagramPublishProvider.name)

  readonly platform = AccountType.Instagram

  constructor(private readonly instagramService: InstagramService) {}

  async validate(input: PublishValidateInput<InstagramOption>): Promise<PublishValidationResult> {
    const issues: PublishValidationIssue[] = []

    const imageCount = input.content.media.filter(m => this.isImage(m)).length
    const videoCount = input.content.media.filter(m => this.isVideo(m)).length
    const mediaType = this.resolveMediaType(input)
    issues.push(...this.validateMediaType(mediaType, imageCount, videoCount))

    const body = input.content.body ?? ''
    const hashtagCount = body.match(/#([\w\p{Script=Han}]+)/gu)?.length ?? 0
    if (hashtagCount > 30) {
      issues.push({
        code: PublishValidationIssueCode.TooBig,
        path: ['content', 'topics'],
        params: { field: PublishValidationField.Topic, current: hashtagCount, maximum: 30, unit: 'items' },
      })
    }

    const mentionCount = body.match(/(^|[^\w.])@([\w.]+)/g)?.length ?? 0
    if (mentionCount > 20) {
      issues.push({
        code: PublishValidationIssueCode.TooBig,
        path: ['content', 'body'],
        params: { field: PublishValidationField.Body, current: mentionCount, maximum: 20, unit: 'items' },
      })
    }

    return { valid: issues.length === 0, issues: issues.length ? issues : undefined }
  }

  resolveMediaRules(input: PublishValidateInput<InstagramOption>): PlatformMediaRules {
    const mediaType = this.resolveMediaType(input)
    if (mediaType === InstagramMediaType.Reels) {
      return INSTAGRAM_REELS_MEDIA_RULES
    }
    if (mediaType === InstagramMediaType.Stories) {
      return INSTAGRAM_STORY_MEDIA_RULES
    }
    return INSTAGRAM_FEED_MEDIA_RULES
  }

  async normalize(input: PublishNormalizeInput<InstagramOption>): Promise<NormalizedPublishTask<InstagramOption>> {
    return {
      content: input.content,
      option: input.option,
    }
  }

  async publish(input: PublishPublishInput<InstagramOption>): Promise<PublishProviderResult<InstagramPublishDataOption>> {
    const igUserId = input.credential.platformUid
    if (!igUserId) {
      throw InstagramPlatformException.validation({
        code: ResponseCode.ChannelPlatformAccountMissing,
        category: PlatformErrorCategory.Auth,
        context: {
          endpoint: 'publish',
          taskId: input.taskId,
          accountId: input.accountId,
        },
      })
    }
    const accessToken = input.credential.accessToken
    const mediaType = this.resolveMediaType(input)

    try {
      if (mediaType === InstagramMediaType.Carousel) {
        return await this.publishCarousel(accessToken, igUserId, input)
      }

      if (mediaType === InstagramMediaType.Reels) {
        return await this.publishVideo(accessToken, igUserId, input, mediaType)
      }

      if (mediaType === InstagramMediaType.Stories) {
        return await this.publishStory(accessToken, igUserId, input)
      }

      return await this.publishSingleImage(accessToken, igUserId, input)
    }
    catch (err) {
      const rawError = err instanceof InstagramPlatformException
        && err.platformCause?.raw
        && typeof err.platformCause.raw === 'object'
        ? (err.platformCause.raw as { error?: { error_subcode?: number, fbtrace_id?: string } }).error
        : undefined

      if (!(err instanceof InstagramPlatformException) || rawError?.error_subcode !== 2207069) {
        throw err
      }

      let limit: Awaited<ReturnType<InstagramService['getContentPublishingLimit']>> | undefined
      try {
        limit = await this.instagramService.getContentPublishingLimit(accessToken, igUserId)
      }
      catch (limitErr) {
        this.logger.warn(limitErr, `Failed to fetch Instagram content publishing limit for ${igUserId}`)
      }

      throw new InstagramPlatformException({
        code: ResponseCode.ChannelPlatformApiFailed,
        category: PlatformErrorCategory.Quota,
        context: {
          ...err.context,
          taskId: input.taskId,
          accountId: input.accountId,
        },
        cause: {
          type: err.platformCause?.type ?? PlatformErrorCauseType.Platform,
          httpStatus: err.platformCause?.httpStatus,
          platformCode: err.platformCause?.platformCode,
          raw: err.platformCause?.raw,
          quota: {
            usage: limit?.quotaUsage,
            total: limit?.quotaTotal,
            durationSeconds: limit?.quotaDuration,
            fbtraceId: rawError.fbtrace_id,
          },
        },
        retryable: false,
      })
    }
  }

  async verify(input: PublishVerifyInput<InstagramPublishDataOption>): Promise<PublishVerifyResult> {
    try {
      const dataOption = InstagramPublishDataOptionSchema.parse(input.dataOption ?? {})
      const mediaInfo = await this.instagramService.getMediaInfo(
        input.credential.accessToken,
        input.platformWorkId,
      )

      if (!mediaInfo.permalink) {
        this.logger.warn({
          platformWorkId: mediaInfo.id,
          containerId: dataOption.containerId,
        }, `Instagram media ${mediaInfo.id} has no permalink yet`)
        return {
          published: false,
          platformWorkId: mediaInfo.id,
        }
      }

      return {
        published: true,
        platformWorkId: mediaInfo.id,
        permalink: mediaInfo.permalink,
      }
    }
    catch (err) {
      this.logger.warn(err, `Failed to verify Instagram media ${input.platformWorkId}`)
      return { published: false }
    }
  }

  async cancel(input: PublishCancelInput): Promise<PublishCancelResult> {
    try {
      await this.instagramService.deleteMedia(
        input.credential.accessToken,
        input.platformWorkId,
      )
      return { canceled: true }
    }
    catch (err) {
      this.logger.error(err, `Failed to cancel Instagram media ${input.platformWorkId}`)
      return { canceled: false }
    }
  }

  private async publishSingleImage(
    accessToken: string,
    igUserId: string,
    input: PublishPublishInput<InstagramOption>,
  ): Promise<PublishProviderResult<InstagramPublishDataOption>> {
    const imageUrl = input.content.media[0]?.url
    if (!imageUrl) {
      throw InstagramPlatformException.validation({
        code: ResponseCode.ChannelPlatformMediaUnsupported,
        category: PlatformErrorCategory.MediaProcessingFailed,
        context: {
          endpoint: 'publishSingleImage',
          taskId: input.taskId,
          accountId: input.accountId,
        },
      })
    }

    const containerId = await this.instagramService.createMediaContainer(
      accessToken,
      igUserId,
      {
        imageUrl,
        caption: input.content.body,
      },
    )

    await this.waitForContainerReady(accessToken, containerId)

    const result = await this.instagramService.publishContainer(
      accessToken,
      igUserId,
      containerId,
    )

    const permalink = await this.fetchPermalink(accessToken, result.id)
    const dataOption = InstagramPublishDataOptionSchema.parse({
      containerId,
      mediaType: InstagramMediaType.Image,
    } satisfies InstagramPublishDataOption)

    return {
      status: 200,
      platformWorkId: result.id,
      permalink,
      dataOption,
    }
  }

  private async publishCarousel(
    accessToken: string,
    igUserId: string,
    input: PublishPublishInput<InstagramOption>,
  ): Promise<PublishProviderResult<InstagramPublishDataOption>> {
    const childrenIds: string[] = []

    for (const media of input.content.media) {
      if (!this.isImage(media)) {
        continue
      }

      const childId = await this.instagramService.createMediaContainer(
        accessToken,
        igUserId,
        {
          imageUrl: media.url,
          isCarouselItem: true,
        },
      )
      childrenIds.push(childId)
    }

    if (!childrenIds.length) {
      throw InstagramPlatformException.validation({
        code: ResponseCode.ChannelPlatformMediaUnsupported,
        category: PlatformErrorCategory.MediaProcessingFailed,
        context: {
          endpoint: 'publishCarousel',
          taskId: input.taskId,
          accountId: input.accountId,
        },
      })
    }

    const carouselId = await this.instagramService.createCarouselContainer(
      accessToken,
      igUserId,
      childrenIds,
      input.content.body,
    )

    await this.waitForContainerReady(accessToken, carouselId)

    const result = await this.instagramService.publishContainer(
      accessToken,
      igUserId,
      carouselId,
    )

    const permalink = await this.fetchPermalink(accessToken, result.id)
    const dataOption = InstagramPublishDataOptionSchema.parse({
      containerId: carouselId,
      childContainerIds: childrenIds,
      mediaType: InstagramMediaType.Carousel,
    } satisfies InstagramPublishDataOption)

    return {
      status: 200,
      platformWorkId: result.id,
      permalink,
      dataOption,
    }
  }

  private async publishVideo(
    accessToken: string,
    igUserId: string,
    input: PublishPublishInput<InstagramOption>,
    mediaType: InstagramMediaType.Reels,
  ): Promise<PublishProviderResult<InstagramPublishDataOption>> {
    const videoUrl = input.content.media.find(m => this.isVideo(m))?.url
    if (!videoUrl) {
      throw InstagramPlatformException.validation({
        code: ResponseCode.ChannelPlatformMediaUnsupported,
        category: PlatformErrorCategory.MediaProcessingFailed,
        context: {
          endpoint: 'publishVideo',
          taskId: input.taskId,
          accountId: input.accountId,
        },
      })
    }

    const containerId = await this.instagramService.createMediaContainer(
      accessToken,
      igUserId,
      {
        videoUrl,
        caption: input.content.body,
        coverUrl: input.content.cover?.url ?? input.option?.cover_url,
        mediaType,
      },
    )

    await this.waitForContainerReady(accessToken, containerId)

    const result = await this.instagramService.publishContainer(
      accessToken,
      igUserId,
      containerId,
    )

    const permalink = await this.fetchPermalink(accessToken, result.id)
    const dataOption = InstagramPublishDataOptionSchema.parse({
      containerId,
      mediaType,
    } satisfies InstagramPublishDataOption)

    return {
      status: 200,
      platformWorkId: result.id,
      permalink,
      dataOption,
    }
  }

  private async publishStory(
    accessToken: string,
    igUserId: string,
    input: PublishPublishInput<InstagramOption>,
  ): Promise<PublishProviderResult<InstagramPublishDataOption>> {
    const imageUrl = input.content.media.find(m => this.isImage(m))?.url
    const videoUrl = input.content.media.find(m => this.isVideo(m))?.url
    if (!imageUrl && !videoUrl) {
      throw InstagramPlatformException.validation({
        code: ResponseCode.ChannelPlatformMediaUnsupported,
        category: PlatformErrorCategory.MediaProcessingFailed,
        context: {
          endpoint: 'publishStory',
          taskId: input.taskId,
          accountId: input.accountId,
        },
      })
    }

    const containerId = await this.instagramService.createMediaContainer(
      accessToken,
      igUserId,
      {
        imageUrl,
        videoUrl,
        caption: input.content.body,
        mediaType: InstagramMediaType.Stories,
      },
    )

    await this.waitForContainerReady(accessToken, containerId)

    const result = await this.instagramService.publishContainer(
      accessToken,
      igUserId,
      containerId,
    )

    const permalink = await this.fetchPermalink(accessToken, result.id)
    const dataOption = InstagramPublishDataOptionSchema.parse({
      containerId,
      mediaType: InstagramMediaType.Stories,
    } satisfies InstagramPublishDataOption)

    return {
      status: 200,
      platformWorkId: result.id,
      permalink,
      dataOption,
    }
  }

  private async waitForContainerReady(
    accessToken: string,
    containerId: string,
  ): Promise<void> {
    let lastStatus: Awaited<ReturnType<InstagramService['getMediaContainerStatus']>> | undefined

    await poll(
      async () => {
        const status = await this.instagramService.getMediaContainerStatus(
          accessToken,
          containerId,
        )
        lastStatus = status

        if (status.statusCode === InstagramMediaContainerStatusCode.Finished) {
          return { done: true, data: true }
        }

        if (
          status.statusCode === InstagramMediaContainerStatusCode.Error
          || status.statusCode === InstagramMediaContainerStatusCode.Expired
        ) {
          throw new InstagramPlatformException({
            code: ResponseCode.ChannelPlatformMediaProcessingFailed,
            category: PlatformErrorCategory.MediaProcessingFailed,
            context: {
              endpoint: 'waitForContainerReady',
              platformWorkId: containerId,
              metadata: { statusCode: status.statusCode, status: status.status },
            },
            cause: {
              type: PlatformErrorCauseType.Platform,
              platformCode: status.statusCode,
              platformMessage: status.status,
              raw: status,
            },
          })
        }

        return { done: false }
      },
      {
        intervalMs: 5000,
        maxPollingMs: 5 * 60 * 1000,
        taskName: 'Instagram media container processing',
        errorMapper: () => new InstagramPlatformException({
          code: ResponseCode.ChannelPlatformMediaProcessingTimeout,
          category: PlatformErrorCategory.Timeout,
          context: {
            endpoint: 'waitForContainerReady',
            platformWorkId: containerId,
            metadata: {
              statusCode: lastStatus?.statusCode,
              status: lastStatus?.status,
            },
          },
          cause: {
            type: PlatformErrorCauseType.Platform,
            platformCode: lastStatus?.statusCode,
            platformMessage: lastStatus?.status,
            raw: lastStatus,
          },
          retryable: true,
        }),
      },
    )
  }

  private async fetchPermalink(
    accessToken: string,
    mediaId: string,
  ): Promise<string> {
    try {
      const mediaInfo = await this.instagramService.getMediaInfo(accessToken, mediaId)
      if (mediaInfo.permalink)
        return mediaInfo.permalink
    }
    catch (err) {
      this.logger.warn(err, `Failed to fetch permalink for media ${mediaId}`)
    }
    throw InstagramPlatformException.validation({
      code: ResponseCode.ChannelPlatformResponseInvalid,
      category: PlatformErrorCategory.PlatformUnavailable,
      context: {
        endpoint: 'fetchPermalink',
        platformWorkId: mediaId,
      },
    })
  }

  private isImage(media: PublishMediaInput): boolean {
    if (media.metadata?.type === PublishMediaType.Image)
      return true
    if (media.metadata?.type === PublishMediaType.Video)
      return false
    return hasUrlPathExtension(media.url, ['.jpg', '.jpeg'])
  }

  private isVideo(media: PublishMediaInput): boolean {
    if (media.metadata?.type === PublishMediaType.Video)
      return true
    if (media.metadata?.type === PublishMediaType.Image)
      return false
    return hasUrlPathExtension(media.url, ['.mp4', '.mov'])
  }

  private resolveMediaType(input: PublishValidateInput<InstagramOption> | PublishPublishInput<InstagramOption>): InstagramMediaType {
    if (input.option?.media_type) {
      return input.option.media_type
    }

    const imageCount = input.content.media.filter(m => this.isImage(m)).length
    const videoCount = input.content.media.filter(m => this.isVideo(m)).length
    if (imageCount > 1 && videoCount === 0) {
      return InstagramMediaType.Carousel
    }
    if (videoCount > 0) {
      return InstagramMediaType.Reels
    }
    return InstagramMediaType.Image
  }

  private validateMediaType(
    mediaType: InstagramMediaType,
    imageCount: number,
    videoCount: number,
  ): PublishValidationIssue[] {
    const issues: PublishValidationIssue[] = []

    if (mediaType === InstagramMediaType.Image) {
      if (imageCount === 0) {
        issues.push({
          code: PublishValidationIssueCode.Required,
          path: ['content', 'media'],
          params: { field: PublishValidationField.Image },
        })
      }
      if (imageCount > 1) {
        issues.push({
          code: PublishValidationIssueCode.TooBig,
          path: ['content', 'media'],
          params: { field: PublishValidationField.Image, current: imageCount, maximum: 1, unit: 'items' },
        })
      }
    }

    if (mediaType === InstagramMediaType.Carousel) {
      if (imageCount < 2) {
        issues.push({
          code: PublishValidationIssueCode.TooSmall,
          path: ['content', 'media'],
          params: { field: PublishValidationField.Image, current: imageCount, minimum: 2, unit: 'items' },
        })
      }
      if (imageCount > 10) {
        issues.push({
          code: PublishValidationIssueCode.TooBig,
          path: ['content', 'media'],
          params: { field: PublishValidationField.Image, current: imageCount, maximum: 10, unit: 'items' },
        })
      }
    }

    if (mediaType === InstagramMediaType.Reels) {
      if (videoCount === 0) {
        issues.push({
          code: PublishValidationIssueCode.Required,
          path: ['content', 'media'],
          params: { field: PublishValidationField.Video },
        })
      }
      if (videoCount > 1) {
        issues.push({
          code: PublishValidationIssueCode.TooBig,
          path: ['content', 'media'],
          params: { field: PublishValidationField.Video, current: videoCount, maximum: 1, unit: 'items' },
        })
      }
      if (mediaType === InstagramMediaType.Reels && imageCount > 0) {
        issues.push({
          code: PublishValidationIssueCode.InvalidCombination,
          path: ['content', 'media'],
          params: { combination: PublishValidationCombination.ReelImage },
        })
      }
    }

    if (mediaType === InstagramMediaType.Stories) {
      const mediaCount = imageCount + videoCount
      if (mediaCount === 0) {
        issues.push({
          code: PublishValidationIssueCode.Required,
          path: ['content', 'media'],
          params: { field: PublishValidationField.Media },
        })
      }
      if (mediaCount > 1) {
        issues.push({
          code: PublishValidationIssueCode.TooBig,
          path: ['content', 'media'],
          params: { field: PublishValidationField.Media, current: mediaCount, maximum: 1, unit: 'items' },
        })
      }
    }

    return issues
  }
}
