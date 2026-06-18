import type { NormalizedPublishTask, PublishCancelInput, PublishCancelResult, PublishFinalizeInput, PublishMediaInput, PublishMediaJob, PublishNormalizeInput, PublishProvider, PublishProviderResult, PublishPublishInput, PublishValidateInput, PublishValidationResult, PublishVerifyInput, PublishVerifyResult } from '../platforms.interface'
import type { ThreadsCreateContainerInput } from './threads.interface'
import type { ThreadsOption, ThreadsPublishDataOption } from './threads.schema'
import { Injectable, Logger } from '@nestjs/common'
import { AccountType, ResponseCode } from '@yikart/common'
import { PlatformErrorCategory } from '../platforms.exception'
import {

  PublishMediaType,

} from '../platforms.interface'
import { hasUrlPathExtension } from '../platforms.utils'
import {
  parseTopicsFromBody,
  PublishValidationField,
  PublishValidationIssue,
  PublishValidationIssueCode,
  stripTopicsFromBody,
} from '../publish.schema'
import { ThreadsPlatformException } from './threads.exception'
import { ThreadsContainerStatusCode, ThreadsMediaType, ThreadsPublishResultStatus } from './threads.interface'
import { ThreadsPublishDataOptionSchema } from './threads.schema'
import { ThreadsService } from './threads.service'

@Injectable()
export class ThreadsPublishProvider implements PublishProvider<ThreadsOption, ThreadsPublishDataOption> {
  private readonly logger = new Logger(ThreadsPublishProvider.name)

  readonly platform = AccountType.Threads

  constructor(private readonly threadsService: ThreadsService) {}

  async validate(input: PublishValidateInput<ThreadsOption>): Promise<PublishValidationResult> {
    const issues: PublishValidationResult['issues'] = []
    const unsupportedMediaIssues = this.validateUnsupportedMedia(input.content.media)
    issues.push(...unsupportedMediaIssues)

    if (!input.content.media.length && !this.buildPostText(input.content.body)) {
      issues.push({
        code: PublishValidationIssueCode.Required,
        path: ['content', 'body'],
        params: { field: PublishValidationField.Text },
      })
    }

    return { valid: issues.length === 0, issues: issues.length ? issues : undefined }
  }

  async normalize(input: PublishNormalizeInput<ThreadsOption>): Promise<NormalizedPublishTask<ThreadsOption>> {
    return {
      content: input.content,
      option: input.option,
    }
  }

  async publish(input: PublishPublishInput<ThreadsOption>): Promise<PublishProviderResult<ThreadsPublishDataOption>> {
    const imageCount = input.content.media.filter(m => this.isImage(m)).length
    const videoCount = input.content.media.filter(m => this.isVideo(m)).length
    const unsupportedMedia = input.content.media.find(m => !this.isImage(m) && !this.isVideo(m))
    if (unsupportedMedia) {
      throw ThreadsPlatformException.validation({
        code: ResponseCode.ChannelPlatformMediaUnsupported,
        category: PlatformErrorCategory.MediaProcessingFailed,
        context: {
          endpoint: 'publish.media',
          taskId: input.taskId,
          accountId: input.accountId,
          metadata: { mediaUrl: unsupportedMedia.url },
        },
      })
    }

    if (videoCount > 0) {
      return this.publishVideo(input)
    }

    if (imageCount > 1) {
      return this.publishCarousel(input)
    }

    if (imageCount === 1) {
      return this.publishSingleImage(input)
    }

    return this.publishText(input)
  }

  async finalize(input: PublishFinalizeInput<ThreadsPublishDataOption>): Promise<PublishProviderResult<ThreadsPublishDataOption>> {
    const dataOption = this.parseDataOption(input.dataOption, input.taskId)
    const mediaStatuses = await Promise.all(
      input.mediaJobs.map(job =>
        this.threadsService.getContainerStatus(job.mediaId, input.credential.accessToken),
      ),
    )

    const hasFailed = mediaStatuses.some(s => this.isFailedStatus(s.status))
    if (hasFailed) {
      throw ThreadsPlatformException.validation({
        code: ResponseCode.ChannelPlatformMediaProcessingFailed,
        category: PlatformErrorCategory.MediaProcessingFailed,
        context: {
          endpoint: 'finalize',
          taskId: input.taskId,
          platformWorkId: input.platformWorkId,
        },
      })
    }

    const allReady = mediaStatuses.every(s => this.isReadyStatus(s.status))
    if (!allReady) {
      return {
        status: ThreadsPublishResultStatus.Processing,
        ...(input.platformWorkId ? { platformWorkId: input.platformWorkId } : {}),
        mediaJobs: input.mediaJobs,
        dataOption,
      }
    }

    if (input.mediaJobs.length === 1) {
      const result = await this.threadsService.publishContainer(
        input.credential.platformUid!,
        input.credential.accessToken,
        input.mediaJobs[0].mediaId,
      )

      const permalink = await this.fetchPermalink(
        result.id,
        input.credential.accessToken,
      )

      return {
        status: ThreadsPublishResultStatus.Published,
        platformWorkId: result.id,
        permalink,
        dataOption: this.toPublishedDataOption(dataOption),
      }
    }

    const childrenIds = input.mediaJobs.map(j => j.mediaId).join(',')
    const carouselContainer = await this.threadsService.createContainer(
      input.credential.platformUid!,
      input.credential.accessToken,
      {
        mediaType: ThreadsMediaType.Carousel,
        children: childrenIds,
        text: dataOption.text,
        ...this.getContainerOptionsFromDataOption(dataOption),
      },
    )

    return {
      status: ThreadsPublishResultStatus.Processing,
      mediaJobs: [
        {
          mediaId: carouselContainer.id,
          type: PublishMediaType.Image,
          url: '',
        },
      ],
      dataOption: ThreadsPublishDataOptionSchema.parse({
        ...dataOption,
        containerId: carouselContainer.id,
        childContainerIds: input.mediaJobs.map(job => job.mediaId),
        mediaType: ThreadsMediaType.Carousel,
      } satisfies ThreadsPublishDataOption),
    }
  }

  async verify(input: PublishVerifyInput<ThreadsPublishDataOption>): Promise<PublishVerifyResult> {
    try {
      this.parseDataOption(input.dataOption, input.taskId)
      const publishedPost = await this.threadsService.getPublishedPost(
        input.platformWorkId,
        input.credential.accessToken,
        'id,status,permalink',
      )

      return {
        published: Boolean(publishedPost.permalink),
        permalink: publishedPost.permalink,
        platformWorkId: publishedPost.id ?? input.platformWorkId,
      }
    }
    catch (err) {
      this.logger.warn(err, `Failed to verify Threads post ${input.platformWorkId}`)
      return { published: false }
    }
  }

  async cancel(input: PublishCancelInput): Promise<PublishCancelResult> {
    try {
      await this.threadsService.deletePublishedPost(
        input.platformWorkId,
        input.credential.accessToken,
      )
      return { canceled: true }
    }
    catch (err) {
      this.logger.error(err, `Failed to cancel thread ${input.platformWorkId}`)
      return { canceled: false }
    }
  }

  private async publishText(
    input: PublishPublishInput<ThreadsOption>,
  ): Promise<PublishProviderResult<ThreadsPublishDataOption>> {
    const option: Partial<ThreadsOption> = input.option ?? {}
    const post = this.buildPost(input.content.body)
    const containerInput: ThreadsCreateContainerInput = {
      mediaType: ThreadsMediaType.Text,
      text: post.text,
      ...this.getContainerOptions(option, post.topicTag),
    }
    if (option.auto_publish_text !== undefined) {
      containerInput.autoPublishText = option.auto_publish_text
    }

    const container = await this.threadsService.createContainer(
      input.credential.platformUid!,
      input.credential.accessToken,
      containerInput,
    )

    if (option.auto_publish_text === true) {
      const permalink = await this.fetchPermalink(
        container.id,
        input.credential.accessToken,
      )

      return {
        status: ThreadsPublishResultStatus.Published,
        platformWorkId: container.id,
        permalink,
      }
    }

    const result = await this.threadsService.publishContainer(
      input.credential.platformUid!,
      input.credential.accessToken,
      container.id,
    )

    const permalink = await this.fetchPermalink(
      result.id,
      input.credential.accessToken,
    )

    return {
      status: ThreadsPublishResultStatus.Published,
      platformWorkId: result.id,
      permalink,
    }
  }

  private async publishSingleImage(
    input: PublishPublishInput<ThreadsOption>,
  ): Promise<PublishProviderResult<ThreadsPublishDataOption>> {
    const image = input.content.media.find(m => this.isImage(m))
    if (!image) {
      throw ThreadsPlatformException.validation({
        code: ResponseCode.ChannelPlatformMediaUnsupported,
        category: PlatformErrorCategory.MediaProcessingFailed,
        context: {
          endpoint: 'publishSingleImage',
          taskId: input.taskId,
          accountId: input.accountId,
        },
      })
    }

    const option: Partial<ThreadsOption> = input.option ?? {}
    const post = this.buildPost(input.content.body)

    const container = await this.threadsService.createContainer(
      input.credential.platformUid!,
      input.credential.accessToken,
      {
        mediaType: ThreadsMediaType.Image,
        imageUrl: image.url,
        text: post.text,
        ...this.getContainerOptions(option, post.topicTag),
      },
    )

    const result = await this.threadsService.publishContainer(
      input.credential.platformUid!,
      input.credential.accessToken,
      container.id,
    )

    const permalink = await this.fetchPermalink(
      result.id,
      input.credential.accessToken,
    )

    return {
      status: ThreadsPublishResultStatus.Published,
      platformWorkId: result.id,
      permalink,
    }
  }

  private async publishVideo(
    input: PublishPublishInput<ThreadsOption>,
  ): Promise<PublishProviderResult<ThreadsPublishDataOption>> {
    const video = input.content.media.find(m => this.isVideo(m))
    if (!video) {
      throw ThreadsPlatformException.validation({
        code: ResponseCode.ChannelPlatformMediaUnsupported,
        category: PlatformErrorCategory.MediaProcessingFailed,
        context: {
          endpoint: 'publishVideo',
          taskId: input.taskId,
          accountId: input.accountId,
        },
      })
    }

    const option: Partial<ThreadsOption> = input.option ?? {}
    const post = this.buildPost(input.content.body)

    const container = await this.threadsService.createContainer(
      input.credential.platformUid!,
      input.credential.accessToken,
      {
        mediaType: ThreadsMediaType.Video,
        videoUrl: video.url,
        text: post.text,
        ...this.getContainerOptions(option, post.topicTag),
      },
    )

    return {
      status: ThreadsPublishResultStatus.Processing,
      mediaJobs: [
        {
          mediaId: container.id,
          type: PublishMediaType.Video,
          url: video.url,
        },
      ],
      dataOption: ThreadsPublishDataOptionSchema.parse({
        containerId: container.id,
        mediaType: ThreadsMediaType.Video,
      } satisfies ThreadsPublishDataOption),
    }
  }

  private async publishCarousel(
    input: PublishPublishInput<ThreadsOption>,
  ): Promise<PublishProviderResult<ThreadsPublishDataOption>> {
    const images = input.content.media.filter(m => this.isImage(m))
    const containerIds: string[] = []
    const option: Partial<ThreadsOption> = input.option ?? {}
    const post = this.buildPost(input.content.body)
    const dataOption = ThreadsPublishDataOptionSchema.parse({
      mediaType: ThreadsMediaType.Carousel,
      text: post.text,
      ...this.getContainerOptions(option, post.topicTag),
    } satisfies ThreadsPublishDataOption)

    // Create individual image containers
    for (const image of images) {
      const container = await this.threadsService.createContainer(
        input.credential.platformUid!,
        input.credential.accessToken,
        {
          mediaType: ThreadsMediaType.Image,
          imageUrl: image.url,
          isCarouselItem: true,
        },
      )
      containerIds.push(container.id)
    }

    return {
      status: ThreadsPublishResultStatus.Processing,
      mediaJobs: containerIds.map((id, index): PublishMediaJob => ({
        mediaId: id,
        type: PublishMediaType.Image,
        url: images[index].url,
      })),
      dataOption: ThreadsPublishDataOptionSchema.parse({
        ...dataOption,
        childContainerIds: containerIds,
      } satisfies ThreadsPublishDataOption),
    }
  }

  private async fetchPermalink(
    objectId: string,
    accessToken: string,
  ): Promise<string> {
    try {
      const publishedPost = await this.threadsService.getPublishedPost(
        objectId,
        accessToken,
        'permalink',
      )
      if (publishedPost.permalink)
        return publishedPost.permalink
    }
    catch (err) {
      this.logger.warn(err, `Failed to fetch permalink for ${objectId}`)
    }
    throw ThreadsPlatformException.validation({
      code: ResponseCode.ChannelPlatformResponseInvalid,
      category: PlatformErrorCategory.PlatformUnavailable,
      context: {
        endpoint: 'fetchPermalink',
        platformWorkId: objectId,
      },
    })
  }

  private buildPostText(body: string | undefined): string {
    return (stripTopicsFromBody(body) ?? '').trim()
  }

  private buildPost(body: string | undefined): { text: string, topicTag?: string } {
    const topics = parseTopicsFromBody(body)
    return {
      text: this.buildPostText(body),
      ...(topics[0] ? { topicTag: topics[0] } : {}),
    }
  }

  private getContainerOptions(option: Partial<ThreadsOption>, topicTag: string | undefined) {
    return {
      ...(topicTag ? { topicTag } : {}),
      ...(option.location_id ? { locationId: option.location_id } : {}),
      ...(option.reply_to_id ? { replyToId: option.reply_to_id } : {}),
      ...(option.reply_control ? { replyControl: option.reply_control } : {}),
      ...(option.allowlisted_country_codes?.length ? { allowlistedCountryCodes: option.allowlisted_country_codes } : {}),
      ...(option.alt_text ? { altText: option.alt_text } : {}),
      ...(option.link_attachment ? { linkAttachmentUrl: option.link_attachment } : {}),
      ...(option.quote_post_id ? { quotePostId: option.quote_post_id } : {}),
    }
  }

  private getContainerOptionsFromDataOption(dataOption: ThreadsPublishDataOption): Partial<ThreadsCreateContainerInput> {
    return {
      ...(dataOption.topicTag ? { topicTag: dataOption.topicTag } : {}),
      ...(dataOption.locationId ? { locationId: dataOption.locationId } : {}),
      ...(dataOption.replyToId ? { replyToId: dataOption.replyToId } : {}),
      ...(dataOption.replyControl ? { replyControl: dataOption.replyControl } : {}),
      ...(dataOption.allowlistedCountryCodes?.length ? { allowlistedCountryCodes: dataOption.allowlistedCountryCodes } : {}),
      ...(dataOption.altText ? { altText: dataOption.altText } : {}),
      ...(dataOption.linkAttachmentUrl ? { linkAttachmentUrl: dataOption.linkAttachmentUrl } : {}),
      ...(dataOption.quotePostId ? { quotePostId: dataOption.quotePostId } : {}),
    }
  }

  private parseDataOption(dataOption: ThreadsPublishDataOption | undefined, taskId: string): ThreadsPublishDataOption {
    const result = ThreadsPublishDataOptionSchema.safeParse(dataOption ?? {})
    if (result.success) {
      return result.data
    }

    throw ThreadsPlatformException.validation({
      code: ResponseCode.ChannelPlatformResponseInvalid,
      category: PlatformErrorCategory.MediaProcessingFailed,
      context: {
        endpoint: 'publish.dataOption',
        taskId,
      },
    })
  }

  private toPublishedDataOption(dataOption: ThreadsPublishDataOption): ThreadsPublishDataOption {
    return ThreadsPublishDataOptionSchema.parse({
      mediaType: dataOption.mediaType,
      text: dataOption.text,
      topicTag: dataOption.topicTag,
      locationId: dataOption.locationId,
      replyToId: dataOption.replyToId,
      replyControl: dataOption.replyControl,
      allowlistedCountryCodes: dataOption.allowlistedCountryCodes,
      altText: dataOption.altText,
      linkAttachmentUrl: dataOption.linkAttachmentUrl,
      quotePostId: dataOption.quotePostId,
    } satisfies ThreadsPublishDataOption)
  }

  private isReadyStatus(status: ThreadsContainerStatusCode | undefined): boolean {
    return status === ThreadsContainerStatusCode.Finished
      || status === ThreadsContainerStatusCode.Ready
  }

  private isFailedStatus(status: ThreadsContainerStatusCode | undefined): boolean {
    return status === ThreadsContainerStatusCode.Error
      || status === ThreadsContainerStatusCode.Expired
      || status === ThreadsContainerStatusCode.LegacyFailed
  }

  private validateUnsupportedMedia(mediaList: PublishMediaInput[]): PublishValidationIssue[] {
    return mediaList
      .map((media, index) => ({ media, index }))
      .filter(({ media }) => !this.isImage(media) && !this.isVideo(media))
      .map(({ index }) => ({
        code: PublishValidationIssueCode.UnsupportedFormat,
        path: ['content', 'media', index],
        params: {
          field: PublishValidationField.Media,
          formats: ['jpg', 'jpeg', 'png', 'mp4', 'mov'],
        },
      }))
  }

  private isImage(media: PublishMediaInput): boolean {
    if (hasUrlPathExtension(media.url, ['.webp'])) {
      return false
    }
    if (media.metadata?.type === PublishMediaType.Image)
      return true
    if (media.metadata?.type === PublishMediaType.Video)
      return false
    return hasUrlPathExtension(media.url, ['.jpg', '.jpeg', '.png'])
  }

  private isVideo(media: PublishMediaInput): boolean {
    if (media.metadata?.type === PublishMediaType.Video)
      return true
    if (media.metadata?.type === PublishMediaType.Image)
      return false
    return hasUrlPathExtension(media.url, ['.mp4', '.mov'])
  }
}
