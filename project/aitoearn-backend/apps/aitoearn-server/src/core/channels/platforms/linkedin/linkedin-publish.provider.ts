import type { NormalizedPublishTask, PublishCancelInput, PublishCancelResult, PublishMediaInput, PublishNormalizeInput, PublishProvider, PublishProviderResult, PublishPublishInput, PublishValidateInput, PublishValidationResult } from '../platforms.interface'
import type { LinkedInOption, LinkedInPublishDataOption } from './linkedin.schema'
import { Injectable, Logger } from '@nestjs/common'
import { AccountType, ResponseCode } from '@yikart/common'
import { MediaService } from '../../media/media.service'
import { PlatformErrorCategory } from '../platforms.exception'
import {

  PublishMediaType,

} from '../platforms.interface'
import { hasUrlPathExtension } from '../platforms.utils'
import { LinkedInPlatformException } from './linkedin.exception'
import { LinkedInAccountType, LinkedInOptionSchema, LinkedInPublishDataOptionSchema } from './linkedin.schema'
import { LinkedInService } from './linkedin.service'

interface LinkedInResolvedOwner {
  authorUrn: string
  accountType: LinkedInAccountType
}

@Injectable()
export class LinkedInPublishProvider implements PublishProvider<LinkedInOption, LinkedInPublishDataOption> {
  private readonly logger = new Logger(LinkedInPublishProvider.name)

  readonly platform = AccountType.LinkedIn

  constructor(
    private readonly linkedinService: LinkedInService,
    private readonly mediaService: MediaService,
  ) {}

  async validate(_input: PublishValidateInput<LinkedInOption>): Promise<PublishValidationResult> {
    return { valid: true }
  }

  async normalize(input: PublishNormalizeInput<LinkedInOption>): Promise<NormalizedPublishTask<LinkedInOption>> {
    return {
      content: input.content,
      option: this.parseOption(input.option),
    }
  }

  async publish(input: PublishPublishInput<LinkedInOption>): Promise<PublishProviderResult<LinkedInPublishDataOption>> {
    const accessToken = input.credential.accessToken
    const option = this.parseOption(input.option)
    const owner = this.resolveOwner(input, option)

    const unsupportedVideo = input.content.media.find(m => this.isUnsupportedVideo(m))
    if (unsupportedVideo) {
      throw LinkedInPlatformException.validation({
        code: ResponseCode.ChannelPlatformMediaUnsupported,
        category: PlatformErrorCategory.MediaProcessingFailed,
        context: {
          endpoint: 'publish.video',
          taskId: input.taskId,
          accountId: input.accountId,
          metadata: { mediaUrl: unsupportedVideo.url },
        },
      })
    }

    const videoMedia = input.content.media.find(m => this.isVideo(m))
    const imageMedia = input.content.media.filter(m => this.isImage(m))
    const text = option.commentary ?? input.content.body ?? ''

    if (videoMedia) {
      return this.publishVideoPost(accessToken, owner, text, videoMedia.url)
    }

    if (imageMedia.length > 0) {
      return this.publishImagePost(accessToken, owner, text, imageMedia.map(m => m.url))
    }

    return this.publishTextPost(accessToken, owner, text)
  }

  async cancel(input: PublishCancelInput): Promise<PublishCancelResult> {
    try {
      await this.linkedinService.deletePost(
        input.credential.accessToken,
        input.platformWorkId,
      )
      return { canceled: true }
    }
    catch (err) {
      this.logger.error(err, `Failed to cancel LinkedIn post ${input.platformWorkId}`)
      return { canceled: false }
    }
  }

  private async publishTextPost(
    accessToken: string,
    owner: LinkedInResolvedOwner,
    text: string,
  ): Promise<PublishProviderResult<LinkedInPublishDataOption>> {
    const result = await this.linkedinService.createTextPost(
      accessToken,
      owner.authorUrn,
      text,
    )

    return this.buildPublishResult(result.id, owner)
  }

  private async publishImagePost(
    accessToken: string,
    owner: LinkedInResolvedOwner,
    text: string,
    imageUrls: string[],
  ): Promise<PublishProviderResult<LinkedInPublishDataOption>> {
    const imageUrns: string[] = []

    for (const imageUrl of imageUrls) {
      const imageUrn = await this.uploadImage(accessToken, owner.authorUrn, imageUrl)
      imageUrns.push(imageUrn)
    }

    const result = await this.linkedinService.createImagePost(
      accessToken,
      owner.authorUrn,
      text,
      imageUrns,
    )

    return this.buildPublishResult(result.id, owner)
  }

  private async publishVideoPost(
    accessToken: string,
    owner: LinkedInResolvedOwner,
    text: string,
    videoUrl: string,
  ): Promise<PublishProviderResult<LinkedInPublishDataOption>> {
    const videoUrn = await this.uploadVideo(accessToken, owner.authorUrn, videoUrl)

    const result = await this.linkedinService.createVideoPost(
      accessToken,
      owner.authorUrn,
      text,
      videoUrn,
    )

    return this.buildPublishResult(result.id, owner)
  }

  private async uploadImage(
    accessToken: string,
    ownerUrn: string,
    imageUrl: string,
  ): Promise<string> {
    const initResponse = await this.linkedinService.registerImageUpload(
      accessToken,
      ownerUrn,
    )

    const initValue = initResponse.value
    const uploadUrl = initValue?.uploadUrl
    const imageUrn = initValue?.image

    if (!uploadUrl || !imageUrn) {
      throw LinkedInPlatformException.validation({
        code: ResponseCode.ChannelPlatformResponseInvalid,
        category: PlatformErrorCategory.PlatformUnavailable,
        context: { endpoint: 'uploadImage' },
        cause: { raw: initResponse },
      })
    }

    const imageBuffer = await this.mediaService.getBuffer({
      platform: this.platform,
      endpoint: 'uploadImage.downloadMedia',
      url: imageUrl,
    })

    await this.linkedinService.uploadBinary(uploadUrl, imageBuffer)

    return imageUrn
  }

  private async uploadVideo(
    accessToken: string,
    ownerUrn: string,
    videoUrl: string,
  ): Promise<string> {
    const videoBuffer = await this.mediaService.getBuffer({
      platform: this.platform,
      endpoint: 'uploadVideo.downloadMedia',
      url: videoUrl,
    })

    const initResponse = await this.linkedinService.registerVideoUpload(
      accessToken,
      ownerUrn,
      videoBuffer.length,
    )

    const initValue = initResponse.value
    const uploadUrl = initValue?.uploadUrl
    const uploadInstructions = initValue?.uploadInstructions ?? []
    const videoUrn = initValue?.video ?? initValue?.mediaArtifact
    const uploadToken = initValue?.uploadToken

    if (!videoUrn || typeof uploadToken !== 'string') {
      throw LinkedInPlatformException.validation({
        code: ResponseCode.ChannelPlatformResponseInvalid,
        category: PlatformErrorCategory.PlatformUnavailable,
        context: { endpoint: 'uploadVideo' },
        cause: { raw: initResponse },
      })
    }

    const uploadedPartIds: string[] = []
    if (uploadInstructions.length) {
      for (const instruction of uploadInstructions) {
        const chunk = videoBuffer.slice(instruction.firstByte, instruction.lastByte + 1)
        const etag = await this.linkedinService.uploadBinary(instruction.uploadUrl, chunk)
        if (etag) {
          uploadedPartIds.push(etag)
        }
      }
    }
    else {
      if (!uploadUrl) {
        throw LinkedInPlatformException.validation({
          code: ResponseCode.ChannelPlatformResponseInvalid,
          category: PlatformErrorCategory.PlatformUnavailable,
          context: { endpoint: 'uploadVideo' },
          cause: { raw: initResponse },
        })
      }

      const etag = await this.linkedinService.uploadBinary(uploadUrl, videoBuffer)
      if (etag) {
        uploadedPartIds.push(etag)
      }
    }

    await this.linkedinService.finalizeVideoUpload(accessToken, videoUrn, uploadToken, uploadedPartIds)

    return videoUrn
  }

  private resolveOwner(
    input: PublishPublishInput<LinkedInOption>,
    option: LinkedInOption,
  ): LinkedInResolvedOwner {
    if (option.authorUrn) {
      return this.buildOwnerDataOption({
        authorUrn: option.authorUrn,
        accountType: LinkedInAccountType.Person,
      })
    }

    const ownerId = input.credential.platformUid
    if (!ownerId) {
      throw LinkedInPlatformException.validation({
        code: ResponseCode.ChannelPlatformAccountMissing,
        category: PlatformErrorCategory.Auth,
        context: {
          endpoint: 'publish',
          taskId: input.taskId,
          accountId: input.accountId,
        },
      })
    }

    return this.buildOwnerDataOption({
      authorUrn: `urn:li:person:${ownerId}`,
      accountType: LinkedInAccountType.Person,
    })
  }

  private isImage(media: PublishMediaInput): boolean {
    if (media.metadata?.type === PublishMediaType.Image)
      return true
    if (media.metadata?.type === PublishMediaType.Video)
      return false
    return hasUrlPathExtension(media.url, ['.jpg', '.jpeg', '.png', '.gif'])
  }

  private isVideo(media: PublishMediaInput): boolean {
    if (media.metadata?.type === PublishMediaType.Video)
      return true
    if (media.metadata?.type === PublishMediaType.Image)
      return false
    return hasUrlPathExtension(media.url, ['.mp4'])
  }

  private isUnsupportedVideo(media: PublishMediaInput): boolean {
    return media.metadata?.type === PublishMediaType.Video
      && hasUrlPathExtension(media.url, ['.mov', '.webm', '.avi', '.mkv', '.flv', '.wmv'])
  }

  private buildPermalink(postUrn: string): string {
    return `https://www.linkedin.com/feed/update/${postUrn}`
  }

  private buildPublishResult(
    postUrn: string,
    dataOption: LinkedInResolvedOwner,
  ): PublishProviderResult<LinkedInPublishDataOption> {
    return {
      status: 200,
      platformWorkId: postUrn,
      permalink: this.buildPermalink(postUrn),
      dataOption: this.buildDataOption(dataOption),
    }
  }

  private parseOption(option: LinkedInOption | undefined): LinkedInOption {
    return LinkedInOptionSchema.parse(option ?? {})
  }

  private buildDataOption(dataOption: LinkedInPublishDataOption): LinkedInPublishDataOption {
    return LinkedInPublishDataOptionSchema.parse(dataOption)
  }

  private buildOwnerDataOption(dataOption: LinkedInResolvedOwner): LinkedInResolvedOwner {
    LinkedInPublishDataOptionSchema.parse(dataOption)
    return dataOption
  }
}
