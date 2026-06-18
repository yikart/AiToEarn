import type { PlatformContentLimits, TopicCapability } from '../platforms/platforms.interface'
import type { PublishContentInput } from '../publish/schemas/publish-content.schema'
import { PublishContentMode, PublishMediaType } from '../platforms/platforms.interface'
import { hasUrlPathExtension } from '../platforms/platforms.utils'
import {
  parseTopicsFromBody,
  PublishValidationCombination,
  PublishValidationField,
  PublishValidationIssue,
  PublishValidationIssueCode,
  stripTopicsFromBody,
} from '../platforms/publish.schema'

function isImageExtension(url: string): boolean {
  return hasUrlPathExtension(url, ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff'])
}

function isVideoExtension(url: string): boolean {
  return hasUrlPathExtension(url, ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.flv', '.wmv', '.rmvb', '.3gp'])
}

function getMediaType(media: { url: string, metadata?: { type?: unknown } }): PublishMediaType | undefined {
  const metadataType = media.metadata?.['type']
  if (metadataType === PublishMediaType.Image || metadataType === PublishMediaType.Video) {
    return metadataType
  }
  if (isImageExtension(media.url)) {
    return PublishMediaType.Image
  }
  if (isVideoExtension(media.url)) {
    return PublishMediaType.Video
  }
  return undefined
}

export function validatePublishContent(
  content: PublishContentInput,
  limits: PlatformContentLimits,
  topic?: TopicCapability,
): PublishValidationIssue[] {
  const issues: PublishValidationIssue[] = []
  const mediaTypes = content.media.map(getMediaType)
  const imageCount = mediaTypes.filter(type => type === PublishMediaType.Image).length
  const videoCount = mediaTypes.filter(type => type === PublishMediaType.Video).length
  const bodyForLength = topic?.nativeField ? stripTopicsFromBody(content.body) : content.body

  // Required check
  if (!content.body && !content.title && !content.media.length) {
    issues.push({
      code: PublishValidationIssueCode.Required,
      path: ['content'],
      params: { field: PublishValidationField.Post },
    })
  }

  if (!(imageCount > 0 && videoCount > 0)) {
    const mode = resolveContentMode(content, videoCount)
    if (mode && !limits.modes.includes(mode)) {
      issues.push({
        code: PublishValidationIssueCode.UnsupportedContentMode,
        path: ['content'],
        params: { field: PublishValidationField.Post, mode },
      })
    }
  }

  // Title length
  if (limits.maxTitleLength !== undefined && content.title && content.title.length > limits.maxTitleLength) {
    issues.push({
      code: PublishValidationIssueCode.TooBig,
      path: ['content', 'title'],
      params: { field: PublishValidationField.Title, current: content.title.length, maximum: limits.maxTitleLength, unit: 'characters' },
    })
  }

  // Body length
  if (limits.maxBodyLength !== undefined && bodyForLength && bodyForLength.length > limits.maxBodyLength) {
    issues.push({
      code: PublishValidationIssueCode.TooBig,
      path: ['content', 'body'],
      params: { field: PublishValidationField.Text, current: bodyForLength.length, maximum: limits.maxBodyLength, unit: 'characters' },
    })
  }

  // Total text length
  if (limits.maxTotalTextLength !== undefined) {
    const totalTextLength = (content.title?.length ?? 0) + (bodyForLength?.length ?? 0)
    if (totalTextLength > limits.maxTotalTextLength) {
      issues.push({
        code: PublishValidationIssueCode.TooBig,
        path: ['content'],
        params: { field: PublishValidationField.Text, current: totalTextLength, maximum: limits.maxTotalTextLength, unit: 'characters' },
      })
    }
  }

  // Media count checks
  if (imageCount > 0 && videoCount > 0) {
    issues.push({
      code: PublishValidationIssueCode.InvalidCombination,
      path: ['content', 'media'],
      params: { combination: PublishValidationCombination.ImageVideo },
    })
  }

  if (limits.maxImages !== undefined && imageCount > limits.maxImages) {
    issues.push({
      code: PublishValidationIssueCode.TooBig,
      path: ['content', 'media'],
      params: { field: PublishValidationField.Image, current: imageCount, maximum: limits.maxImages, unit: 'items' },
    })
  }

  if (limits.maxVideos !== undefined && videoCount > limits.maxVideos) {
    issues.push({
      code: PublishValidationIssueCode.TooBig,
      path: ['content', 'media'],
      params: { field: PublishValidationField.Video, current: videoCount, maximum: limits.maxVideos, unit: 'items' },
    })
  }

  if (limits.maxMediaCount !== undefined && content.media.length > limits.maxMediaCount) {
    issues.push({
      code: PublishValidationIssueCode.TooBig,
      path: ['content', 'media'],
      params: { field: PublishValidationField.Media, current: content.media.length, maximum: limits.maxMediaCount, unit: 'items' },
    })
  }

  if (topic?.supported && topic.maxCount !== undefined) {
    const topics = parseTopicsFromBody(content.body)
    if (topics.length > topic.maxCount) {
      issues.push({
        code: PublishValidationIssueCode.TooBig,
        path: ['content', 'topics'],
        params: { field: PublishValidationField.Topic, current: topics.length, maximum: topic.maxCount, unit: 'items' },
      })
    }
  }

  // Cover format
  if (content.cover?.url && getMediaType(content.cover) !== PublishMediaType.Image && !isImageExtension(content.cover.url)) {
    issues.push({
      code: PublishValidationIssueCode.UnsupportedFormat,
      path: ['content', 'cover'],
      params: { field: PublishValidationField.Cover, format: getExtension(content.cover.url) },
    })
  }

  return issues
}

function resolveContentMode(content: PublishContentInput, videoCount: number): PublishContentMode | undefined {
  if (videoCount > 0) {
    return PublishContentMode.Video
  }
  if (content.media.length > 0 || content.cover?.url) {
    return PublishContentMode.ImageText
  }
  if (content.title || content.body) {
    return PublishContentMode.Text
  }
  return undefined
}

function getExtension(url: string): string {
  try {
    const pathname = new URL(url).pathname
    const dot = pathname.lastIndexOf('.')
    return dot >= 0 ? pathname.slice(dot) : 'unknown'
  }
  catch {
    return 'unknown'
  }
}
