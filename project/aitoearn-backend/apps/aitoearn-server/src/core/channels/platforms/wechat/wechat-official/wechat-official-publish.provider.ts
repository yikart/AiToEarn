import type {
  NormalizedPublishTask,
  PublishCancelInput,
  PublishCancelResult,
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
} from '../../platforms.interface'
import type { WeChatArticle } from '../wechat.service'
import type { WeChatOfficialOption } from './wechat-official.schema'
import { Injectable, Logger } from '@nestjs/common'
import { AccountType } from '@yikart/common'
import { MediaService } from '../../../media/media.service'
import { hasUrlPathExtension } from '../../platforms.utils'
import { PublishValidationField, PublishValidationIssueCode } from '../../publish.schema'
import { WeChatService } from '../wechat.service'

/**
 * Publish provider for WeChat Official Accounts (微信公众号).
 *
 * Flow:
 * 1. Upload images (thumb_media_id required for articles)
 * 2. Create draft (draft/add)
 * 3. Submit for free publish (freepublish/submit)
 * 4. Poll publish status (freepublish/get)
 *
 * Supports:
 * - Article publishing with rich HTML content
 * - Multiple articles in a single batch
 * - Cover image upload
 * - Scheduled publishing (via WeChat's native schedule)
 */
@Injectable()
export class WeChatOfficialPublishProvider implements PublishProvider<WeChatOfficialOption> {
  private readonly logger = new Logger(WeChatOfficialPublishProvider.name)

  readonly platform = AccountType.WeChatOfficial

  constructor(
    private readonly wechatService: WeChatService,
    private readonly mediaService: MediaService,
  ) {}

  async validate(input: PublishValidateInput<WeChatOfficialOption>): Promise<PublishValidationResult> {
    const issues: PublishValidationResult['issues'] = []

    // Cover image is required for articles without media
    if (!input.content.cover?.url && !input.content.media.length) {
      issues.push({
        code: PublishValidationIssueCode.Required,
        path: ['content', 'cover'],
        params: { field: PublishValidationField.Cover },
      })
    }

    return { valid: issues.length === 0, issues: issues.length ? issues : undefined }
  }

  async normalize(input: PublishNormalizeInput<WeChatOfficialOption>): Promise<NormalizedPublishTask<WeChatOfficialOption>> {
    return {
      content: input.content,
      option: input.option,
    }
  }

  async publish(input: PublishPublishInput<WeChatOfficialOption>): Promise<PublishProviderResult> {
    // Step 1: Upload cover image for thumb_media_id
    let thumbMediaId = ''
    if (input.content.cover?.url) {
      thumbMediaId = await this.uploadThumbMedia(input.content.cover.url)
    }
    else if (input.content.media.length > 0) {
      // Use first media as thumb if no explicit cover
      thumbMediaId = await this.uploadThumbMedia(input.content.media[0].url)
    }

    // Step 2: Upload inline images and replace URLs with media IDs
    let processedContent = input.content.body ?? ''
    for (const media of input.content.media) {
      if (this.isImage(media.url)) {
        const imageUrl = await this.uploadContentImage(media.url)
        processedContent = processedContent.replace(
          media.url,
          imageUrl,
        )
      }
    }

    // Step 3: Build article
    const option: Partial<WeChatOfficialOption> = input.option ?? {}
    const article: WeChatArticle = {
      article_type: 'news',
      title: input.content.title ?? 'Untitled',
      content: processedContent,
      thumb_media_id: thumbMediaId,
      show_cover_pic: option.showCoverPic === true ? 1 : 0,
      digest: this.buildDigest(processedContent),
      content_source_url: option.sourceUrl,
    }

    // Step 4: Create draft
    const draftMediaId = await this.wechatService.addDraft([article])

    // Step 5: Submit for free publish
    const publishId = await this.wechatService.freePublish(draftMediaId)

    return {
      status: 102, // Processing
      platformWorkId: publishId,
      dataOption: {
        draftMediaId,
        publishId,
      },
    }
  }

  async finalize(input: PublishFinalizeInput): Promise<PublishProviderResult> {
    const status = await this.wechatService.getPublishStatus(input.platformWorkId)

    if (status.publishStatus === 1) {
      return {
        status: 202,
        platformWorkId: input.platformWorkId,
        mediaJobs: input.mediaJobs,
      }
    }

    if (status.publishStatus !== 0) {
      return {
        status: 500,
        platformWorkId: input.platformWorkId,
        dataOption: {
          publishStatus: status.publishStatus,
        },
      }
    }

    return {
      status: 200,
      platformWorkId: status.articleId ?? input.platformWorkId,
      permalink: status.articleUrl,
    }
  }

  async verify(input: PublishVerifyInput): Promise<PublishVerifyResult> {
    const publishId = input.platformWorkId
    if (!publishId) {
      return { published: false }
    }

    try {
      const status = await this.wechatService.getPublishStatus(publishId)

      // publish_status: 0=success, 1=being published, 2+=failed
      if (status.publishStatus === 0) {
        return {
          published: true,
          permalink: status.articleUrl,
          platformWorkId: status.articleId,
        }
      }

      if (status.publishStatus >= 2) {
        this.logger.error({
          publishId,
          publishStatus: status.publishStatus,
        }, 'WeChat publish failed')
        return { published: false }
      }

      // Still processing
      return { published: false }
    }
    catch (err) {
      this.logger.error(err, `Failed to verify publish status for ${publishId}`)
      return { published: false }
    }
  }

  async cancel(_input: PublishCancelInput): Promise<PublishCancelResult> {
    // WeChat Official Account does not support canceling a published article.
    // Once submitted, it cannot be retracted via API.
    this.logger.warn('WeChat Official Account does not support canceling published articles')
    return { canceled: false }
  }

  async update(_input: PublishUpdateInput<WeChatOfficialOption>): Promise<PublishProviderResult> {
    // WeChat Official Account does not support updating published articles via API.
    // Articles must be edited manually in the WeChat admin panel.
    this.logger.warn('WeChat Official Account does not support updating published articles via API')
    return { status: 405 }
  }

  // ── Private helpers ──

  private async uploadThumbMedia(imageUrl: string): Promise<string> {
    const imageBuffer = await this.downloadMedia(imageUrl)
    const filename = this.extractFilename(imageUrl)
    return this.wechatService.uploadThumbImage(imageBuffer, filename)
  }

  private async uploadContentImage(imageUrl: string): Promise<string> {
    const imageBuffer = await this.downloadMedia(imageUrl)
    const filename = this.extractFilename(imageUrl)
    return this.wechatService.uploadImage(imageBuffer, filename)
  }

  private async downloadMedia(url: string): Promise<Buffer> {
    return this.mediaService.getBuffer({
      platform: this.platform,
      endpoint: 'downloadMedia',
      url,
    })
  }

  private extractFilename(url: string): string {
    try {
      const pathname = new URL(url).pathname
      const segments = pathname.split('/')
      const last = segments[segments.length - 1]
      return last || 'media.jpg'
    }
    catch (err) {
      this.logger.warn(err, `Failed to extract WeChat Official filename from ${url}`)
      return 'media.jpg'
    }
  }

  private isImage(url: string): boolean {
    return hasUrlPathExtension(url, ['.jpg', '.jpeg', '.png', '.gif', '.bmp'])
  }

  private buildDigest(content: string): string {
    // Strip HTML tags and take first 120 characters
    const plain = content.replace(/<[^>]+>/g, '').trim()
    return plain.length > 120 ? `${plain.slice(0, 117)}...` : plain
  }
}
