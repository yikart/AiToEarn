import type { XhsShareInfo } from './share'

type XhsShareMediaType = 'video' | 'img'

interface XhsShareMaterialMedia {
  url?: string
  type: XhsShareMediaType
}

export interface XhsShareMaterial {
  title?: string
  desc?: string
  topics?: string[]
  coverUrl?: string
  mediaList?: XhsShareMaterialMedia[]
}

export type XhsShareInfoErrorKey = 'xhsNoVideo' | 'xhsNoCover' | 'xhsNoImage'

export type XhsShareInfoResult
  = | { shareInfo: XhsShareInfo, errorKey?: never }
    | { shareInfo?: never, errorKey: XhsShareInfoErrorKey }

export interface XhsShareCopyText {
  title: string
  content: string
}

const XHS_TOPIC_REGEXP = /#([^#\n]+)#(?=\s|$)|#([^\s#]+)/g

function normalizeTopicLabel(value: string) {
  return value
    .replace(/\[话题\]/g, '')
    .replace(/^#+/, '')
    .replace(/#+$/, '')
    .trim()
}

function getTopicKey(value: string) {
  return normalizeTopicLabel(value).toLowerCase()
}

function getTopicKeys(content: string) {
  const topicKeys = new Set<string>()

  for (const match of content.matchAll(XHS_TOPIC_REGEXP)) {
    const topic = normalizeTopicLabel(match[1] || match[2] || '')
    if (topic) {
      topicKeys.add(getTopicKey(topic))
    }
  }

  return topicKeys
}

function dedupeTopicsInContent(content: string) {
  const usedTopicKeys = new Set<string>()

  return content
    .replace(XHS_TOPIC_REGEXP, (_match, closedTopic: string | undefined, inlineTopic: string | undefined) => {
      const topic = normalizeTopicLabel(closedTopic || inlineTopic || '')
      const topicKey = getTopicKey(topic)
      if (!topic || usedTopicKeys.has(topicKey))
        return ''

      usedTopicKeys.add(topicKey)
      return `#${topic}`
    })
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function appendTopicsToContent(desc: string, topics?: string[]) {
  const content = dedupeTopicsInContent(desc)
  const existingTopicKeys = getTopicKeys(content)
  const appendedTopicKeys = new Set<string>()
  const topicText = (topics || [])
    .flatMap((topic) => {
      const topicLabel = normalizeTopicLabel(topic)
      const topicKey = getTopicKey(topicLabel)
      if (!topicLabel || existingTopicKeys.has(topicKey) || appendedTopicKeys.has(topicKey))
        return []

      appendedTopicKeys.add(topicKey)
      return [`#${topicLabel}`]
    })
    .join(' ')

  if (!topicText)
    return content

  return content ? `${content}\n${topicText}` : topicText
}

export function createXhsShareCopyTextFromMaterial(material: XhsShareMaterial): XhsShareCopyText {
  const title = material.title || ''
  const content = appendTopicsToContent(material.desc || '', material.topics)

  return {
    title,
    content,
  }
}

export function createXhsShareInfoFromMaterial(material: XhsShareMaterial): XhsShareInfoResult {
  const { title, content } = createXhsShareCopyTextFromMaterial(material)
  const hasVideo = material.mediaList?.some(media => media.type === 'video')

  if (hasVideo) {
    const videoMedia = material.mediaList?.find(media => media.type === 'video')
    if (!videoMedia?.url) {
      return { errorKey: 'xhsNoVideo' }
    }

    if (!material.coverUrl) {
      return { errorKey: 'xhsNoCover' }
    }

    return {
      shareInfo: {
        type: 'video',
        title,
        content,
        video: videoMedia.url,
        cover: material.coverUrl,
      },
    }
  }

  const images = material.mediaList?.flatMap((media) => {
    if (media.type === 'img' && media.url)
      return [media.url]

    return []
  }) || []
  if (images.length === 0) {
    return { errorKey: 'xhsNoImage' }
  }

  return {
    shareInfo: {
      type: 'normal',
      title,
      content,
      images,
      cover: material.coverUrl || images[0],
    },
  }
}
