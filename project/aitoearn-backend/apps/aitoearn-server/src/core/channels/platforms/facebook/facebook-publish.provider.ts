import type { NormalizedPublishTask, PlatformMediaRules, PublishCancelInput, PublishCancelResult, PublishFinalizeInput, PublishMediaInput, PublishNormalizeInput, PublishProvider, PublishProviderResult, PublishPublishInput, PublishValidateInput, PublishValidationResult, PublishVerifyInput, PublishVerifyResult } from '../platforms.interface'
import type { FacebookDataOption } from './facebook.interface'
import type { FacebookOption } from './facebook.schema'
import { Injectable, Logger } from '@nestjs/common'
import { AccountType, ResponseCode } from '@yikart/common'
import { PlatformErrorCategory } from '../platforms.exception'
import {

  PublishMediaType,

} from '../platforms.interface'
import { hasUrlPathExtension } from '../platforms.utils'
import { PublishValidationCombination, PublishValidationField, PublishValidationIssueCode } from '../publish.schema'
import { FacebookContentCategory, FacebookVideoStatus } from './facebook.enum'
import { FacebookPlatformException } from './facebook.exception'
import { FacebookDataOptionSchema } from './facebook.interface'
import { FacebookService } from './facebook.service'

const FACEBOOK_POST_MEDIA_RULES: PlatformMediaRules = {
  imageFormats: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'],
  videoFormats: ['mp4', 'mov', 'avi'],
  maxImageSize: 10 * 1024 * 1024,
  maxVideoSize: 1024 * 1024 * 1024,
}

const FACEBOOK_REEL_MEDIA_RULES: PlatformMediaRules = {
  videoFormats: ['mp4'],
  maxVideoSize: 1024 * 1024 * 1024,
  minVideoDuration: 3,
  maxVideoDuration: 90,
}

const FACEBOOK_STORY_MEDIA_RULES: PlatformMediaRules = {
  imageFormats: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'],
  videoFormats: ['mp4', 'mov'],
  maxImageSize: 4 * 1024 * 1024,
  maxVideoSize: 1000 * 1024 * 1024,
  minVideoDuration: 3,
  maxVideoDuration: 60,
}

@Injectable()
export class FacebookPublishProvider implements PublishProvider<FacebookOption, FacebookDataOption> {
  private readonly logger = new Logger(FacebookPublishProvider.name)

  readonly platform = AccountType.Facebook

  constructor(private readonly facebookService: FacebookService) {}

  async validate(input: PublishValidateInput<FacebookOption>): Promise<PublishValidationResult> {
    const issues: PublishValidationResult['issues'] = []

    const option: Partial<FacebookOption> = input.option ?? {}
    const contentCategory = this.resolveContentCategory(option)
    const imageCount = input.content.media.filter(m => this.isImage(m)).length
    const videoCount = input.content.media.filter(m => this.isVideo(m)).length

    if (contentCategory === FacebookContentCategory.Post) {
      return { valid: true }
    }

    if (contentCategory === FacebookContentCategory.Reel) {
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
      if (imageCount > 0) {
        issues.push({
          code: PublishValidationIssueCode.InvalidCombination,
          path: ['content', 'media'],
          params: { combination: PublishValidationCombination.ReelImage },
        })
      }
    }

    if (contentCategory === FacebookContentCategory.Story) {
      if (input.content.media.length === 0) {
        issues.push({
          code: PublishValidationIssueCode.Required,
          path: ['content', 'media'],
          params: { field: PublishValidationField.Media },
        })
      }
      if (input.content.media.length > 1) {
        issues.push({
          code: PublishValidationIssueCode.TooBig,
          path: ['content', 'media'],
          params: { field: PublishValidationField.Media, current: input.content.media.length, maximum: 1, unit: 'items' },
        })
      }
      if (imageCount > 0 && videoCount > 0) {
        issues.push({
          code: PublishValidationIssueCode.InvalidCombination,
          path: ['content', 'media'],
          params: { combination: PublishValidationCombination.ImageVideo },
        })
      }
      if (input.content.title) {
        issues.push({
          code: PublishValidationIssueCode.InvalidOption,
          path: ['content', 'title'],
          params: { field: PublishValidationField.Title },
        })
      }
      if (input.content.body) {
        issues.push({
          code: PublishValidationIssueCode.InvalidOption,
          path: ['content', 'body'],
          params: { field: PublishValidationField.Body },
        })
      }
      if (option.link) {
        issues.push({
          code: PublishValidationIssueCode.InvalidOption,
          path: ['option', 'link'],
          params: { field: PublishValidationField.Url },
        })
      }
    }

    return { valid: issues.length === 0, issues: issues.length ? issues : undefined }
  }

  resolveMediaRules(input: PublishValidateInput<FacebookOption>): PlatformMediaRules {
    const contentCategory = this.resolveContentCategory(input.option ?? {})
    if (contentCategory === FacebookContentCategory.Reel) {
      return FACEBOOK_REEL_MEDIA_RULES
    }
    if (contentCategory === FacebookContentCategory.Story) {
      return FACEBOOK_STORY_MEDIA_RULES
    }
    return FACEBOOK_POST_MEDIA_RULES
  }

  async normalize(input: PublishNormalizeInput<FacebookOption>): Promise<NormalizedPublishTask<FacebookOption>> {
    return {
      content: input.content,
      option: input.option,
    }
  }

  async publish(input: PublishPublishInput<FacebookOption>): Promise<PublishProviderResult<FacebookDataOption>> {
    const pageId = input.credential.platformUid
    if (!pageId) {
      throw FacebookPlatformException.validation({
        code: ResponseCode.ChannelPlatformAccountMissing,
        category: PlatformErrorCategory.Auth,
        context: {
          endpoint: 'publish',
          taskId: input.taskId,
          accountId: input.accountId,
        },
      })
    }
    const pageAccessToken = input.credential.accessToken

    const option: Partial<FacebookOption> = input.option ?? {}
    const contentCategory = this.resolveContentCategory(option)
    const videoMedia = input.content.media.find(m => this.isVideo(m))

    if (contentCategory === FacebookContentCategory.Story) {
      return this.publishStory(pageAccessToken, pageId, {
        imageUrl: input.content.media.find(m => this.isImage(m))?.url,
        videoUrl: videoMedia?.url,
        contentCategory,
      })
    }

    if (contentCategory === FacebookContentCategory.Reel) {
      if (!videoMedia) {
        throw FacebookPlatformException.validation({
          code: ResponseCode.ChannelPlatformMediaUnsupported,
          category: PlatformErrorCategory.MediaProcessingFailed,
          context: {
            endpoint: 'publish.reel',
            taskId: input.taskId,
            accountId: input.accountId,
          },
        })
      }
      return this.publishVideo(pageAccessToken, pageId, {
        videoUrl: videoMedia.url,
        title: input.content.title,
        description: input.content.body,
        contentCategory,
      })
    }

    if (videoMedia) {
      return this.publishVideo(pageAccessToken, pageId, {
        videoUrl: videoMedia.url,
        title: input.content.title,
        description: input.content.body,
        contentCategory,
      })
    }

    return this.publishFeedPost(pageAccessToken, pageId, {
      message: input.content.body,
      imageUrls: input.content.media
        .filter(m => this.isImage(m))
        .map(m => m.url),
      link: option.link,
    })
  }

  async cancel(input: PublishCancelInput): Promise<PublishCancelResult> {
    try {
      await this.facebookService.deletePost(
        input.credential.accessToken,
        input.platformWorkId,
      )
      return { canceled: true }
    }
    catch (err) {
      this.logger.error(err, `Failed to cancel Facebook post ${input.platformWorkId}`)
      return { canceled: false }
    }
  }

  async verify(input: PublishVerifyInput<FacebookDataOption>): Promise<PublishVerifyResult> {
    try {
      const postInfo = await this.facebookService.getPostInfo(
        input.credential.accessToken,
        input.platformWorkId,
      )
      if (!postInfo.permalinkUrl) {
        return {
          published: false,
          platformWorkId: postInfo.id,
        }
      }

      return {
        published: true,
        platformWorkId: postInfo.id,
        permalink: postInfo.permalinkUrl,
      }
    }
    catch (err) {
      this.logger.warn(err, `Failed to verify Facebook post ${input.platformWorkId}`)
      return { published: false }
    }
  }

  private async publishFeedPost(
    pageAccessToken: string,
    pageId: string,
    params: {
      message?: string
      imageUrls: string[]
      link?: string
    },
  ): Promise<PublishProviderResult<FacebookDataOption>> {
    let result: { id: string, post_id?: string }

    if (params.imageUrls.length === 0) {
      const post = await this.facebookService.createFeedPost(
        pageAccessToken,
        pageId,
        {
          message: params.message,
          link: params.link,
        },
      )
      result = post
    }
    else if (params.imageUrls.length === 1) {
      const post = await this.facebookService.createFeedPost(
        pageAccessToken,
        pageId,
        {
          message: params.message,
          imageUrl: params.imageUrls[0],
        },
      )
      result = post
    }
    else {
      const post = await this.facebookService.createMultiPhotoPost(
        pageAccessToken,
        pageId,
        {
          message: params.message,
          imageUrls: params.imageUrls,
        },
      )
      result = post
    }

    const platformWorkId = result.post_id ?? result.id

    return {
      status: 200,
      platformWorkId,
      permalink: this.buildPagePostPermalink(platformWorkId),
    }
  }

  private async publishVideo(
    pageAccessToken: string,
    pageId: string,
    params: {
      videoUrl: string
      title?: string
      description?: string
      contentCategory: FacebookContentCategory.Post | FacebookContentCategory.Reel
    },
  ): Promise<PublishProviderResult<FacebookDataOption>> {
    if (params.contentCategory === FacebookContentCategory.Reel) {
      const result = await this.facebookService.publishReel(
        pageAccessToken,
        pageId,
        {
          videoUrl: params.videoUrl,
          description: params.description,
          contentCategory: params.contentCategory,
        },
      )

      const permalink = this.buildVideoPermalink(result.videoId)
      const dataOption: FacebookDataOption = {
        content_category: FacebookContentCategory.Reel,
        videoId: result.videoId,
      }

      return {
        status: 202,
        platformWorkId: result.videoId,
        permalink,
        dataOption,
        mediaJobs: [
          {
            mediaId: result.videoId,
            type: PublishMediaType.Video,
            url: params.videoUrl,
          },
        ],
      }
    }

    const result = await this.facebookService.publishVideoPost(
      pageAccessToken,
      pageId,
      {
        title: params.title,
        description: params.description,
        videoUrl: params.videoUrl,
        contentCategory: params.contentCategory,
      },
    )

    const permalink = this.buildVideoPermalink(result.id)
    const dataOption: FacebookDataOption = {
      content_category: FacebookContentCategory.Post,
      videoId: result.id,
    }

    return {
      status: 200,
      platformWorkId: result.id,
      permalink,
      dataOption,
    }
  }

  private async publishStory(
    pageAccessToken: string,
    pageId: string,
    params: {
      imageUrl?: string
      videoUrl?: string
      contentCategory: FacebookContentCategory.Story
    },
  ): Promise<PublishProviderResult<FacebookDataOption>> {
    if (params.imageUrl) {
      const result = await this.facebookService.publishPhotoStory(
        pageAccessToken,
        pageId,
        { imageUrl: params.imageUrl },
      )

      const dataOption: FacebookDataOption = {
        content_category: FacebookContentCategory.Story,
        postId: result.postId,
        photoId: result.photoId,
      }

      return {
        status: 200,
        platformWorkId: result.postId,
        permalink: this.buildPagePostPermalink(result.postId),
        dataOption,
      }
    }

    if (params.videoUrl) {
      const result = await this.facebookService.publishVideoStory(
        pageAccessToken,
        pageId,
        {
          videoUrl: params.videoUrl,
          contentCategory: params.contentCategory,
        },
      )

      const dataOption: FacebookDataOption = {
        content_category: FacebookContentCategory.Story,
        postId: result.postId,
        videoId: result.videoId,
      }

      return {
        status: 202,
        platformWorkId: result.postId,
        permalink: this.buildPagePostPermalink(result.postId),
        dataOption,
        mediaJobs: [
          {
            mediaId: result.videoId,
            type: PublishMediaType.Video,
            url: params.videoUrl,
          },
        ],
      }
    }

    throw FacebookPlatformException.validation({
      code: ResponseCode.ChannelPlatformMediaUnsupported,
      category: PlatformErrorCategory.MediaProcessingFailed,
      context: { endpoint: 'publishStory' },
    })
  }

  async finalize(input: PublishFinalizeInput<FacebookDataOption>): Promise<PublishProviderResult<FacebookDataOption>> {
    const mediaJob = input.mediaJobs[0]
    if (!mediaJob) {
      return { status: 200, platformWorkId: input.platformWorkId }
    }

    const dataOption = FacebookDataOptionSchema.parse(input.dataOption ?? {})
    const contentCategory = dataOption.content_category
    if (contentCategory !== FacebookContentCategory.Reel && contentCategory !== FacebookContentCategory.Story) {
      throw FacebookPlatformException.validation({
        code: ResponseCode.ChannelPlatformResponseInvalid,
        category: PlatformErrorCategory.Validation,
        context: { endpoint: 'finalize.content_category', taskId: input.taskId },
      })
    }

    const savedPlatformWorkId = input.platformWorkId || dataOption.postId
    const videoId = dataOption.videoId ?? mediaJob.mediaId

    if (!savedPlatformWorkId && !videoId) {
      return {
        status: 202,
        mediaJobs: input.mediaJobs,
        dataOption,
      }
    }

    const videoStatus = await this.facebookService.getVideoStatus(
      input.credential.accessToken,
      videoId,
    )

    if (contentCategory === FacebookContentCategory.Reel) {
      const permalink = this.buildVideoPermalink(videoId)
      const reelDataOption: FacebookDataOption = {
        ...dataOption,
        videoId,
      }

      if (
        videoStatus.status === FacebookVideoStatus.Ready
        || videoStatus.status === FacebookVideoStatus.Published
      ) {
        return {
          status: 200,
          platformWorkId: videoId,
          permalink,
          dataOption: reelDataOption,
        }
      }

      return {
        status: 202,
        platformWorkId: videoId,
        permalink,
        mediaJobs: input.mediaJobs,
        dataOption: reelDataOption,
      }
    }

    if (
      videoStatus.status === FacebookVideoStatus.Ready
      || videoStatus.status === FacebookVideoStatus.Published
    ) {
      const platformWorkId = savedPlatformWorkId
      if (!platformWorkId) {
        return {
          status: 202,
          mediaJobs: input.mediaJobs,
          dataOption: {
            ...dataOption,
            videoId,
          },
        }
      }

      return {
        status: 200,
        platformWorkId,
        permalink: this.buildPagePostPermalink(platformWorkId),
        dataOption: {
          ...dataOption,
          postId: dataOption.postId ?? platformWorkId,
          videoId,
        },
      }
    }

    return {
      status: 202,
      platformWorkId: savedPlatformWorkId,
      permalink: savedPlatformWorkId
        ? this.buildPagePostPermalink(savedPlatformWorkId)
        : undefined,
      mediaJobs: input.mediaJobs,
      dataOption,
    }
  }

  private isImage(media: PublishMediaInput): boolean {
    if (media.metadata?.type === PublishMediaType.Image)
      return true
    if (media.metadata?.type === PublishMediaType.Video)
      return false
    return hasUrlPathExtension(media.url, ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'])
  }

  private isVideo(media: PublishMediaInput): boolean {
    if (media.metadata?.type === PublishMediaType.Video)
      return true
    if (media.metadata?.type === PublishMediaType.Image)
      return false
    return hasUrlPathExtension(media.url, ['.mp4', '.mov', '.avi'])
  }

  private resolveContentCategory(option: Partial<FacebookOption>): FacebookContentCategory {
    return option.content_category ?? FacebookContentCategory.Post
  }

  private buildPagePostPermalink(postId: string): string {
    return `https://www.facebook.com/${postId}`
  }

  private buildVideoPermalink(videoId: string): string {
    return `https://www.facebook.com/reel/${videoId}`
  }
}
