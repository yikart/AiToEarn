import type { NormalizedPublishTask, PublishCancelInput, PublishCancelResult, PublishFinalizeInput, PublishMediaInput, PublishNormalizeInput, PublishProvider, PublishProviderResult, PublishPublishInput, PublishValidateInput, PublishValidationResult, PublishVerifyInput, PublishVerifyResult } from '../platforms.interface'
import type {
  TikTokCreatorInfo,
  TikTokPhotoPostInfo,
  TikTokPublishStatusResponse,
  TikTokVideoPostInfo,
} from './tiktok.interface'
import type {
  TiktokOption,
  TikTokPublishDataOption,
} from './tiktok.schema'
import { Injectable, Logger } from '@nestjs/common'
import { AccountType, ResponseCode } from '@yikart/common'
import { PublishRecordLinkStatus } from '@yikart/mongodb'
import { MediaService } from '../../media/media.service'
import { PlatformErrorCategory } from '../platforms.exception'
import {
  PublishMediaType,
} from '../platforms.interface'
import { hasUrlPathExtension } from '../platforms.utils'
import { PublishValidationField, PublishValidationIssueCode } from '../publish.schema'
import { TiktokConfig } from './tiktok.config'
import { TikTokPlatformException } from './tiktok.exception'
import { TikTokPublishStatus } from './tiktok.interface'
import { TikTokContentPath, TikTokPostSource, TikTokPrivacyLevel, TikTokPublishDataOptionSchema } from './tiktok.schema'
import { TikTokService } from './tiktok.service'

@Injectable()
export class TikTokPublishProvider implements PublishProvider<TiktokOption, TikTokPublishDataOption> {
  private readonly logger = new Logger(TikTokPublishProvider.name)

  readonly platform = AccountType.TikTok

  constructor(
    private readonly tikTokService: TikTokService,
    private readonly config: TiktokConfig,
    private readonly mediaService: MediaService,
  ) {}

  async validate(input: PublishValidateInput<TiktokOption>): Promise<PublishValidationResult> {
    const issues: PublishValidationResult['issues'] = []
    const { media } = input.content

    const imageMedia = media.filter(m => this.isImage(m))
    const videoMedia = media.filter(m => this.isVideo(m))

    // TikTok photo mode requires 2-35 images
    if (imageMedia.length > 0 && imageMedia.length < 2) {
      issues.push({
        code: PublishValidationIssueCode.TooSmall,
        path: ['content', 'media'],
        params: { field: PublishValidationField.Image, minimum: 2, unit: 'items' },
      })
    }

    const option: Partial<TiktokOption> = input.option ?? {}
    if (option.source === TikTokPostSource.PullFromUrl && videoMedia.length > 0) {
      for (const video of videoMedia) {
        if (!video.url.startsWith('https://')) {
          issues.push({
            code: PublishValidationIssueCode.InvalidUrl,
            path: ['content', 'media', media.indexOf(video), 'url'],
            params: { field: PublishValidationField.Url },
          })
        }
      }
    }
    if (option.source === TikTokPostSource.FileUpload && imageMedia.length > 0 && videoMedia.length === 0) {
      issues.push({
        code: PublishValidationIssueCode.InvalidOption,
        path: ['option', 'source'],
        params: { field: PublishValidationField.Option },
      })
    }

    return { valid: issues.length === 0, issues: issues.length ? issues : undefined }
  }

  async normalize(input: PublishNormalizeInput<TiktokOption>): Promise<NormalizedPublishTask<TiktokOption>> {
    return {
      content: input.content,
      option: input.option,
    }
  }

  async publish(input: PublishPublishInput<TiktokOption>): Promise<PublishProviderResult<TikTokPublishDataOption>> {
    const imageMedia = input.content.media.filter(m => this.isImage(m))
    const videoMedia = input.content.media.filter(m => this.isVideo(m))

    if (videoMedia.length > 0) {
      return this.publishVideo(input)
    }

    if (imageMedia.length > 0) {
      return this.publishPhoto(input)
    }

    throw TikTokPlatformException.validation({
      code: ResponseCode.ChannelPlatformMediaUnsupported,
      category: PlatformErrorCategory.MediaProcessingFailed,
      context: {
        endpoint: 'publish',
        taskId: input.taskId,
        accountId: input.accountId,
      },
    })
  }

  async finalize(input: PublishFinalizeInput<TikTokPublishDataOption, TiktokOption>): Promise<PublishProviderResult<TikTokPublishDataOption>> {
    const publishId = input.platformWorkId
    const accessToken = input.credential.accessToken
    const dataOption = this.parseDataOption(input.dataOption)
    const privacyLevel = dataOption?.privacyLevel ?? input.option?.privacy_level

    const status = await this.tikTokService.getPublishStatus(accessToken, publishId)
    const finalPostId = this.getFinalPostId(status)
    this.logger.log({
      platform: AccountType.TikTok,
      taskId: input.taskId,
      publishId,
      status,
    }, 'TikTok publish status fetched')

    if (status.status === TikTokPublishStatus.PublishComplete && finalPostId) {
      const contentPath = dataOption?.contentPath ?? TikTokContentPath.Video
      const username = dataOption?.username ?? input.credential.account
      const permalink = await this.getFinalPostShareUrl(accessToken, finalPostId)
        ?? this.buildWorkLink(username, contentPath, finalPostId)
      if (!permalink) {
        return {
          status: 202,
          platformWorkId: publishId,
          dataOption: this.buildDataOption(dataOption, publishId, {
            publishStatus: status.status,
            finalPostId,
            username,
          }),
        }
      }
      return {
        status: 200,
        platformWorkId: finalPostId,
        permalink,
        dataOption: this.buildDataOption(dataOption, publishId, {
          publishStatus: status.status,
          finalPostId,
          username,
        }),
      }
    }

    if (status.status === TikTokPublishStatus.PublishComplete && privacyLevel === TikTokPrivacyLevel.SelfOnly) {
      return {
        status: 200,
        platformWorkId: publishId,
        linkStatus: PublishRecordLinkStatus.PENDING,
        dataOption: this.buildDataOption(dataOption, publishId, {
          privacyLevel,
          publishStatus: status.status,
        }),
      }
    }

    if (status.status === TikTokPublishStatus.Failed) {
      const errorMessage = status.fail_reason ?? 'TikTok publish failed'
      return {
        status: 500,
        platformWorkId: publishId,
        errorMessage,
        dataOption: this.buildDataOption(dataOption, publishId, {
          publishStatus: status.status,
          error: errorMessage,
        }),
      }
    }

    return {
      status: 202,
      platformWorkId: publishId,
      dataOption: this.buildDataOption(dataOption, publishId, {
        publishStatus: status.status,
      }),
    }
  }

  async verify(input: PublishVerifyInput<TikTokPublishDataOption, TiktokOption>): Promise<PublishVerifyResult> {
    try {
      const status = await this.tikTokService.getPublishStatus(
        input.credential.accessToken,
        input.platformWorkId,
      )
      const finalPostId = this.getFinalPostId(status)
      const dataOption = this.parseDataOption(input.dataOption)
      const privacyLevel = dataOption?.privacyLevel ?? input.option?.privacy_level
      const contentPath = dataOption?.contentPath ?? TikTokContentPath.Video
      const username = dataOption?.username ?? input.credential.account
      const permalink = finalPostId
        ? await this.getFinalPostShareUrl(input.credential.accessToken, finalPostId)
        ?? this.buildWorkLink(username, contentPath, finalPostId)
        : undefined
      this.logger.log({
        platform: AccountType.TikTok,
        taskId: input.taskId,
        publishId: input.platformWorkId,
        status,
      }, 'TikTok publish verification checked')

      if (status.status === TikTokPublishStatus.PublishComplete && !finalPostId && privacyLevel === TikTokPrivacyLevel.SelfOnly) {
        return {
          published: true,
          platformWorkId: input.platformWorkId,
          linkStatus: PublishRecordLinkStatus.PENDING,
        }
      }

      return {
        published: status.status === TikTokPublishStatus.PublishComplete && Boolean(finalPostId && permalink),
        platformWorkId: finalPostId,
        permalink,
      }
    }
    catch (err) {
      this.logger.warn(err, `Failed to verify TikTok publish ${input.platformWorkId}`)
      return { published: false }
    }
  }

  async cancel(input: PublishCancelInput): Promise<PublishCancelResult> {
    try {
      await this.tikTokService.cancelPublish(
        input.credential.accessToken,
        input.platformWorkId,
      )
      return { canceled: true }
    }
    catch (err) {
      this.logger.error(err, `Failed to cancel TikTok publish ${input.platformWorkId}`)
      return { canceled: false }
    }
  }

  private async publishVideo(input: PublishPublishInput<TiktokOption>): Promise<PublishProviderResult<TikTokPublishDataOption>> {
    const video = input.content.media.find(m => this.isVideo(m))
    if (!video) {
      throw TikTokPlatformException.validation({
        code: ResponseCode.ChannelPlatformMediaUnsupported,
        category: PlatformErrorCategory.MediaProcessingFailed,
        context: {
          endpoint: 'publishVideo',
          taskId: input.taskId,
          accountId: input.accountId,
        },
      })
    }

    const option: Partial<TiktokOption> = input.option ?? {}
    const creatorInfo = await this.tikTokService.getCreatorInfo(input.credential.accessToken)
    const privacyLevel = this.resolvePrivacyLevel(option, creatorInfo)
    this.assertCreatorInteractionOptions(option, creatorInfo, true)

    const durationSec = video.metadata?.durationSec
    if (
      durationSec !== undefined
      && durationSec > creatorInfo.max_video_post_duration_sec
    ) {
      throw TikTokPlatformException.validation({
        code: ResponseCode.ChannelPlatformMediaUnsupported,
        category: PlatformErrorCategory.MediaProcessingFailed,
        context: {
          endpoint: 'publishVideo',
          taskId: input.taskId,
          accountId: input.accountId,
        },
      })
    }

    const postInfo: TikTokVideoPostInfo = {
      title: this.buildVideoCaption(input.content.title, input.content.body),
      privacy_level: privacyLevel,
      disable_comment: option.disable_comment ?? creatorInfo.comment_disabled,
      disable_duet: option.disable_duet ?? creatorInfo.duet_disabled,
      disable_stitch: option.disable_stitch ?? creatorInfo.stitch_disabled,
      brand_content_toggle: option.brand_content_toggle ?? false,
      brand_organic_toggle: option.brand_organic_toggle ?? false,
    }
    if (option.is_aigc !== undefined) {
      postInfo.is_aigc = option.is_aigc
    }

    const uploadSource = option.source ?? TikTokPostSource.FileUpload

    if (uploadSource === TikTokPostSource.PullFromUrl) {
      this.assertPullFromUrl(video.url)
      const sourceInfo: { source: TikTokPostSource.PullFromUrl, video_url: string } = {
        source: TikTokPostSource.PullFromUrl,
        video_url: video.url,
      }

      const result = await this.tikTokService.initVideoPublish(
        input.credential.accessToken,
        postInfo,
        sourceInfo,
      )

      return {
        status: 202,
        platformWorkId: result.publish_id,
        dataOption: this.createDataOption(
          result.publish_id,
          TikTokPostSource.PullFromUrl,
          TikTokContentPath.Video,
          privacyLevel,
          input.credential.account,
        ),
      }
    }

    // File upload mode: init -> upload -> poll
    const videoSize = await this.getVideoSize(video.url)
    const uploadPlan = this.tikTokService.getUploadPlan(videoSize)

    const sourceInfo: {
      source: TikTokPostSource.FileUpload
      video_size: number
      chunk_size: number
      total_chunk_count: number
    } = {
      source: TikTokPostSource.FileUpload,
      video_size: videoSize,
      chunk_size: uploadPlan.chunkSize,
      total_chunk_count: uploadPlan.totalChunkCount,
    }

    const initResult = await this.tikTokService.initVideoPublish(
      input.credential.accessToken,
      postInfo,
      sourceInfo,
    )

    if (!initResult.upload_url) {
      throw TikTokPlatformException.validation({
        code: ResponseCode.ChannelPlatformResponseInvalid,
        category: PlatformErrorCategory.PlatformUnavailable,
        context: {
          endpoint: 'publishVideo',
          taskId: input.taskId,
          accountId: input.accountId,
        },
      })
    }

    await this.tikTokService.uploadVideo(initResult.upload_url, video.url)

    return {
      status: 202,
      platformWorkId: initResult.publish_id,
      dataOption: this.createDataOption(
        initResult.publish_id,
        TikTokPostSource.FileUpload,
        TikTokContentPath.Video,
        privacyLevel,
        input.credential.account,
      ),
    }
  }

  private async publishPhoto(input: PublishPublishInput<TiktokOption>): Promise<PublishProviderResult<TikTokPublishDataOption>> {
    const images = input.content.media.filter(m => this.isImage(m))
    if (images.length === 0) {
      throw TikTokPlatformException.validation({
        code: ResponseCode.ChannelPlatformMediaUnsupported,
        category: PlatformErrorCategory.MediaProcessingFailed,
        context: {
          endpoint: 'publishPhoto',
          taskId: input.taskId,
          accountId: input.accountId,
        },
      })
    }

    const option: Partial<TiktokOption> = input.option ?? {}
    if (option.source === TikTokPostSource.FileUpload) {
      throw TikTokPlatformException.validation({
        code: ResponseCode.ChannelPlatformOperationNotSupported,
        category: PlatformErrorCategory.Validation,
        context: {
          endpoint: 'publishPhoto',
          taskId: input.taskId,
          accountId: input.accountId,
        },
      })
    }
    const creatorInfo = await this.tikTokService.getCreatorInfo(input.credential.accessToken)
    const privacyLevel = this.resolvePrivacyLevel(option, creatorInfo)
    this.assertCreatorInteractionOptions(option, creatorInfo, false)

    const coverIndex = input.content.cover?.url
      ? images.findIndex(m => m.url === input.content.cover!.url)
      : 0
    let photoCoverIndex = coverIndex >= 0 ? coverIndex : 0
    if (option.photo_cover_index !== undefined) {
      photoCoverIndex = option.photo_cover_index
    }

    const postInfo: TikTokPhotoPostInfo = {
      title: this.buildTitle(input.content.title),
      description: input.content.body,
      privacy_level: privacyLevel,
      brand_content_toggle: option.brand_content_toggle ?? false,
      brand_organic_toggle: option.brand_organic_toggle ?? false,
      disable_comment: option.disable_comment ?? creatorInfo.comment_disabled,
      auto_add_music: option.auto_add_music,
    }
    const sourceInfo: {
      source: TikTokPostSource.PullFromUrl
      photo_images: string[]
      photo_cover_index: number
    } = {
      source: TikTokPostSource.PullFromUrl,
      photo_images: images.map((m) => {
        this.assertPullFromUrl(m.url)
        return m.url
      }),
      photo_cover_index: photoCoverIndex,
    }

    const result = await this.tikTokService.initPhotoPublish(
      input.credential.accessToken,
      postInfo,
      sourceInfo,
    )

    return {
      status: 202,
      platformWorkId: result.publish_id,
      dataOption: this.createDataOption(
        result.publish_id,
        TikTokPostSource.PullFromUrl,
        TikTokContentPath.Photo,
        privacyLevel,
        input.credential.account,
      ),
    }
  }

  private resolvePrivacyLevel(
    option: Partial<TiktokOption>,
    creatorInfo: TikTokCreatorInfo,
  ): TikTokPrivacyLevel {
    const requested = option.privacy_level
    if (requested && !creatorInfo.privacy_level_options.includes(requested)) {
      throw TikTokPlatformException.validation({
        code: ResponseCode.ChannelPlatformPublishOptionMissing,
        category: PlatformErrorCategory.Validation,
        context: { endpoint: 'resolvePrivacyLevel' },
      })
    }

    return requested
      ?? creatorInfo.privacy_level_options[0]
      ?? TikTokPrivacyLevel.SelfOnly
  }

  private assertCreatorInteractionOptions(
    option: Partial<TiktokOption>,
    creatorInfo: TikTokCreatorInfo,
    includeVideoOptions: boolean,
  ): void {
    if (creatorInfo.comment_disabled && option.disable_comment === false) {
      throw TikTokPlatformException.validation({
        code: ResponseCode.ChannelPlatformPermissionMissing,
        category: PlatformErrorCategory.Permission,
        context: { endpoint: 'assertCreatorInteractionOptions' },
      })
    }
    if (includeVideoOptions && creatorInfo.duet_disabled && option.disable_duet === false) {
      throw TikTokPlatformException.validation({
        code: ResponseCode.ChannelPlatformPermissionMissing,
        category: PlatformErrorCategory.Permission,
        context: { endpoint: 'assertCreatorInteractionOptions' },
      })
    }
    if (includeVideoOptions && creatorInfo.stitch_disabled && option.disable_stitch === false) {
      throw TikTokPlatformException.validation({
        code: ResponseCode.ChannelPlatformPermissionMissing,
        category: PlatformErrorCategory.Permission,
        context: { endpoint: 'assertCreatorInteractionOptions' },
      })
    }
  }

  private assertPullFromUrl(url: string): void {
    if (!url.startsWith('https://')) {
      throw TikTokPlatformException.validation({
        code: ResponseCode.ChannelPlatformPublishOptionMissing,
        category: PlatformErrorCategory.Validation,
        context: { endpoint: 'assertPullFromUrl' },
      })
    }
    if (
      this.config.pullFromUrlAllowedPrefixes.length > 0
      && !this.config.pullFromUrlAllowedPrefixes.some(prefix => url.startsWith(prefix))
    ) {
      throw TikTokPlatformException.validation({
        code: ResponseCode.ChannelPlatformApiFailed,
        category: PlatformErrorCategory.Validation,
        context: { endpoint: 'assertPullFromUrl' },
      })
    }
  }

  private buildTitle(title: string | undefined): string {
    return (title ?? '').trim()
  }

  private buildVideoCaption(title: string | undefined, body: string | undefined): string {
    return [title, body]
      .map(text => (text ?? '').trim())
      .filter(text => text.length > 0)
      .join('\n')
  }

  private async getVideoSize(videoUrl: string): Promise<number> {
    const headers = await this.mediaService.head({
      platform: AccountType.TikTok,
      endpoint: 'getVideoSize',
      url: videoUrl,
    })
    const { 'content-length': contentLength } = headers
    if (!contentLength) {
      throw TikTokPlatformException.validation({
        code: ResponseCode.ChannelPlatformMediaUnsupported,
        category: PlatformErrorCategory.MediaProcessingFailed,
        context: { endpoint: 'getVideoSize' },
      })
    }
    return Number.parseInt(contentLength as string, 10)
  }

  private isImage(media: PublishMediaInput): boolean {
    if (media.metadata?.type === PublishMediaType.Image)
      return true
    if (media.metadata?.type === PublishMediaType.Video)
      return false
    return hasUrlPathExtension(media.url, ['.jpg', '.jpeg', '.webp'])
  }

  private isVideo(media: PublishMediaInput): boolean {
    if (media.metadata?.type === PublishMediaType.Video)
      return true
    if (media.metadata?.type === PublishMediaType.Image)
      return false
    return hasUrlPathExtension(media.url, ['.mp4', '.mov', '.webm'])
  }

  private getFinalPostId(status: TikTokPublishStatusResponse): string | undefined {
    const [postId] = status.publicaly_available_post_id ?? []
    return postId
  }

  private async getFinalPostShareUrl(accessToken: string, postId: string): Promise<string | undefined> {
    const response = await this.tikTokService.queryVideos(accessToken, [postId])
    return response.videos?.find(video => video.id === postId)?.share_url
  }

  private parseDataOption(dataOption: TikTokPublishDataOption | undefined): TikTokPublishDataOption | undefined {
    const parsed = TikTokPublishDataOptionSchema.safeParse(dataOption)
    return parsed.success ? parsed.data : undefined
  }

  private createDataOption(
    publishId: string,
    source: TikTokPostSource,
    contentPath: TikTokContentPath,
    privacyLevel: TikTokPrivacyLevel,
    username?: string,
  ): TikTokPublishDataOption {
    const dataOption: TikTokPublishDataOption = {
      publishId,
      source,
      contentPath,
      privacyLevel,
    }
    if (username) {
      dataOption.username = username
    }
    return dataOption
  }

  private buildDataOption(
    current: TikTokPublishDataOption | undefined,
    publishId: string,
    patch: Partial<Omit<TikTokPublishDataOption, 'publishId' | 'source' | 'contentPath'>>,
  ): TikTokPublishDataOption {
    const dataOption: TikTokPublishDataOption = {
      publishId,
      contentPath: current?.contentPath ?? TikTokContentPath.Video,
    }
    if (current?.source) {
      dataOption.source = current.source
    }
    if (current?.username) {
      dataOption.username = current.username
    }
    if (current?.privacyLevel) {
      dataOption.privacyLevel = current.privacyLevel
    }
    if (patch.username) {
      dataOption.username = patch.username
    }
    if (patch.privacyLevel) {
      dataOption.privacyLevel = patch.privacyLevel
    }
    if (patch.publishStatus) {
      dataOption.publishStatus = patch.publishStatus
    }
    if (patch.finalPostId) {
      dataOption.finalPostId = patch.finalPostId
    }
    if (patch.error) {
      dataOption.error = patch.error
    }
    return dataOption
  }

  private buildWorkLink(username: string | undefined, contentPath: TikTokContentPath, postId: string): string | undefined {
    const normalizedUsername = username?.replace(/^@/, '').trim()
    return normalizedUsername
      ? `https://www.tiktok.com/@${normalizedUsername}/${contentPath}/${postId}`
      : undefined
  }
}
