import { AccountType } from '@yikart/common'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { BilibiliOptionSchema } from './bilibili/bilibili.schema'
import { DouyinDownloadType, DouyinOptionSchema, DouyinPrivateStatus } from './douyin/douyin.schema'
import { FacebookContentCategory, FacebookOptionSchema } from './facebook/facebook.schema'
import { InstagramMediaType, InstagramOptionSchema } from './instagram/instagram.schema'
import {
  formatPublishValidationIssue,
  parseTopicInsertionsFromBody,
  parseTopicsFromBody,
  PlatformPublishOptionItemSchema,
  PublishValidationField,
  PublishValidationIssueCode,
  stripTopicsFromBody,
} from './publish.schema'
import { ThreadsOptionSchema, ThreadsReplyControl } from './threads/threads.schema'
import { TiktokOptionSchema, TikTokPrivacyLevel } from './tiktok/tiktok.schema'
import { TwitterOptionSchema } from './twitter/twitter.schema'
import { YoutubeOptionSchema } from './youtube/youtube.schema'

describe('platform publish option schemas', () => {
  it('exposes descriptions for nested option schema fields', () => {
    expect(getJsonSchemaProperty(TwitterOptionSchema, 'poll', 'options').description).toBe('投票选项')
    expect(getJsonSchemaProperty(TwitterOptionSchema, 'poll', 'duration_minutes').description).toBe('投票持续分钟数')
    expect(getJsonSchemaProperty(InstagramOptionSchema, 'product_tags', 'product_id').description).toBe('商品 ID')
    expect(getJsonSchemaProperty(InstagramOptionSchema, 'user_tags', 'username').description).toBe('用户名称')
    expect(getJsonSchemaRootProperty(DouyinOptionSchema, 'download_type').description).toBe('下载类型 1-允许，2-不允许')
  })

  it('requires Bilibili tid and supports optional mission id', () => {
    expect(BilibiliOptionSchema.safeParse({}).success).toBe(false)
    expect(BilibiliOptionSchema.safeParse({
      tid: 21,
      mission_id: 123,
    }).success).toBe(true)
  })

  it('keeps YouTube publishAt as an RFC3339 timestamp', () => {
    expect(YoutubeOptionSchema.safeParse({ publishAt: '2026-05-22T10:00:00.000Z' }).success).toBe(true)
    expect(YoutubeOptionSchema.safeParse({ publishAt: '2026-05-22 10:00:00' }).success).toBe(false)
  })

  it('does not expose YouTube tags as an option field', () => {
    expect(YoutubeOptionSchema.parse({ tags: ['legacy'] })).not.toHaveProperty('tags')
  })

  it('limits Instagram captions to the official caption size', () => {
    expect(InstagramOptionSchema.safeParse({ caption: 'a'.repeat(2200) }).success).toBe(true)
    expect(InstagramOptionSchema.safeParse({ caption: 'a'.repeat(2201) }).success).toBe(false)
  })

  it('uses Instagram media_type instead of isReel', () => {
    expect(InstagramOptionSchema.safeParse({ media_type: InstagramMediaType.Image }).success).toBe(true)
    expect(InstagramOptionSchema.safeParse({ media_type: InstagramMediaType.Reels }).success).toBe(true)
    expect(InstagramOptionSchema.safeParse({ media_type: InstagramMediaType.Stories }).success).toBe(true)
    expect(InstagramOptionSchema.safeParse({ media_type: InstagramMediaType.Carousel }).success).toBe(true)
    expect(InstagramOptionSchema.safeParse({ media_type: 'VIDEO' }).success).toBe(false)
    expect(InstagramOptionSchema.parse({ isReel: true, content_category: 'reel' })).toEqual({})
  })

  it('uses explicit Facebook content categories and rejects legacy target fields', () => {
    expect(FacebookOptionSchema.safeParse({ content_category: FacebookContentCategory.Reel }).success).toBe(true)
    expect(FacebookOptionSchema.parse({
      isReel: true,
      page_id: 'page-id',
      contentCategory: 'reel',
      publishTarget: 'reel',
      videoContentCategory: 'reel',
    })).toEqual({})
  })

  it('validates Threads reply controls by official values', () => {
    expect(ThreadsOptionSchema.safeParse({ reply_control: ThreadsReplyControl.MentionedOnly }).success).toBe(true)
    expect(ThreadsOptionSchema.safeParse({ reply_control: 'followers' }).success).toBe(false)
    expect(ThreadsOptionSchema.safeParse({ link_attachment: 'https://example.test/post' }).success).toBe(true)
    expect(ThreadsOptionSchema.parse({
      link_attachment_url: 'https://example.test/post',
      topic_tag: 'ai',
    })).toEqual({})
  })

  it('supports only user-controlled Douyin options', () => {
    expect(DouyinOptionSchema.safeParse({
      short_title: '短标题',
      download_type: DouyinDownloadType.Allow,
      private_status: DouyinPrivateStatus.Public,
    }).success).toBe(true)
    expect(DouyinOptionSchema.parse({
      shareId: 'share_1',
      title: '标题',
      hashtag_list: ['topic'],
      title_hashtag_list: [{ name: 'topic', start: 0 }],
      video_path: 'https://cdn.example.com/video.mp4',
      image_list_path: ['https://cdn.example.com/image.jpg'],
      custom_cover_image_url: 'https://cdn.example.com/cover.jpg',
      download_type: DouyinDownloadType.Allow,
    })).toEqual({
      download_type: DouyinDownloadType.Allow,
    })
  })

  it('keeps TikTok privacy optional because creator_info owns the allowed values', () => {
    expect(TiktokOptionSchema.safeParse({}).success).toBe(true)
    expect(TiktokOptionSchema.safeParse({ privacy_level: TikTokPrivacyLevel.Public }).success).toBe(true)
    expect(TiktokOptionSchema.safeParse({ privacy_level: 'PUBLIC' }).success).toBe(false)
  })

  it('enforces X poll option count and text length', () => {
    expect(TwitterOptionSchema.safeParse({
      poll: {
        options: ['yes', 'no'],
        duration_minutes: 60,
      },
    }).success).toBe(true)
    expect(TwitterOptionSchema.safeParse({
      poll: {
        options: ['a'.repeat(26), 'no'],
        duration_minutes: 60,
      },
    }).success).toBe(false)
  })

  it('strips option fields that belong to another platform', () => {
    const result = PlatformPublishOptionItemSchema.safeParse({
      platform: AccountType.YouTube,
      option: { tid: 21 },
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.option).not.toHaveProperty('tid')
    }
  })

  it('keeps platform-specific required option rules at DTO boundary', () => {
    expect(PlatformPublishOptionItemSchema.safeParse({
      platform: AccountType.Bilibili,
    }).success).toBe(false)

    expect(PlatformPublishOptionItemSchema.safeParse({
      platform: AccountType.GoogleBusiness,
      option: {},
    }).success).toBe(false)
  })

  it('formats validation messages by locale and keeps issue structure', () => {
    const issue = {
      code: PublishValidationIssueCode.TooBig,
      path: ['content', 'body'],
      params: {
        field: PublishValidationField.Body,
        maximum: 280,
        unit: 'characters',
      },
    }

    expect(formatPublishValidationIssue(issue, 'en-US')).toEqual({
      ...issue,
      message: 'Body must be at most 280 characters',
    })
    expect(formatPublishValidationIssue(issue, 'zh-CN')).toEqual({
      ...issue,
      message: '正文不能超过 280 个字符',
    })
  })

  it('formats duration validation messages by available bounds', () => {
    const issue = {
      code: PublishValidationIssueCode.InvalidDuration,
      path: ['content', 'media', 0],
      params: {
        field: PublishValidationField.Video,
        minimum: 3,
        maximum: 90,
      },
    }

    expect(formatPublishValidationIssue(issue, 'en-US')).toEqual({
      ...issue,
      message: 'Video duration must be between 3 and 90 seconds',
    })
    expect(formatPublishValidationIssue(issue, 'zh-CN')).toEqual({
      ...issue,
      message: '视频时长必须在 3 到 90 秒之间',
    })

    expect(formatPublishValidationIssue({
      ...issue,
      params: { field: PublishValidationField.Video, minimum: 3 },
    }, 'zh-CN').message).toBe('视频时长不能少于 3 秒')
    expect(formatPublishValidationIssue({
      ...issue,
      params: { field: PublishValidationField.Video, maximum: 90 },
    }, 'en-US').message).toBe('Video duration must be at most 90 seconds')
  })

  it('formats aspect ratio validation messages with dimension and current value', () => {
    const issue = {
      code: PublishValidationIssueCode.TooSmall,
      path: ['content', 'media', 0],
      params: {
        field: PublishValidationField.Image,
        dimension: 'aspectRatio',
        current: 0.56,
        minimum: 0.8,
      },
    }

    expect(formatPublishValidationIssue(issue, 'zh-CN').message).toBe('图片宽高比不能少于 0.8，当前为 0.56')
    expect(formatPublishValidationIssue(issue, 'en-US').message).toBe('Image aspect ratio must be at least 0.8, current is 0.56')
    expect(formatPublishValidationIssue({
      ...issue,
      code: PublishValidationIssueCode.TooBig,
      params: {
        field: PublishValidationField.Image,
        dimension: 'aspectRatio',
        current: 2,
        maximum: 1.91,
      },
    }, 'zh-CN').message).toBe('图片宽高比不能超过 1.91，当前为 2')
  })

  it('parses topics from body once and strips topic tokens from text', () => {
    expect(parseTopicsFromBody('正文 #话题 @natgeo #topic #话题')).toEqual(['话题', 'topic'])
    expect(stripTopicsFromBody('正文  #话题\n\n#topic @natgeo')).toBe('正文\n\n@natgeo')
  })

  it('maps body topics to their insertion positions after stripping topics', () => {
    expect(parseTopicInsertionsFromBody('测试 #重庆 标题 #北京')).toEqual([
      { name: '重庆', start: 2 },
      { name: '北京', start: 5 },
    ])
  })
})

function getJsonSchemaProperty(schema: z.ZodTypeAny, parent: string, child: string): { description?: string } {
  const jsonSchema = z.toJSONSchema(schema) as {
    properties?: Record<string, {
      properties?: Record<string, { description?: string }>
      items?: {
        properties?: Record<string, { description?: string }>
      }
    }>
  }
  const parentSchema = jsonSchema.properties?.[parent]
  const childSchema = parentSchema?.items?.properties?.[child] ?? parentSchema?.properties?.[child]
  expect(childSchema).toBeDefined()
  return childSchema!
}

function getJsonSchemaRootProperty(schema: z.ZodTypeAny, property: string): { description?: string } {
  const jsonSchema = z.toJSONSchema(schema) as {
    properties?: Record<string, { description?: string }>
  }
  const propertySchema = jsonSchema.properties?.[property]
  expect(propertySchema).toBeDefined()
  return propertySchema!
}
