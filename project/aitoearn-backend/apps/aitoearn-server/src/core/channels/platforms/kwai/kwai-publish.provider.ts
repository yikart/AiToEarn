import type {
  NormalizedPublishTask,
  PublishFinalizeInput,
  PublishNormalizeInput,
  PublishProvider,
  PublishProviderResult,
  PublishPublishInput,
  PublishValidateInput,
  PublishValidationResult,
  PublishVerifyInput,
  PublishVerifyResult,
} from '../platforms.interface'
import type { KwaiDataOption, KwaiOption } from './kwai.schema'
import { Injectable, Logger } from '@nestjs/common'
import { AccountType, ResponseCode } from '@yikart/common'
import { MediaService } from '../../media/media.service'
import { PlatformErrorCategory } from '../platforms.exception'
import { KwaiPublishResultStatus } from './kwai.constants'
import { KwaiPlatformException } from './kwai.exception'
import { KwaiDataOptionSchema } from './kwai.schema'
import { KwaiService } from './kwai.service'

const FRAGMENT_SIZE = 4 * 1024 * 1024 // 4MB per fragment

@Injectable()
export class KwaiPublishProvider implements PublishProvider<KwaiOption, KwaiDataOption> {
  private readonly logger = new Logger(KwaiPublishProvider.name)

  readonly platform = AccountType.Kwai

  constructor(
    private readonly kwaiService: KwaiService,
    private readonly mediaService: MediaService,
  ) {}

  async validate(_input: PublishValidateInput<KwaiOption>): Promise<PublishValidationResult> {
    return { valid: true }
  }

  async normalize(input: PublishNormalizeInput<KwaiOption>): Promise<NormalizedPublishTask<KwaiOption>> {
    return {
      content: input.content,
      option: input.option,
    }
  }

  async publish(input: PublishPublishInput<KwaiOption>): Promise<PublishProviderResult<KwaiDataOption>> {
    const video = input.content.media[0]
    if (!video) {
      throw KwaiPlatformException.validation({
        code: ResponseCode.ChannelPlatformMediaUnsupported,
        category: PlatformErrorCategory.MediaProcessingFailed,
        context: {
          endpoint: 'publish',
          taskId: input.taskId,
          accountId: input.accountId,
        },
      })
    }

    // Step 1: Initialize upload
    const uploadInit = await this.kwaiService.startUpload(input.credential.accessToken)

    // Step 2: Download video and upload in fragments
    const videoBuffer = await this.mediaService.getBuffer({
      platform: this.platform,
      endpoint: 'publish.downloadVideo',
      url: video.url,
      taskId: input.taskId,
      accountId: input.accountId,
    })
    const fragmentCount = Math.ceil(videoBuffer.length / FRAGMENT_SIZE)

    for (let i = 0; i < fragmentCount; i++) {
      const start = i * FRAGMENT_SIZE
      const end = Math.min(start + FRAGMENT_SIZE, videoBuffer.length)
      const fragment = videoBuffer.subarray(start, end)

      await this.kwaiService.fragmentUploadVideo(
        uploadInit.uploadToken,
        i,
        uploadInit.endpoint,
        fragment,
      )
    }

    // Step 3: Complete fragment upload
    await this.kwaiService.completeFragmentUpload(
      uploadInit.uploadToken,
      fragmentCount,
      uploadInit.endpoint,
    )

    // Step 4: Build caption with topics
    const caption = this.buildCaption(input.content.body)

    // Step 5: Fetch cover image
    if (!input.content.cover?.url) {
      throw KwaiPlatformException.validation({
        code: ResponseCode.ChannelPlatformMediaUnsupported,
        category: PlatformErrorCategory.MediaProcessingFailed,
        context: {
          endpoint: 'publish',
          taskId: input.taskId,
          accountId: input.accountId,
        },
      })
    }
    const coverBuffer = await this.mediaService.getBuffer({
      platform: this.platform,
      endpoint: 'publish.downloadCover',
      url: input.content.cover.url,
      taskId: input.taskId,
      accountId: input.accountId,
    })
    const coverBlob = new Blob([new Uint8Array(coverBuffer)], { type: 'image/jpeg' })
    const publishOption: { stereo_type?: string, merchant_product_id?: string } = {}
    if (input.option?.stereo_type) {
      publishOption.stereo_type = input.option.stereo_type
    }
    if (input.option?.merchant_product_id) {
      publishOption.merchant_product_id = input.option.merchant_product_id
    }

    // Step 6: Publish the video
    const publishResult = await this.kwaiService.publishVideo(
      input.credential.accessToken,
      caption,
      coverBlob,
      uploadInit.uploadToken,
      Object.keys(publishOption).length ? publishOption : undefined,
    )

    return {
      status: KwaiPublishResultStatus.Processing,
      platformWorkId: publishResult.photoId,
      dataOption: this.buildDataOption({
        photoId: publishResult.photoId,
        ...(publishResult.playUrl ? { publishPlayUrl: publishResult.playUrl } : {}),
      }),
    }
  }

  async verify(input: PublishVerifyInput<KwaiDataOption>): Promise<PublishVerifyResult> {
    const dataOption = this.parseDataOption(input.dataOption, input.taskId)
    const photoId = dataOption.photoId ?? input.platformWorkId

    try {
      const videoInfo = await this.kwaiService.getVideoInfo(
        input.credential.accessToken,
        photoId,
      )

      const resolvedPhotoId = videoInfo.photoId || photoId
      return {
        published: !videoInfo.pending,
        platformWorkId: resolvedPhotoId,
        permalink: videoInfo.pending ? undefined : this.buildWorkLink(resolvedPhotoId),
      }
    }
    catch (err) {
      this.logger.warn(err, `Failed to verify Kwai video ${photoId}`)
      return { published: false }
    }
  }

  async finalize(input: PublishFinalizeInput<KwaiDataOption>): Promise<PublishProviderResult<KwaiDataOption>> {
    const dataOption = this.parseDataOption(input.dataOption, input.taskId)
    const photoId = dataOption.photoId ?? input.platformWorkId

    // Kwai publishes asynchronously; finalize checks if the video is ready
    try {
      const videoInfo = await this.kwaiService.getVideoInfo(
        input.credential.accessToken,
        photoId,
      )
      const resolvedPhotoId = videoInfo.photoId || photoId
      const updatedDataOption = this.mergeVideoInfoDataOption(dataOption, resolvedPhotoId, videoInfo.playUrl)

      if (videoInfo.pending) {
        // Still processing, return 202 to indicate polling should continue
        return {
          status: KwaiPublishResultStatus.Processing,
          platformWorkId: resolvedPhotoId,
          mediaJobs: input.mediaJobs,
          dataOption: updatedDataOption,
        }
      }

      return {
        status: KwaiPublishResultStatus.Published,
        platformWorkId: resolvedPhotoId,
        permalink: this.buildWorkLink(resolvedPhotoId),
        dataOption: updatedDataOption,
      }
    }
    catch (err) {
      this.logger.error(err, `Failed to check Kwai video status for ${photoId}`)
      if (err instanceof KwaiPlatformException && !err.retryable) {
        throw err
      }
      return {
        status: KwaiPublishResultStatus.Processing,
        platformWorkId: photoId,
        mediaJobs: input.mediaJobs,
        dataOption,
      }
    }
  }

  private buildCaption(body?: string): string {
    return (body ?? '').trim()
  }

  private buildWorkLink(photoId: string): string {
    return `https://www.kuaishou.com/short-video/${photoId}`
  }

  private parseDataOption(dataOption: KwaiDataOption | undefined, taskId: string): KwaiDataOption {
    const result = KwaiDataOptionSchema.safeParse(dataOption ?? {})
    if (result.success) {
      return result.data
    }

    throw KwaiPlatformException.validation({
      code: ResponseCode.ChannelPlatformApiFailed,
      category: PlatformErrorCategory.MediaProcessingFailed,
      context: {
        endpoint: 'publish.dataOption',
        taskId,
      },
    })
  }

  private mergeVideoInfoDataOption(
    dataOption: KwaiDataOption,
    photoId: string,
    playUrl: string,
  ): KwaiDataOption {
    return this.buildDataOption({
      ...dataOption,
      photoId,
      ...(playUrl ? { latestPlayUrl: playUrl } : {}),
    })
  }

  private buildDataOption(dataOption: KwaiDataOption): KwaiDataOption {
    return KwaiDataOptionSchema.parse(dataOption)
  }
}
