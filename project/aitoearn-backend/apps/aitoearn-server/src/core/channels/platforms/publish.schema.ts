import type { Locale } from '@yikart/common'
import { AccountType } from '@yikart/common'
import { z } from 'zod'
import { BilibiliOptionSchema } from './bilibili/bilibili.schema'
import { DouyinOptionSchema } from './douyin/douyin.schema'
import { FacebookOptionSchema } from './facebook/facebook.schema'
import { InstagramOptionSchema } from './instagram/instagram.schema'
import { KwaiOptionSchema } from './kwai/kwai.schema'
import { LinkedInOptionSchema } from './linkedin/linkedin.schema'
import { PinterestOptionSchema } from './pinterest/pinterest.schema'
import { PublishContentMode } from './platforms.interface'
import { RedNoteOptionSchema } from './rednote/rednote.schema'
import { ThreadsOptionSchema } from './threads/threads.schema'
import { TiktokOptionSchema } from './tiktok/tiktok.schema'
import { TwitterOptionSchema } from './twitter/twitter.schema'
import { WeChatChannelsOptionSchema } from './wechat/wechat-channels/wechat-channels.schema'
import { WeChatOfficialOptionSchema } from './wechat/wechat-official/wechat-official.schema'
import { YoutubeOptionSchema } from './youtube/youtube.schema'

export enum PublishValidationIssueCode {
  Required = 'required',
  TooBig = 'too_big',
  TooSmall = 'too_small',
  InvalidCombination = 'invalid_combination',
  UnsupportedFormat = 'unsupported_format',
  UnsupportedContentMode = 'unsupported_content_mode',
  InvalidDuration = 'invalid_duration',
  InvalidUrl = 'invalid_url',
  InvalidOption = 'invalid_option',
}

export enum PublishValidationField {
  Post = 'post',
  Title = 'title',
  Body = 'body',
  Text = 'text',
  Media = 'media',
  Image = 'image',
  Video = 'video',
  Cover = 'cover',
  Topic = 'topic',
  Url = 'url',
  Option = 'option',
}

export enum PublishValidationCombination {
  ImageVideo = 'image_video',
  ReelImage = 'reel_image',
}

export interface PublishValidationIssue {
  code: PublishValidationIssueCode
  path: Array<string | number>
  message?: string
  params?: Record<string, unknown>
}

export function formatPublishValidationIssue(
  issue: PublishValidationIssue,
  locale: Locale,
): PublishValidationIssue {
  return {
    ...issue,
    message: getPublishValidationIssueMessage(issue, locale),
  }
}

function getPublishValidationIssueMessage(issue: PublishValidationIssue, locale: Locale): string {
  const label = getFieldLabel(getIssueField(issue), locale)

  switch (issue.code) {
    case PublishValidationIssueCode.Required:
      return locale === 'zh-CN'
        ? `${label}为必填项`
        : `${label} is required`

    case PublishValidationIssueCode.TooBig:
      return getLimitMessage(issue, label, 'maximum', locale)

    case PublishValidationIssueCode.TooSmall:
      return getLimitMessage(issue, label, 'minimum', locale)

    case PublishValidationIssueCode.InvalidCombination:
      return getCombinationMessage(issue, locale)

    case PublishValidationIssueCode.UnsupportedFormat:
      return locale === 'zh-CN'
        ? `${label}格式不支持，支持格式：${getFormatsParam(issue)}`
        : `${label} format is not supported. Supported formats: ${getFormatsParam(issue)}`

    case PublishValidationIssueCode.UnsupportedContentMode:
      return locale === 'zh-CN'
        ? `平台不支持${getContentModeLabel(issue, locale)}发布`
        : `Platform does not support ${getContentModeLabel(issue, locale)} publishing`

    case PublishValidationIssueCode.InvalidDuration:
      return getDurationMessage(issue, label, locale)

    case PublishValidationIssueCode.InvalidUrl:
      return locale === 'zh-CN'
        ? `${label}必须使用 HTTPS`
        : `${label} must use HTTPS`

    case PublishValidationIssueCode.InvalidOption:
      return locale === 'zh-CN'
        ? `${label}无效`
        : `${label} is invalid`
  }
}

function getFieldLabel(field: PublishValidationField, locale: Locale): string {
  switch (field) {
    case PublishValidationField.Title:
      return locale === 'zh-CN' ? '标题' : 'Title'

    case PublishValidationField.Body:
      return locale === 'zh-CN' ? '正文' : 'Body'

    case PublishValidationField.Text:
      return locale === 'zh-CN' ? '文本' : 'Text'

    case PublishValidationField.Media:
      return locale === 'zh-CN' ? '媒体' : 'Media'

    case PublishValidationField.Image:
      return locale === 'zh-CN' ? '图片' : 'Image'

    case PublishValidationField.Video:
      return locale === 'zh-CN' ? '视频' : 'Video'

    case PublishValidationField.Cover:
      return locale === 'zh-CN' ? '封面' : 'Cover'

    case PublishValidationField.Topic:
      return locale === 'zh-CN' ? '话题' : 'Topic'

    case PublishValidationField.Url:
      return locale === 'zh-CN' ? '链接' : 'URL'

    case PublishValidationField.Option:
      return locale === 'zh-CN' ? '发布选项' : 'Publish option'

    case PublishValidationField.Post:
      return locale === 'zh-CN' ? '发布内容' : 'Post content'
  }
}

function getIssueField(issue: PublishValidationIssue): PublishValidationField {
  const field = issue.params?.['field']
  if (isPublishValidationField(field)) {
    return field
  }

  const lastPath = issue.path[issue.path.length - 1]
  if (isPublishValidationField(lastPath)) {
    return lastPath
  }

  return PublishValidationField.Post
}

function isPublishValidationField(value: unknown): value is PublishValidationField {
  return typeof value === 'string'
    && Object.values(PublishValidationField).includes(value as PublishValidationField)
}

function getCombinationMessage(issue: PublishValidationIssue, locale: Locale): string {
  if (issue.params?.['combination'] === PublishValidationCombination.ReelImage) {
    return locale === 'zh-CN'
      ? 'Reels 不支持图片媒体'
      : 'Reels do not support image media'
  }

  return locale === 'zh-CN'
    ? '不能在同一篇发布中混合图片和视频'
    : 'Images and videos cannot be mixed in one post'
}

function getNumberParam(issue: PublishValidationIssue, key: string): number {
  const value = issue.params?.[key]
  return Number(value ?? 0)
}

function getOptionalNumberParam(issue: PublishValidationIssue, key: string): number | undefined {
  const value = issue.params?.[key]
  return value === undefined ? undefined : Number(value)
}

function getDurationMessage(issue: PublishValidationIssue, label: string, locale: Locale): string {
  const minimum = getOptionalNumberParam(issue, 'minimum')
  const maximum = getOptionalNumberParam(issue, 'maximum')
  if (minimum !== undefined && maximum !== undefined) {
    return locale === 'zh-CN'
      ? `${label}时长必须在 ${minimum} 到 ${maximum} 秒之间`
      : `${label} duration must be between ${minimum} and ${maximum} seconds`
  }
  if (minimum !== undefined) {
    return locale === 'zh-CN'
      ? `${label}时长不能少于 ${minimum} 秒`
      : `${label} duration must be at least ${minimum} seconds`
  }
  if (maximum !== undefined) {
    return locale === 'zh-CN'
      ? `${label}时长不能超过 ${maximum} 秒`
      : `${label} duration must be at most ${maximum} seconds`
  }
  return locale === 'zh-CN'
    ? `${label}时长无效`
    : `${label} duration is invalid`
}

function getLimitMessage(issue: PublishValidationIssue, label: string, boundKey: 'minimum' | 'maximum', locale: Locale): string {
  const bound = getNumberParam(issue, boundKey)
  if (issue.params?.['dimension'] === 'aspectRatio') {
    const current = getOptionalNumberParam(issue, 'current')
    const currentText = current === undefined
      ? ''
      : locale === 'zh-CN'
        ? `，当前为 ${current}`
        : `, current is ${current}`

    if (boundKey === 'minimum') {
      return locale === 'zh-CN'
        ? `${label}宽高比不能少于 ${bound}${currentText}`
        : `${label} aspect ratio must be at least ${bound}${currentText}`
    }

    return locale === 'zh-CN'
      ? `${label}宽高比不能超过 ${bound}${currentText}`
      : `${label} aspect ratio must be at most ${bound}${currentText}`
  }

  const unitLabel = getUnitLabel(issue, locale)
  if (boundKey === 'minimum') {
    return locale === 'zh-CN'
      ? `${label}不能少于 ${bound} ${unitLabel}`
      : `${label} must be at least ${bound} ${unitLabel}`
  }
  return locale === 'zh-CN'
    ? `${label}不能超过 ${bound} ${unitLabel}`
    : `${label} must be at most ${bound} ${unitLabel}`
}

function getFormatsParam(issue: PublishValidationIssue): string {
  const formats = issue.params?.['formats'] ?? issue.params?.['allowed']
  if (Array.isArray(formats)) {
    return formats.filter((format): format is string => typeof format === 'string').join(', ')
  }
  if (typeof formats === 'string') {
    return formats
  }
  return ''
}

function getContentModeLabel(issue: PublishValidationIssue, locale: Locale): string {
  const mode = issue.params?.['mode']
  if (mode === 'text' || mode === PublishContentMode.Text) {
    return locale === 'zh-CN' ? '纯文本' : 'text'
  }
  if (mode === 'image_text' || mode === PublishContentMode.ImageText) {
    return locale === 'zh-CN' ? '图文' : 'image-text'
  }
  if (mode === 'video' || mode === PublishContentMode.Video) {
    return locale === 'zh-CN' ? '视频' : 'video'
  }
  return locale === 'zh-CN' ? '该内容模式' : 'this content mode'
}

function getUnitLabel(issue: PublishValidationIssue, locale: Locale): string {
  const unit = issue.params?.['unit']
  if (unit === 'characters') {
    return locale === 'zh-CN' ? '个字符' : 'characters'
  }
  if (unit === 'items') {
    return locale === 'zh-CN' ? '项' : 'items'
  }
  if (unit === 'bytes') {
    return locale === 'zh-CN' ? '字节' : 'bytes'
  }
  if (unit === 'pixels') {
    return locale === 'zh-CN' ? '像素' : 'pixels'
  }
  if (unit === 'seconds') {
    return locale === 'zh-CN' ? '秒' : 'seconds'
  }
  return ''
}

export function createPlatformPublishOptionItemSchema<TShape extends z.ZodRawShape>(extraShape: TShape) {
  return z.discriminatedUnion('platform', [
    z.object({
      platform: z.literal(AccountType.Bilibili).describe('平台'),
      option: BilibiliOptionSchema.describe('哔哩哔哩发布选项'),
      ...extraShape,
    }),
    z.object({
      platform: z.literal(AccountType.YouTube).describe('平台'),
      option: YoutubeOptionSchema.optional().describe('YouTube 发布选项'),
      ...extraShape,
    }),
    z.object({
      platform: z.literal(AccountType.WeChatOfficial).describe('平台'),
      option: WeChatOfficialOptionSchema.optional().describe('微信公众号发布选项'),
      ...extraShape,
    }),
    z.object({
      platform: z.literal(AccountType.Facebook).describe('平台'),
      option: FacebookOptionSchema.optional().describe('Facebook 发布选项'),
      ...extraShape,
    }),
    z.object({
      platform: z.literal(AccountType.Instagram).describe('平台'),
      option: InstagramOptionSchema.optional().describe('Instagram 发布选项'),
      ...extraShape,
    }),
    z.object({
      platform: z.literal(AccountType.Threads).describe('平台'),
      option: ThreadsOptionSchema.optional().describe('Threads 发布选项'),
      ...extraShape,
    }),
    z.object({
      platform: z.literal(AccountType.Pinterest).describe('平台'),
      option: PinterestOptionSchema.describe('Pinterest 发布选项'),
      ...extraShape,
    }),
    z.object({
      platform: z.literal(AccountType.TikTok).describe('平台'),
      option: TiktokOptionSchema.optional().describe('TikTok 发布选项'),
      ...extraShape,
    }),
    z.object({
      platform: z.literal(AccountType.Douyin).describe('平台'),
      option: DouyinOptionSchema.optional().describe('抖音发布选项'),
      ...extraShape,
    }),
    z.object({
      platform: z.literal(AccountType.Twitter).describe('平台'),
      option: TwitterOptionSchema.optional().describe('Twitter / X 发布选项'),
      ...extraShape,
    }),
    z.object({
      platform: z.literal(AccountType.Kwai).describe('平台'),
      option: KwaiOptionSchema.optional().describe('快手发布选项'),
      ...extraShape,
    }),
    z.object({
      platform: z.literal(AccountType.LinkedIn).describe('平台'),
      option: LinkedInOptionSchema.optional().describe('LinkedIn 发布选项'),
      ...extraShape,
    }),
    z.object({
      platform: z.literal(AccountType.RedNote).describe('平台'),
      option: RedNoteOptionSchema.describe('小红书发布选项'),
      ...extraShape,
    }),
    z.object({
      platform: z.literal(AccountType.WeChatChannels).describe('平台'),
      option: WeChatChannelsOptionSchema.optional().describe('微信视频号发布选项'),
      ...extraShape,
    }),
  ])
}

export const PlatformPublishOptionItemSchema = createPlatformPublishOptionItemSchema({})

const topicPattern = /#([\w\p{Script=Han}]+)/gu

export function parseTopicsFromBody(body?: string): string[] {
  if (!body)
    return []
  const topics: string[] = []
  for (const match of body.matchAll(topicPattern)) {
    const topic = match[1]
    if (topic && !topics.includes(topic)) {
      topics.push(topic)
    }
  }
  return topics
}

export function stripTopicsFromBody(body?: string): string | undefined {
  if (body === undefined)
    return undefined
  return body
    .replace(topicPattern, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function parseTopicInsertionsFromBody(body?: string): Array<{ name: string, start: number }> {
  if (!body)
    return []

  const insertions: Array<{ name: string, start: number }> = []
  const seen = new Set<string>()
  for (const match of body.matchAll(topicPattern)) {
    const name = match[1]
    if (!name || seen.has(name)) {
      continue
    }
    seen.add(name)
    insertions.push({
      name,
      start: stripTopicsFromBody(body.slice(0, match.index))?.length ?? 0,
    })
  }
  return insertions
}

export type PlatformPublishOptionItem = z.infer<typeof PlatformPublishOptionItemSchema>
