import type { NormalizedPublishTask, PublishCancelInput, PublishCancelResult, PublishMediaInput, PublishNormalizeInput, PublishProvider, PublishProviderResult, PublishPublishInput, PublishUpdateInput, PublishValidateInput, PublishValidationResult, PublishVerifyInput, PublishVerifyResult } from '../platforms.interface'
import type { PinterestOption } from './pinterest.schema'
import { Injectable, Logger } from '@nestjs/common'
import { AccountType, poll, ResponseCode } from '@yikart/common'
import { PublishRecordLinkStatus } from '@yikart/mongodb'
import { MediaService } from '../../media/media.service'
import { PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'
import {

  PublishMediaType,

} from '../platforms.interface'
import { hasUrlPathExtension } from '../platforms.utils'
import { PublishValidationCombination, PublishValidationField, PublishValidationIssueCode } from '../publish.schema'
import { PinterestPlatformException } from './pinterest.exception'
import { buildPinterestPinWorkLink, PinterestMediaStatusValue } from './pinterest.interface'
import { PinterestService } from './pinterest.service'

@Injectable()
export class PinterestPublishProvider implements PublishProvider<PinterestOption, undefined> {
  private readonly logger = new Logger(PinterestPublishProvider.name)

  readonly platform = AccountType.Pinterest

  constructor(
    private readonly pinterestService: PinterestService,
    private readonly mediaService: MediaService,
  ) {}

  async validate(input: PublishValidateInput<PinterestOption>): Promise<PublishValidationResult> {
    const issues: PublishValidationResult['issues'] = []
    const option: Partial<PinterestOption> = input.option ?? {}
    const imageCount = input.content.media.filter(m => this.isImage(m)).length
    const videoCount = input.content.media.filter(m => this.isVideo(m)).length

    if (!option.boardId) {
      issues.push({
        code: PublishValidationIssueCode.Required,
        path: ['option', 'boardId'],
        params: { field: PublishValidationField.Option },
      })
    }
    if (input.content.media.length === 0) {
      issues.push({
        code: PublishValidationIssueCode.Required,
        path: ['content', 'media'],
        params: { field: PublishValidationField.Media },
      })
    }
    if (imageCount > 0 && videoCount > 0) {
      issues.push({
        code: PublishValidationIssueCode.InvalidCombination,
        path: ['content', 'media'],
        params: { combination: PublishValidationCombination.ImageVideo },
      })
    }
    if (imageCount > 1) {
      issues.push({
        code: PublishValidationIssueCode.TooBig,
        path: ['content', 'media'],
        params: { field: PublishValidationField.Image, current: imageCount, maximum: 1, unit: 'items' },
      })
    }
    if (videoCount > 1) {
      issues.push({
        code: PublishValidationIssueCode.TooBig,
        path: ['content', 'media'],
        params: { field: PublishValidationField.Video, current: videoCount, maximum: 1, unit: 'items' },
      })
    }
    if (videoCount > 0 && !option.coverImageUrl) {
      issues.push({
        code: PublishValidationIssueCode.Required,
        path: ['option', 'coverImageUrl'],
        params: { field: PublishValidationField.Cover },
      })
    }

    return { valid: issues.length === 0, issues: issues.length ? issues : undefined }
  }

  async normalize(input: PublishNormalizeInput<PinterestOption>): Promise<NormalizedPublishTask<PinterestOption>> {
    return {
      content: input.content,
      option: input.option,
    }
  }

  async publish(input: PublishPublishInput<PinterestOption>): Promise<PublishProviderResult<undefined>> {
    const option = input.option
    if (!option) {
      throw PinterestPlatformException.validation({
        code: ResponseCode.ChannelPlatformPublishOptionMissing,
        category: PlatformErrorCategory.Validation,
        context: {
          endpoint: 'publish',
          taskId: input.taskId,
          accountId: input.accountId,
        },
      })
    }

    const videoMedia = input.content.media.find(m => this.isVideo(m))
    const imageMedia = input.content.media.find(m => this.isImage(m))
    if (!videoMedia && !imageMedia) {
      throw PinterestPlatformException.validation({
        code: ResponseCode.ChannelPlatformMediaUnsupported,
        category: PlatformErrorCategory.MediaProcessingFailed,
        context: {
          endpoint: 'publish',
          taskId: input.taskId,
          accountId: input.accountId,
        },
      })
    }

    const videoMediaId = videoMedia
      ? await this.uploadVideo(input.credential.accessToken, videoMedia.url)
      : undefined

    const pin = await this.pinterestService.createPin(
      input.credential.accessToken,
      {
        boardId: option.boardId,
        title: input.content.title,
        description: input.content.body,
        link: option.link,
        imageUrl: imageMedia?.url,
        videoMediaId,
        coverImageUrl: option.coverImageUrl,
        altText: option.altText,
      },
    )

    let pinInfo = pin
    let linkStatus = PublishRecordLinkStatus.READY
    try {
      pinInfo = await this.pinterestService.getPin(
        input.credential.accessToken,
        pin.id,
      )
    }
    catch (err) {
      this.logger.warn(err, `Failed to fetch Pinterest pin ${pin.id} after create`)
      linkStatus = PublishRecordLinkStatus.PENDING
    }

    const permalink = buildPinterestPinWorkLink(pinInfo.id)

    return {
      status: 200,
      platformWorkId: pinInfo.id,
      permalink,
      linkStatus,
    }
  }

  async cancel(input: PublishCancelInput): Promise<PublishCancelResult> {
    try {
      await this.pinterestService.deletePin(
        input.credential.accessToken,
        input.platformWorkId,
      )
      return { canceled: true }
    }
    catch (err) {
      this.logger.error(err, `Failed to cancel Pinterest pin ${input.platformWorkId}`)
      return { canceled: false }
    }
  }

  async verify(input: PublishVerifyInput<undefined>): Promise<PublishVerifyResult> {
    try {
      const pinInfo = await this.pinterestService.getPin(
        input.credential.accessToken,
        input.platformWorkId,
      )

      return {
        published: true,
        platformWorkId: pinInfo.id,
        permalink: buildPinterestPinWorkLink(pinInfo.id),
      }
    }
    catch (err) {
      this.logger.warn(err, `Failed to verify Pinterest pin ${input.platformWorkId}`)
      return { published: false }
    }
  }

  async update(input: PublishUpdateInput<PinterestOption>): Promise<PublishProviderResult<undefined>> {
    const option: Partial<PinterestOption> = input.option ?? {}

    await this.pinterestService.updatePin(
      input.credential.accessToken,
      input.platformWorkId,
      {
        title: input.content.title,
        description: input.content.body,
        link: option.link,
        boardId: option.boardId,
      },
    )

    return {
      status: 200,
      platformWorkId: input.platformWorkId,
      permalink: buildPinterestPinWorkLink(input.platformWorkId),
    }
  }

  private isImage(media: PublishMediaInput): boolean {
    if (media.metadata?.type === PublishMediaType.Image)
      return true
    if (media.metadata?.type === PublishMediaType.Video)
      return false
    return hasUrlPathExtension(media.url, ['.bmp', '.jpg', '.jpeg', '.png', '.tiff', '.webp'])
  }

  private isVideo(media: PublishMediaInput): boolean {
    if (media.metadata?.type === PublishMediaType.Video)
      return true
    if (media.metadata?.type === PublishMediaType.Image)
      return false
    return hasUrlPathExtension(media.url, ['.mp4', '.mov'])
  }

  private async uploadVideo(accessToken: string, videoUrl: string): Promise<string> {
    const upload = await this.pinterestService.createVideoMediaUpload(accessToken)
    await this.mediaService.withUploadSource({
      platform: this.platform,
      endpoint: 'uploadVideo.downloadMedia',
      url: videoUrl,
    }, async (source) => {
      await this.pinterestService.uploadVideoMedia(upload, await source.blob(), source.filename)
    })

    let lastStatus: Awaited<ReturnType<PinterestService['getMediaStatus']>> | undefined

    return await poll(
      async () => {
        const status = await this.pinterestService.getMediaStatus(accessToken, upload.media_id)
        lastStatus = status
        if (status.status === PinterestMediaStatusValue.Succeeded) {
          return { done: true, data: upload.media_id }
        }
        if (status.status === PinterestMediaStatusValue.Failed) {
          throw new PinterestPlatformException({
            code: ResponseCode.ChannelPlatformMediaProcessingFailed,
            category: PlatformErrorCategory.MediaProcessingFailed,
            context: {
              endpoint: 'uploadVideo',
              metadata: { mediaId: upload.media_id, status: status.status },
            },
            cause: {
              type: PlatformErrorCauseType.Platform,
              platformCode: status.status,
              raw: status,
            },
          })
        }
        return { done: false }
      },
      {
        intervalMs: 5000,
        maxPollingMs: 5 * 60 * 1000,
        taskName: 'Pinterest video media processing',
        errorMapper: () => new PinterestPlatformException({
          code: ResponseCode.ChannelPlatformMediaProcessingTimeout,
          category: PlatformErrorCategory.Timeout,
          context: {
            endpoint: 'uploadVideo',
            metadata: { mediaId: upload.media_id, status: lastStatus?.status },
          },
          cause: {
            type: PlatformErrorCauseType.Platform,
            platformCode: lastStatus?.status,
            raw: lastStatus,
          },
          retryable: true,
        }),
      },
    )
  }
}
