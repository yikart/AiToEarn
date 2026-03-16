import { Injectable, Logger } from '@nestjs/common'
import { AccountType, getUser } from '@yikart/common'
import { PublishType } from '@yikart/mongodb'
import { Tool } from '@yikart/nest-mcp'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { AccountService } from '../account/account.service'
import {
  BiliBiliPublishTaskMeta,
  CreateBiliBiliPublishingTask,
  CreateBiliBiliPublishingTaskSchema,
  CreateFacebookPublishingTaskSchema,
  CreateInstagramPublishingTaskSchema,
  CreateKwaiPublishingTaskSchema,
  CreatePinterestPublishingTaskSchema,
  CreatePublishingTask,
  CreatePublishingTaskSchema,
  CreateThreadsPublishingTaskSchema,
  CreateTiktokPublishingTaskSchema,
  CreateTwitterPublishingTaskSchema,
  CreateYoutubePublishingTaskSchema,
  GetPublishingTaskStatusSchema,
  PublishTaskOption,
  YoutubePublishTaskMeta,
} from './publish-mcp.schema'
import { CreatePublishDto } from './publishing/publish.dto'
import { PublishingService } from './publishing/publishing.service'

export const GeneralPublishRestrictionsPrompt = `
**General Rules**: Media must be uploaded; if publishing a video without a cover, use the tools createThumbnailTask and getThumbnailTaskStatus to obtain a cover; title/description within limits; at least 1 media (non-Article); hashtags: no "#tag1#tag2" format.`
export const PlatformSpecificStr = `**Platform Rules**:`

export const PublishRestrictionsPrompt = new Map<AccountType, string>([
  [AccountType.BILIBILI, `Title<80; Desc<250; Title required; topics≤10; ≥1 hashtag; tid required; if reprint, source required.`],
  [AccountType.FACEBOOK, `Desc≤5000; Video: Reels 3-90s, Posts≤4h, Stories 3-60s; ≤1GB; 16:9-9:16; Image: 1-10, ≤10MB.`],
  [AccountType.INSTAGRAM, `Title≤2200; Images: ≤10, ratio 4:5-1.91:1, ≤8MB; Video≤100MB; Post=images only; Reel=video 5-900s; Story=no desc.`],
  [AccountType.THREADS, `Desc≤500; Video≤1GB, ≤300s, MOV/MP4; Images: 1-20, ≤8MB each; Desc required.`],
  [AccountType.PINTEREST, `Title & Board required; Video 4-15s, ≤1GB; Image≤10MB.`],
  [AccountType.YOUTUBE, `Title required ≤100; Desc required ≤5000; categoryId required; Video≤256GB, ≤12h.`],
  [AccountType.TIKTOK, `Topics≤5; Desc≤2200; Video 3-600s, ≤1GB, ≥360px; Images≤10, ≤20MB, 1080x1920.`],
  [AccountType.TWITTER, `Desc required ≤280; Images≤4, ≤5MB, ≤8192px.`],
  [AccountType.KWAI, `Topics≤4; Video: MP4/MOV, recommended 9:16, 15-180s.`],
  [AccountType.Xhs, `Images≤9, ≥300x600; Video≤300MB, ≤15min, ≥720p, 9:16/3:4/1:1/16:9; Text≤1000.`],
  [AccountType.Douyin, `Topics≤5; Title≤30; Desc+Topics≤1000; Images≤9; Video≤1GB, ≤15min, 9:16/16:9/1:1.`],
])

const defBilibiliOption: BiliBiliPublishTaskMeta = {
  copyright: 1,
  no_reprint: 0,
  tid: 160,
}

const defYoutubeOption: YoutubePublishTaskMeta = {
  privacyStatus: 'public',
  license: 'youtube',
  categoryId: '31',
}

@Injectable()
export class PublishMcpController {
  private readonly logger = new Logger(PublishMcpController.name)

  constructor(
    private readonly accountService: AccountService,
    private readonly publishingService: PublishingService,
  ) { }

  // ============================================
  // PRIVATE HELPER METHOD
  // ============================================

  private async doPublish(
    accountType: AccountType,
    data: CreatePublishingTask,
    option?: PublishTaskOption,
  ) {
    // Verify user is authenticated
    getUser()
    const { accountId, title, desc, videoUrl, coverUrl, publishTime, imgUrlList, topics } = data
    const accountInfo = await this.accountService.getAccountById(accountId)
    if (!accountInfo) {
      return {
        content: [{ type: 'text', text: 'Account not found' }],
        isError: true,
      }
    }

    const flowId = uuidv4()

    const publishData: CreatePublishDto = {
      flowId,
      accountId,
      accountType,
      type: PublishType.VIDEO,
      title,
      desc,
      videoUrl,
      coverUrl,
      publishTime: publishTime ? new Date(publishTime) : new Date(),
      imgUrlList: imgUrlList || [],
      topics: topics || [],
      option,
    } as CreatePublishDto

    const res = await this.publishingService.createPublishingTask(publishData)

    let resText = `Publish task created successfully. FlowId: ${flowId}. Use this flowId to check task status.`
    if (accountType === AccountType.Douyin) {
      const douyinRes = res as { shortLink?: string, permalink?: string }
      resText += `\n\nDouyin Publish QR code link: [shortLink:${douyinRes.shortLink}], Douyin App Use Schema String: [permalink:${douyinRes.permalink}].`
    }
    return {
      content: [{
        type: 'text',
        text: resText,
      }],
    }
  }

  // ============================================
  // STATUS & UTILITY TOOLS (4 tools)
  // ============================================

  @Tool({
    name: 'getPublishingTaskStatus',
    description: 'Get the status of a publishing task for the authenticated user. Provide flowId from a previous publish operation. Returns task status (waiting/processing/published/failed), error details if failed, and published post information when successful.',
    parameters: GetPublishingTaskStatusSchema,
  })
  async getPublishingTaskStatus(params: z.infer<typeof GetPublishingTaskStatusSchema>) {
    const user = getUser()
    const { flowId } = params

    const result = await this.publishingService.getPublishTaskInfoWithFlowId(flowId, user.id)
    if (!result) {
      return {
        content: [{ type: 'text', text: `FlowID: ${flowId}\nStatus: Task not found` }],
      }
    }

    const lines = [
      `FlowID: ${flowId}`,
      `Status: ${result.status}`,
      `Account Type: ${result.accountType}`,
    ]

    if (result.errorMsg) {
      lines.push(`Error: ${result.errorMsg}`)
    }
    if (result.title) {
      lines.push(`Title: ${result.title}`)
    }

    return {
      content: [{ type: 'text', text: `Publishing Task Status:\n${lines.join('\n')}` }],
    }
  }

  @Tool({
    name: 'publishRestrictions',
    description: 'Get platform-specific publishing restrictions and validation rules for one or more platforms. '
      + 'You must specify at least one platform to get its restrictions. '
      + 'Provide multiple platforms to get restrictions for all of them in one call. '
      + `Platform values must be one of: ${Object.values(AccountType).join(', ')}.`,
    parameters: z.object({
      platforms: z.array(z.enum(AccountType)).min(1).describe('Array of platforms to get restrictions for. Must specify at least one platform.'),
    }),
  })
  async publishRestrictions(params: { platforms: AccountType[] }) {
    const { platforms } = params

    const restrictionsText: string[] = []

    for (const platform of platforms) {
      const platformRestriction = PublishRestrictionsPrompt.get(platform)
      if (!platformRestriction) {
        return {
          content: [{ type: 'text', text: `Platform ${platform} restrictions not found` }],
          isError: true,
        }
      }
      restrictionsText.push(`- **${platform}:**\n    ${platformRestriction}`)
    }

    const text = `
${GeneralPublishRestrictionsPrompt}
${PlatformSpecificStr}
${restrictionsText.join('\n')}
      `

    return {
      content: [{ type: 'text', text }],
    }
  }

  // ============================================
  // PUBLISHING TOOLS (10 tools)
  // ============================================

  @Tool({
    name: 'publishPostToBilibili',
    description: 'Publish video content to Bilibili. ONLY video content is supported (image-only or text-only posts are not supported). '
      + 'Option parameters: \n'
      + '- tid: category id (required) - get from tool getBilibiliContentCategories and recommend based on content\n'
      + '- no_reprint: 0 (allow reprint) or 1 (disable reprint), default: 0\n'
      + '- copyright: 1 (original) or 2 (forward), default: 1\n'
      + '- source: source link (required when copyright is 2)\n\n'
      + 'Workflow: \n'
      + '(1) Confirm: title, description, REQUIRED video URL, optional cover URL, topics (at least one), publishing time\n'
      + '(2) Call getBilibiliContentCategories if category not specified\n'
      + '(3) Call publishPostToBilibili with all parameters\n'
      + '(4) Return flowId and status for tracking',
    parameters: CreateBiliBiliPublishingTaskSchema,
  })
  async publishPostToBilibili(data: CreateBiliBiliPublishingTask) {
    const option: BiliBiliPublishTaskMeta = {
      ...defBilibiliOption,
      ...(data.option || {}),
    }
    return await this.doPublish(AccountType.BILIBILI, data, { bilibili: option })
  }

  @Tool({
    name: 'publishPostToWxGzh',
    description: 'Publish articles to WeChat Official Account (微信公众号). Supports text, images, and videos.\n\n'
      + 'Required parameters: accountId, title, description/content\n'
      + 'Optional parameters: cover image URL, video/image URLs, publishing time, topics/tags, comment settings\n\n'
      + 'Workflow:\n'
      + '(1) Confirm account and gather all required content\n'
      + '(2) Call publishPostToWxGzh with parameters\n'
      + '(3) Return flowId for status tracking',
    parameters: CreatePublishingTaskSchema,
  })
  async publishPostToWxGzh(data: z.infer<typeof CreatePublishingTaskSchema>) {
    return await this.doPublish(AccountType.WxGzh, data)
  }

  @Tool({
    name: 'publishPostToYoutube',
    description: 'Publish video content to YouTube. ONLY video content is supported (image-only or text-only posts are not supported). '
      + 'Option parameters:\n'
      + '- privacyStatus: visibility (public/private/unlisted), default: public\n'
      + '- license: license type, default: youtube\n'
      + '- categoryId: category id (required) - get from tool getYoutubeContentCategories and recommend based on content\n\n'
      + 'Workflow:\n'
      + '(1) Confirm: title, description, REQUIRED video URL, optional cover URL, optional topics, publishing time\n'
      + '(2) Call getYoutubeContentCategories to determine category\n'
      + '(3) Call publishPostToYoutube with all parameters\n'
      + '(4) Return flowId for status tracking',
    parameters: CreateYoutubePublishingTaskSchema,
  })
  async publishPostToYoutube(data: z.infer<typeof CreateYoutubePublishingTaskSchema>) {
    const option: YoutubePublishTaskMeta = {
      ...defYoutubeOption,
      ...(data.option || {}),
    }
    return await this.doPublish(AccountType.YOUTUBE, data, { youtube: option })
  }

  @Tool({
    name: 'publishPostToPinterest',
    description: 'Publish pins to Pinterest. Supports image and video content. '
      + 'Required parameters: title, description, at least one image URL or video URL\n'
      + 'Optional parameters: target link URL\n\n'
      + 'Workflow:\n'
      + '(1) Confirm: title, description, media URLs (images or video), optional target link\n'
      + '(2) Call publishPostToPinterest with parameters\n'
      + '(3) Return flowId for status tracking',
    parameters: CreatePinterestPublishingTaskSchema,
  })
  async publishPostToPinterest(data: z.infer<typeof CreatePinterestPublishingTaskSchema>) {
    return await this.doPublish(AccountType.PINTEREST, data)
  }

  @Tool({
    name: 'publishPostToThreads',
    description: 'Publish posts to Threads. Supports image and video content. '
      + 'Required parameters: title, description, at least one image URL or video URL\n'
      + 'Option parameters:\n'
      + '- locationId: get from resource mcp://threads/locations, default is first location\n\n'
      + 'Workflow:\n'
      + '(1) Confirm: title, description, media URLs (images or video)\n'
      + '(2) Call publishPostToThreads with parameters\n'
      + '(3) Return flowId for status tracking',
    parameters: CreateThreadsPublishingTaskSchema,
  })
  async publishPostToThreads(data: z.infer<typeof CreateThreadsPublishingTaskSchema>) {
    return await this.doPublish(AccountType.THREADS, data)
  }

  @Tool({
    name: 'publishPostToTiktok',
    description: 'Publish short-form videos to TikTok. ONLY video content is supported. '
      + 'Required parameters: video URL, title, description\n'
      + 'Optional parameters: cover URL, topics/hashtags, privacy level, comment/duet/stitch settings\n\n'
      + 'Workflow:\n'
      + '(1) Confirm: video URL, title, description, optional cover and settings\n'
      + '(2) Call publishPostToTiktok with parameters\n'
      + '(3) Return flowId for status tracking',
    parameters: CreateTiktokPublishingTaskSchema,
  })
  async publishPostToTiktok(data: z.infer<typeof CreateTiktokPublishingTaskSchema>) {
    return await this.doPublish(AccountType.TIKTOK, data)
  }

  @Tool({
    name: 'publishPostToFacebook',
    description: 'Publish posts, reels, or stories to Facebook. Supports text, image, and video content. '
      + 'Required parameters: content text, content_category (post/reel/story)\n'
      + 'Optional parameters: image or video URLs (reels and stories should include media), topics/hashtags\n\n'
      + 'Workflow:\n'
      + '(1) Confirm: text content, content category, optional media URLs and topics\n'
      + '(2) Call publishPostToFacebook with parameters\n'
      + '(3) Return flowId for status tracking',
    parameters: CreateFacebookPublishingTaskSchema,
  })
  async publishPostToFacebook(data: z.infer<typeof CreateFacebookPublishingTaskSchema>) {
    return await this.doPublish(AccountType.FACEBOOK, data)
  }

  @Tool({
    name: 'publishPostToInstagram',
    description: 'Publish posts, reels, or stories to Instagram. Supports image and video content. '
      + 'Required parameters: content text, content_category (post/reel/story), media URLs\n'
      + 'Optional parameters: topics/hashtags\n\n'
      + 'Workflow:\n'
      + '(1) Confirm: text content, content category, media URLs (reels and stories require media), optional topics\n'
      + '(2) Call publishPostToInstagram with parameters\n'
      + '(3) Return flowId for status tracking',
    parameters: CreateInstagramPublishingTaskSchema,
  })
  async publishPostToInstagram(data: z.infer<typeof CreateInstagramPublishingTaskSchema>) {
    return await this.doPublish(AccountType.INSTAGRAM, data)
  }

  @Tool({
    name: 'publishPostToKwai',
    description: 'Publish short videos to Kwai. ONLY video content is supported. '
      + 'Required parameters: video URL, title/caption, coverUrl (MANDATORY)\n'
      + 'Optional parameters: topics/hashtags, publishing time\n\n'
      + 'IMPORTANT: Cover image is MANDATORY for Kwai. If not provided, automatically generate one using media_generation tool based on title and description.\n\n'
      + 'Workflow:\n'
      + '(1) Confirm: video URL, title/caption, topics, publishing time\n'
      + '(2) Ensure cover image exists (generate if needed)\n'
      + '(3) Call publishPostToKwai with all parameters\n'
      + '(4) Return flowId for status tracking',
    parameters: CreateKwaiPublishingTaskSchema,
  })
  async publishPostToKwai(data: z.infer<typeof CreateKwaiPublishingTaskSchema>) {
    return await this.doPublish(AccountType.KWAI, data)
  }

  @Tool({
    name: 'publishPostToTwitter',
    description: 'Publish tweets to Twitter. Supports text, image, and video content. '
      + 'Required parameters: tweet text (respect character limits)\n'
      + 'Optional parameters: image or video URLs, topics/hashtags\n\n'
      + 'Workflow:\n'
      + '(1) Confirm: tweet text, optional media URLs and hashtags\n'
      + '(2) Call publishPostToTwitter with parameters\n'
      + '(3) Return flowId for status tracking',
    parameters: CreateTwitterPublishingTaskSchema,
  })
  async publishPostToTwitter(data: z.infer<typeof CreateTwitterPublishingTaskSchema>) {
    return await this.doPublish(AccountType.TWITTER, data)
  }
}
