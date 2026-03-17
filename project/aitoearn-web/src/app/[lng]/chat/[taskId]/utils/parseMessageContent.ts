/**
 * 消息内容解析工具
 * 支持多种格式的用户消息内容解析：
 * 1. Markdown 引用格式：[image]: url, [video]: url, [document]: url
 * 2. Claude Prompt 格式：{ type, source, text, cache_control }
 */

import type { IParsedUserContent, IPromptContentItem, IUploadedMedia } from '@/store/agent'

/**
 * Markdown 引用格式正则
 * 匹配：[image]: url, [video]: url, [document]: url
 */
const MARKDOWN_REFERENCE_REGEX = /^\[(image|video|document)\]:\s*(.+)$/gim

/**
 * 判断文本是否为 JSON 格式的 Claude Prompt
 */
function isClaudePromptFormat(text: string): boolean {
  const trimmed = text.trim()
  return trimmed.startsWith('[') && trimmed.includes('"type"') && trimmed.includes('"source"')
}

/**
 * 解析 Markdown 引用格式
 * @example
 * [image]: https://example.com/image.jpg
 * [video]: https://example.com/video.mp4
 */
function parseMarkdownReferences(text: string): IParsedUserContent {
  const medias: IUploadedMedia[] = []
  let cleanedText = text

  // 提取所有引用
  const matches = text.matchAll(MARKDOWN_REFERENCE_REGEX)

  for (const match of matches) {
    const [fullMatch, type, url] = match
    const trimmedUrl = url.trim()

    if (trimmedUrl) {
      medias.push({
        url: trimmedUrl,
        type: type as 'image' | 'video' | 'document',
      })
      // 从文本中移除这条引用
      cleanedText = cleanedText.replace(fullMatch, '')
    }
  }

  return {
    text: cleanedText.trim(),
    medias,
    hasSpecialFormat: medias.length > 0,
  }
}

/**
 * 解析 Claude Prompt 格式
 * @example
 * [
 *   { "type": "image", "source": { "type": "url", "url": "..." } },
 *   { "type": "text", "text": "..." }
 * ]
 */
function parseClaudePrompt(text: string): IParsedUserContent {
  try {
    const items: IPromptContentItem[] = JSON.parse(text)

    if (!Array.isArray(items)) {
      throw new TypeError('Invalid format: not an array')
    }

    const medias: IUploadedMedia[] = []
    const textParts: string[] = []

    items.forEach((item) => {
      if (item.type === 'text' && item.text) {
        textParts.push(item.text)
      }
      else if (['image', 'video', 'document'].includes(item.type)) {
        if (item.source?.url) {
          const media: IUploadedMedia = {
            url: item.source.url,
            type: item.type as 'image' | 'video' | 'document',
          }

          // 添加缓存控制（如果存在）
          if (item.cache_control) {
            media.cache_control = item.cache_control
          }

          medias.push(media)
        }
      }
    })

    return {
      text: textParts.join('\n\n'),
      medias,
      hasSpecialFormat: true,
    }
  }
  catch (error) {
    console.error('Failed to parse Claude prompt format:', error)
    // 解析失败，返回原始文本
    return {
      text,
      medias: [],
      hasSpecialFormat: false,
    }
  }
}

/**
 * 解析用户消息内容
 * 自动识别并解析不同格式
 */
export function parseUserMessageContent(content: string | any[]): IParsedUserContent {
  // 如果已经是数组格式（Claude format），直接解析
  if (Array.isArray(content)) {
    try {
      const jsonStr = JSON.stringify(content)
      return parseClaudePrompt(jsonStr)
    }
    catch {
      return {
        text: '',
        medias: [],
        hasSpecialFormat: false,
      }
    }
  }

  // 字符串格式
  if (typeof content !== 'string') {
    return {
      text: '',
      medias: [],
      hasSpecialFormat: false,
    }
  }

  const trimmedContent = content.trim()

  // 判断是否为 JSON 格式的 Claude Prompt
  if (isClaudePromptFormat(trimmedContent)) {
    return parseClaudePrompt(trimmedContent)
  }

  // 判断是否包含 Markdown 引用
  if (MARKDOWN_REFERENCE_REGEX.test(trimmedContent)) {
    // 重置正则的 lastIndex
    MARKDOWN_REFERENCE_REGEX.lastIndex = 0
    return parseMarkdownReferences(trimmedContent)
  }

  // 普通文本
  return {
    text: trimmedContent,
    medias: [],
    hasSpecialFormat: false,
  }
}

/**
 * 格式化媒体类型显示名称
 */
export function formatMediaTypeName(type: 'image' | 'video' | 'document'): string {
  const names: Record<string, string> = {
    image: 'Image',
    video: 'Video',
    document: 'Document',
  }
  return names[type] || type
}
