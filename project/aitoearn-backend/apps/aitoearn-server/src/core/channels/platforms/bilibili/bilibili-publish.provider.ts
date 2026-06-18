import type {
  NormalizedPublishTask,
  PublishFinalizeInput,
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
import type { BilibiliPublishDataOption } from './bilibili.interface'
import type { BilibiliOption } from './bilibili.schema'
import { Injectable, Logger } from '@nestjs/common'
import { AccountType, ResponseCode } from '@yikart/common'
import { PlatformErrorCategory } from '../platforms.exception'
import {
  parseTopicsFromBody,
  PublishValidationField,
  PublishValidationIssueCode,
  stripTopicsFromBody,
} from '../publish.schema'
import { BILIBILI_METADATA, BILIBILI_PUBLIC_VIDEO_ID_PATTERN } from './bilibili.constants'
import { BilibiliPlatformException } from './bilibili.exception'
import { BilibiliArchiveReviewState, BilibiliPublishDataOptionSchema } from './bilibili.interface'
import { BilibiliService } from './bilibili.service'

@Injectable()
export class BilibiliPublishProvider implements PublishProvider<BilibiliOption, BilibiliPublishDataOption> {
  private readonly logger = new Logger(BilibiliPublishProvider.name)

  readonly platform = AccountType.Bilibili

  constructor(private readonly bilibiliService: BilibiliService) {}

  async validate(input: PublishValidateInput<BilibiliOption>): Promise<PublishValidationResult> {
    const issues: PublishValidationResult['issues'] = []

    // Bilibili requires at least one topic tag
    const tag = parseTopicsFromBody(input.content.body).join(',')
    if (!tag) {
      issues.push({
        code: PublishValidationIssueCode.Required,
        path: ['content', 'topics'],
        params: { field: PublishValidationField.Topic },
      })
    }
    const maxTagTotalLength = BILIBILI_METADATA.topic.maxTotalLength
    if (maxTagTotalLength !== undefined && tag.length > maxTagTotalLength) {
      issues.push({
        code: PublishValidationIssueCode.TooBig,
        path: ['content', 'topics'],
        params: { field: PublishValidationField.Topic, maximum: maxTagTotalLength, unit: 'characters' },
      })
    }

    return { valid: issues.length === 0, issues: issues.length ? issues : undefined }
  }

  async normalize(input: PublishNormalizeInput<BilibiliOption>): Promise<NormalizedPublishTask<BilibiliOption>> {
    return {
      content: input.content,
      option: input.option,
    }
  }

  async publish(input: PublishPublishInput<BilibiliOption>): Promise<PublishProviderResult<BilibiliPublishDataOption>> {
    const video = input.content.media[0]
    if (!video) {
      const exception = BilibiliPlatformException.validation({
        code: ResponseCode.ChannelPlatformMediaUnsupported,
        category: PlatformErrorCategory.MediaProcessingFailed,
        context: { endpoint: 'publish', taskId: input.taskId, accountId: input.accountId },
      })
      this.logger.warn(exception, 'Bilibili publish video missing')
      throw exception
    }

    const option = input.option
    if (!option) {
      const exception = BilibiliPlatformException.validation({
        code: ResponseCode.ChannelPlatformPublishOptionMissing,
        category: PlatformErrorCategory.Validation,
        context: { endpoint: 'publish', taskId: input.taskId, accountId: input.accountId },
      })
      this.logger.warn(exception, 'Bilibili publish option missing')
      throw exception
    }

    const result = await this.bilibiliService.submitArchive(input.credential.accessToken, {
      title: input.content.title ?? 'Untitled',
      description: stripTopicsFromBody(input.content.body) ?? '',
      videoUrl: video.url,
      coverUrl: input.content.cover?.url,
      topics: parseTopicsFromBody(input.content.body),
      tid: option.tid,
      copyright: option.copyright,
      noReprint: option.no_reprint,
      source: option.source,
      topicId: option.topic_id,
      missionId: option.mission_id,
    })

    return {
      status: 202,
      platformWorkId: result.resourceId,
      dataOption: {
        resourceId: result.resourceId,
      },
    }
  }

  async finalize(input: PublishFinalizeInput<BilibiliPublishDataOption>): Promise<PublishProviderResult<BilibiliPublishDataOption>> {
    try {
      const details = await this.bilibiliService.getArchiveDetail(
        input.credential.accessToken,
        input.platformWorkId,
      )
      const dataOption = this.parseDataOption(input.dataOption)
      const finalVideoId = this.resolveFinalVideoId(details.resourceId, dataOption)

      if (details.state !== BilibiliArchiveReviewState.Open || !finalVideoId) {
        return {
          status: 202,
          platformWorkId: input.platformWorkId,
          mediaJobs: input.mediaJobs,
          dataOption,
        }
      }

      return {
        status: 200,
        platformWorkId: finalVideoId,
        permalink: this.buildWorkLink(finalVideoId),
        dataOption: {
          ...dataOption,
          finalVideoId,
        },
      }
    }
    catch (err) {
      this.logger.warn(err, `Bilibili archive finalize failed for ${input.platformWorkId}`)
      return {
        status: 202,
        platformWorkId: input.platformWorkId,
        mediaJobs: input.mediaJobs,
        dataOption: this.parseDataOption(input.dataOption),
      }
    }
  }

  async verify(input: PublishVerifyInput<BilibiliPublishDataOption>): Promise<PublishVerifyResult> {
    try {
      const details = await this.bilibiliService.getArchiveDetail(
        input.credential.accessToken,
        input.platformWorkId,
      )
      const finalVideoId = this.resolveFinalVideoId(
        details.resourceId,
        this.parseDataOption(input.dataOption),
      )

      const isPublished = details.state === BilibiliArchiveReviewState.Open && Boolean(finalVideoId)

      return {
        published: isPublished,
        platformWorkId: finalVideoId ?? input.platformWorkId,
        permalink: finalVideoId ? this.buildWorkLink(finalVideoId) : undefined,
      }
    }
    catch (err) {
      this.logger.warn(err, `Bilibili archive verify failed for ${input.platformWorkId}`)
      return { published: false }
    }
  }

  async update(input: PublishUpdateInput<BilibiliOption>): Promise<PublishProviderResult<BilibiliPublishDataOption>> {
    this.logger.warn(`Bilibili video update not supported for ${input.platformWorkId}`)

    return {
      status: 200,
      platformWorkId: input.platformWorkId,
    }
  }

  private parseDataOption(dataOption: BilibiliPublishDataOption | undefined): BilibiliPublishDataOption {
    const parsed = BilibiliPublishDataOptionSchema.safeParse(dataOption ?? {})
    if (parsed.success) {
      return parsed.data
    }

    this.logger.warn({
      issues: parsed.error.issues,
    }, 'Bilibili publish dataOption invalid')
    return {}
  }

  private resolveFinalVideoId(resourceId: string | undefined, dataOption: BilibiliPublishDataOption): string | undefined {
    if (dataOption.finalVideoId && this.isPublicVideoId(dataOption.finalVideoId)) {
      return dataOption.finalVideoId
    }
    if (resourceId && this.isPublicVideoId(resourceId)) {
      return resourceId
    }
    return undefined
  }

  private isPublicVideoId(value: string): boolean {
    return BILIBILI_PUBLIC_VIDEO_ID_PATTERN.test(value.trim())
  }

  private buildWorkLink(videoId: string): string {
    return `https://www.bilibili.com/video/${videoId}`
  }
}
