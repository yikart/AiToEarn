import type { NormalizedPublishTask, PublishCancelInput, PublishCancelResult, PublishFinalizeInput, PublishNormalizeInput, PublishProvider, PublishProviderResult, PublishPublishInput, PublishUpdateInput, PublishValidateInput, PublishValidationResult, PublishVerifyInput, PublishVerifyResult } from '../platforms.interface'
import type {
  DouyinDataOption,
  DouyinSharePublishResult,
} from './douyin.interface'
import type { DouyinOption } from './douyin.schema'
import { Injectable, Logger } from '@nestjs/common'
import { AssetsService } from '@yikart/assets'
import { AccountType, ResponseCode } from '@yikart/common'
import { ShortLinkService } from '../../../short-link/short-link.service'
import { PlatformErrorCategory } from '../platforms.exception'
import {

  PublishMediaType,

} from '../platforms.interface'
import {
  parseTopicInsertionsFromBody,
  stripTopicsFromBody,
} from '../publish.schema'
import { DOUYIN_METADATA } from './douyin.constants'
import { DouyinPlatformException } from './douyin.exception'
import { buildDouyinVideoWorkLink, DouyinMediaType, parseDouyinDataOption } from './douyin.interface'
import { DouyinDownloadType, DouyinPrivateStatus } from './douyin.schema'
import { DouyinService } from './douyin.service'

interface DouyinHandoffMediaInput {
  url: string
  metadata?: { type?: PublishMediaType }
}

interface DouyinHandoffContentInput {
  title?: string
  body?: string
  media: DouyinHandoffMediaInput[]
}

@Injectable()
export class DouyinPublishProvider implements PublishProvider<DouyinOption, DouyinDataOption> {
  private readonly logger = new Logger(DouyinPublishProvider.name)

  readonly platform = AccountType.Douyin

  constructor(
    private readonly douyinService: DouyinService,
    private readonly assetsService: AssetsService,
    private readonly shortLinkService: ShortLinkService,
  ) {}

  async validate(_input: PublishValidateInput<DouyinOption>): Promise<PublishValidationResult> {
    return { valid: true }
  }

  async normalize(input: PublishNormalizeInput<DouyinOption>): Promise<NormalizedPublishTask<DouyinOption>> {
    return {
      content: input.content,
      option: input.option,
    }
  }

  async publish(input: PublishPublishInput<DouyinOption>): Promise<PublishProviderResult<DouyinDataOption>> {
    if (!input.credential.platformUid) {
      throw DouyinPlatformException.validation({
        code: ResponseCode.ChannelPlatformAccountMissing,
        category: PlatformErrorCategory.Auth,
        context: {
          endpoint: 'publish',
          taskId: input.taskId,
          accountId: input.accountId,
        },
      })
    }

    return this.createHandoffPublishResult(input)
  }

  async createHandoffPublishResult(input: {
    taskId?: string
    accountId?: string
    content: DouyinHandoffContentInput
    option?: Partial<DouyinOption>
  }): Promise<PublishProviderResult<DouyinDataOption>> {
    const option: Partial<DouyinOption> = input.option ?? {}
    const media = this.resolvePublishMedia(input.content.media, input)
    if (!media.videoPath && !media.imageListPath?.length) {
      throw DouyinPlatformException.validation({
        code: ResponseCode.ChannelPlatformMediaUnsupported,
        category: PlatformErrorCategory.MediaProcessingFailed,
        context: {
          endpoint: 'publish',
          taskId: input.taskId,
          accountId: input.accountId,
        },
      })
    }

    const title = stripTopicsFromBody(input.content.body) ?? input.content.title ?? ''
    const titleHashtagList = parseTopicInsertionsFromBody(input.content.body)
    const shareId = await this.douyinService.getShareid()
    const schema = await this.douyinService.generateShareSchema({
      ...option,
      shareId,
      title,
      short_title: option.short_title ?? input.content.title,
      title_hashtag_list: titleHashtagList,
      download_type: option.download_type ?? DouyinDownloadType.Allow,
      private_status: option.private_status ?? DouyinPrivateStatus.Public,
      image_list_path: media.imageListPath,
      video_path: media.videoPath,
    })
    const shortLink = await this.shortLinkService.create(schema)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    return {
      status: 202,
      platformWorkId: shareId,
      userAction: {
        schema,
        shortLink,
        expiresAt,
        data: { shareId },
      },
      dataOption: {
        shareId,
        schema,
        shortLink,
        expiresAt: expiresAt.toISOString(),
      } satisfies DouyinDataOption,
    }
  }

  async finalize(input: PublishFinalizeInput<DouyinDataOption>): Promise<PublishProviderResult<DouyinDataOption>> {
    return this.resolveHandoffPublishResult(input.taskId, input.platformWorkId, input.dataOption)
  }

  async verify(input: PublishVerifyInput<DouyinDataOption>): Promise<PublishVerifyResult> {
    const dataOption = this.parseDataOption(input.taskId, input.dataOption)
    const shareId = dataOption?.shareId ?? input.platformWorkId
    if (!shareId) {
      return { published: false, platformWorkId: input.platformWorkId }
    }

    const result = await this.douyinService.getSharePublishResult(shareId)
    if (result.videoId) {
      return {
        published: true,
        platformWorkId: result.videoId,
        permalink: buildDouyinVideoWorkLink(result.videoId),
      }
    }

    return {
      published: false,
      platformWorkId: shareId,
    }
  }

  async cancel(input: PublishCancelInput): Promise<PublishCancelResult> {
    this.logger.warn({
      taskId: input.taskId,
      platformWorkId: input.platformWorkId,
    }, 'Douyin handoff cancel not supported')

    return { canceled: false }
  }

  async update(input: PublishUpdateInput<DouyinOption>): Promise<PublishProviderResult<DouyinDataOption>> {
    this.logger.warn({
      taskId: input.taskId,
      platformWorkId: input.platformWorkId,
    }, 'Douyin handoff update not supported')

    return {
      status: 200,
      platformWorkId: input.platformWorkId,
    }
  }

  private async resolveHandoffPublishResult(
    taskId: string,
    platformWorkId: string,
    rawDataOption?: DouyinDataOption,
  ): Promise<PublishProviderResult<DouyinDataOption>> {
    const dataOption = this.parseDataOption(taskId, rawDataOption)
    const shareId = dataOption?.shareId ?? platformWorkId
    if (!shareId) {
      return { status: 202, platformWorkId }
    }

    const result = await this.douyinService.getSharePublishResult(shareId)
    if (!result.videoId) {
      this.logger.log({
        taskId,
        shareId,
        itemId: result.itemId,
      }, 'Douyin handoff publish has no final video_id yet')
      return {
        status: 202,
        platformWorkId: shareId,
        dataOption: this.mergeDataOption(dataOption, shareId, result),
      }
    }

    const workLink = buildDouyinVideoWorkLink(result.videoId)
    return {
      status: 200,
      platformWorkId: result.videoId,
      permalink: workLink,
      dataOption: {
        ...this.mergeDataOption(dataOption, shareId, result),
        videoId: result.videoId,
        workLink,
      },
    }
  }

  private parseDataOption(taskId: string, dataOption?: DouyinDataOption): DouyinDataOption | undefined {
    if (!dataOption) {
      return undefined
    }
    const parsed = parseDouyinDataOption(dataOption)
    if (!parsed) {
      this.logger.warn({ taskId }, 'Douyin publish dataOption is invalid')
    }
    return parsed
  }

  private mergeDataOption(
    dataOption: DouyinDataOption | undefined,
    shareId: string,
    result: DouyinSharePublishResult,
  ): DouyinDataOption {
    return {
      shareId,
      ...(dataOption?.schema ? { schema: dataOption.schema } : {}),
      ...(dataOption?.shortLink ? { shortLink: dataOption.shortLink } : {}),
      ...(dataOption?.expiresAt ? { expiresAt: dataOption.expiresAt } : {}),
      ...(result.itemId ? { itemId: result.itemId } : dataOption?.itemId ? { itemId: dataOption.itemId } : {}),
      ...(dataOption?.videoId ? { videoId: dataOption.videoId } : {}),
      ...(dataOption?.workLink ? { workLink: dataOption.workLink } : {}),
      ...(dataOption?.webhook ? { webhook: dataOption.webhook } : {}),
    }
  }

  private resolvePublishMedia(
    media: DouyinHandoffMediaInput[],
    input: { taskId?: string, accountId?: string, platformWorkId?: string },
  ): { videoPath?: string, imageListPath?: string[] } {
    const videoList: string[] = []
    const imageList: string[] = []
    for (const item of media) {
      const type = this.getMediaType(item)
      if (type === DouyinMediaType.Video) {
        videoList.push(this.assetsService.buildUrl(item.url))
      }
      else if (type === DouyinMediaType.Image) {
        imageList.push(this.assetsService.buildUrl(item.url))
      }
    }

    if (videoList.length && imageList.length) {
      throw DouyinPlatformException.validation({
        code: ResponseCode.ChannelPlatformMediaUnsupported,
        category: PlatformErrorCategory.Validation,
        context: {
          endpoint: 'publish',
          taskId: input.taskId,
          accountId: input.accountId,
          platformWorkId: input.platformWorkId,
        },
      })
    }

    return {
      videoPath: videoList[0],
      imageListPath: imageList.length ? imageList : undefined,
    }
  }

  private getMediaType(media: DouyinHandoffMediaInput): DouyinMediaType | undefined {
    const metadataType = media.metadata?.type
    if (metadataType === PublishMediaType.Video) {
      return DouyinMediaType.Video
    }
    if (metadataType === PublishMediaType.Image) {
      return DouyinMediaType.Image
    }

    const url = media.url.toLowerCase()
    if ((DOUYIN_METADATA.mediaRules.videoFormats ?? []).some(format => url.endsWith(`.${format}`))) {
      return DouyinMediaType.Video
    }
    if ((DOUYIN_METADATA.mediaRules.imageFormats ?? []).some(format => url.endsWith(`.${format}`))) {
      return DouyinMediaType.Image
    }
    if (url.includes('blob:') || url.includes('storage')) {
      return DouyinMediaType.Video
    }
    return undefined
  }
}
