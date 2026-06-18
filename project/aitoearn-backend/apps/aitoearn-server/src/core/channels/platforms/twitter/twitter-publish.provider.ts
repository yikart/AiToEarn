import type { NormalizedPublishTask, PublishCancelInput, PublishCancelResult, PublishMediaInput, PublishNormalizeInput, PublishProvider, PublishProviderResult, PublishPublishInput, PublishValidateInput, PublishValidationResult } from '../platforms.interface'
import type { TwitterMediaProcessingInfo } from './twitter.interface'
import type { TwitterOption } from './twitter.schema'
import { Injectable, Logger } from '@nestjs/common'
import { AccountType, ResponseCode } from '@yikart/common'
import { MediaService } from '../../media/media.service'
import { PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'
import {

  PublishMediaType,

} from '../platforms.interface'
import { hasUrlPathExtension } from '../platforms.utils'
import { PublishValidationField, PublishValidationIssue, PublishValidationIssueCode } from '../publish.schema'
import { TwitterMediaProcessingState } from './twitter.enum'
import { TwitterPlatformException } from './twitter.exception'
import { TwitterService } from './twitter.service'

@Injectable()
export class TwitterPublishProvider implements PublishProvider<TwitterOption, undefined> {
  private readonly logger = new Logger(TwitterPublishProvider.name)

  readonly platform = AccountType.Twitter

  constructor(
    private readonly twitterService: TwitterService,
    private readonly mediaService: MediaService,
  ) {}

  async validate(input: PublishValidateInput<TwitterOption>): Promise<PublishValidationResult> {
    const issues = this.validateMedia(input.content.media)
    return { valid: issues.length === 0, issues: issues.length ? issues : undefined }
  }

  async normalize(input: PublishNormalizeInput<TwitterOption>): Promise<NormalizedPublishTask<TwitterOption>> {
    return {
      content: input.content,
      option: input.option,
    }
  }

  async publish(input: PublishPublishInput<TwitterOption>): Promise<PublishProviderResult<undefined>> {
    const issues = this.validateMedia(input.content.media)
    if (issues.length) {
      throw TwitterPlatformException.validation({
        code: ResponseCode.ChannelPlatformMediaUnsupported,
        category: PlatformErrorCategory.Validation,
        context: {
          endpoint: 'publish.media',
          taskId: input.taskId,
          accountId: input.accountId,
          metadata: { issues },
        },
      })
    }

    const mediaIds: string[] = []
    const option: Partial<TwitterOption> = input.option ?? {}
    const altText = option.alt_text

    // Upload media first
    for (const media of input.content.media) {
      const mediaId = await this.uploadMedia(input.credential.accessToken, input.accountId, media, altText)
      mediaIds.push(mediaId)
    }

    // Create tweet
    const result = await this.twitterService.createPost(input.credential.accessToken, {
      text: (input.content.body ?? '').trim(),
      mediaIds: mediaIds.length ? mediaIds : undefined,
      replyTo: option.reply_to_tweet_id,
      quoteTweetId: option.quote_tweet_id,
      replySettings: option.reply_settings,
      poll: option.poll,
      madeWithAi: option.made_with_ai,
      paidPartnership: option.paid_partnership,
      accountId: input.accountId,
    })

    return {
      status: 200,
      platformWorkId: result.postId,
      permalink: result.permalink,
    }
  }

  async cancel(input: PublishCancelInput): Promise<PublishCancelResult> {
    try {
      await this.twitterService.deletePost(input.credential.accessToken, input.platformWorkId)
      return { canceled: true }
    }
    catch (err) {
      this.logger.error(err, `Failed to cancel tweet ${input.platformWorkId}`)
      return { canceled: false }
    }
  }

  private async uploadMedia(accessToken: string, accountId: string, media: PublishMediaInput, altText?: string): Promise<string> {
    const mediaKind = this.getMediaKind(media)
    const isVideo = mediaKind === PublishMediaType.Video
    const mediaCategory = isVideo
      ? 'tweet_video'
      : mediaKind === 'gif' ? 'tweet_gif' : 'tweet_image'

    if (!mediaKind) {
      throw TwitterPlatformException.validation({
        code: ResponseCode.ChannelPlatformMediaUnsupported,
        category: PlatformErrorCategory.Validation,
        context: {
          endpoint: 'uploadMedia',
          accountId,
          metadata: { mediaUrl: media.url },
        },
      })
    }

    // Download media
    const mediaBuffer = await this.mediaService.getBuffer({
      platform: this.platform,
      endpoint: 'uploadMedia.downloadMedia',
      url: media.url,
      accountId,
    })
    const totalBytes = mediaBuffer.length

    // Initialize upload
    const initResult = await this.twitterService.initMediaUpload(accessToken, {
      mediaType: this.getMediaMimeType(media, mediaKind),
      totalBytes,
      mediaCategory,
    })

    const mediaId = initResult.mediaId

    // Upload in chunks (5MB for videos, single chunk for images)
    const chunkSize = isVideo ? 5 * 1024 * 1024 : totalBytes
    let segmentIndex = 0

    for (let offset = 0; offset < totalBytes; offset += chunkSize) {
      const chunk = mediaBuffer.slice(offset, offset + chunkSize)
      await this.twitterService.appendMediaUpload(accessToken, {
        mediaId,
        media: chunk.toString('base64'),
        segmentIndex,
      })
      segmentIndex++
    }

    // Finalize upload
    const finalizeResult = await this.twitterService.finalizeMediaUpload(accessToken, mediaId)

    if (finalizeResult.processingInfo) {
      await this.waitForProcessing(accessToken, mediaId, finalizeResult.processingInfo)
    }

    if (altText) {
      await this.twitterService.createMediaMetadata(accessToken, { mediaId, altText, accountId })
    }

    return mediaId
  }

  private validateMedia(mediaList: PublishMediaInput[]): PublishValidationIssue[] {
    const issues: PublishValidationIssue[] = []
    const mediaKinds = mediaList.map(media => this.getMediaKind(media))
    const imageCount = mediaKinds.filter(kind => kind === PublishMediaType.Image).length
    const videoCount = mediaKinds.filter(kind => kind === PublishMediaType.Video).length
    const gifCount = mediaKinds.filter(kind => kind === 'gif').length

    mediaKinds.forEach((kind, index) => {
      if (kind) {
        return
      }
      issues.push({
        code: PublishValidationIssueCode.UnsupportedFormat,
        path: ['content', 'media', index],
        params: {
          field: PublishValidationField.Media,
          formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'mov'],
        },
      })
    })

    if (imageCount > 4) {
      issues.push({
        code: PublishValidationIssueCode.TooBig,
        path: ['content', 'media'],
        params: {
          field: PublishValidationField.Image,
          maximum: 4,
          unit: 'items',
        },
      })
    }
    if (videoCount > 1) {
      issues.push({
        code: PublishValidationIssueCode.TooBig,
        path: ['content', 'media'],
        params: {
          field: PublishValidationField.Video,
          maximum: 1,
          unit: 'items',
        },
      })
    }
    if (gifCount > 1) {
      issues.push({
        code: PublishValidationIssueCode.TooBig,
        path: ['content', 'media'],
        params: {
          field: PublishValidationField.Media,
          maximum: 1,
          unit: 'items',
        },
      })
    }
    if (videoCount > 0 && imageCount > 0) {
      issues.push({
        code: PublishValidationIssueCode.InvalidCombination,
        path: ['content', 'media'],
      })
    }
    if (gifCount > 0 && (imageCount > 0 || videoCount > 0)) {
      issues.push({
        code: PublishValidationIssueCode.InvalidCombination,
        path: ['content', 'media'],
      })
    }

    return issues
  }

  private async waitForProcessing(
    accessToken: string,
    mediaId: string,
    processingInfo: TwitterMediaProcessingInfo,
  ): Promise<void> {
    let info = processingInfo
    const maxAttempts = 30
    let attempt = 0

    while (attempt < maxAttempts) {
      if (info.state === TwitterMediaProcessingState.Succeeded)
        return
      if (info.state === TwitterMediaProcessingState.Failed) {
        throw this.mediaProcessingException('Twitter media processing failed', mediaId)
      }

      const waitMs = (info.checkAfterSecs ?? info.check_after_secs ?? 5) * 1000
      await new Promise(resolve => setTimeout(resolve, waitMs))

      const status = await this.twitterService.getMediaStatus(accessToken, mediaId)
      const statusInfo = status.processingInfo ?? {}

      if (statusInfo.state === TwitterMediaProcessingState.Succeeded)
        return
      if (statusInfo.state === TwitterMediaProcessingState.Failed) {
        throw this.mediaProcessingException('Twitter media processing failed', mediaId)
      }

      info = statusInfo
      attempt++
    }

    throw new TwitterPlatformException({
      code: ResponseCode.ChannelPlatformMediaProcessingTimeout,
      category: PlatformErrorCategory.MediaProcessingFailed,
      context: { endpoint: 'GET /2/media/upload', metadata: { mediaId } },
      cause: {
        type: PlatformErrorCauseType.Platform,
        platformMessage: 'Twitter media processing timeout',
      },
      retryable: true,
    })
  }

  private mediaProcessingException(message: string, mediaId: string): TwitterPlatformException {
    return new TwitterPlatformException({
      code: ResponseCode.ChannelPlatformMediaProcessingFailed,
      category: PlatformErrorCategory.MediaProcessingFailed,
      context: { endpoint: 'GET /2/media/upload', metadata: { mediaId } },
      cause: {
        type: PlatformErrorCauseType.Platform,
        platformMessage: message,
      },
      retryable: false,
    })
  }

  private getMediaKind(media: PublishMediaInput): PublishMediaType | 'gif' | undefined {
    const metadataType = media.metadata?.type
    if (metadataType === PublishMediaType.Video) {
      return PublishMediaType.Video
    }
    if (this.isGif(media.url)) {
      return 'gif'
    }
    if (metadataType === PublishMediaType.Image) {
      return PublishMediaType.Image
    }
    if (this.isImage(media.url)) {
      return PublishMediaType.Image
    }
    if (this.isVideo(media.url)) {
      return PublishMediaType.Video
    }
    return undefined
  }

  private isImage(url: string): boolean {
    return hasUrlPathExtension(url, ['.jpg', '.jpeg', '.png', '.webp'])
  }

  private isVideo(url: string): boolean {
    return hasUrlPathExtension(url, ['.mp4', '.mov'])
  }

  private isGif(url: string): boolean {
    return hasUrlPathExtension(url, ['.gif'])
  }

  private getMediaMimeType(
    media: PublishMediaInput,
    mediaKind: PublishMediaType | 'gif',
  ): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'video/mp4' | 'video/quicktime' {
    if (mediaKind === 'gif') {
      return 'image/gif'
    }
    if (hasUrlPathExtension(media.url, ['.png']))
      return 'image/png'
    if (hasUrlPathExtension(media.url, ['.webp']))
      return 'image/webp'
    if (mediaKind === PublishMediaType.Video && hasUrlPathExtension(media.url, ['.mov']))
      return 'video/quicktime'
    if (mediaKind === PublishMediaType.Video)
      return 'video/mp4'
    return 'image/jpeg'
  }
}
