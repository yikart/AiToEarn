import type { ContentBlockParam } from '@anthropic-ai/sdk/resources'
import type { ContentBlock } from './agent.dto'
import { SDKMessage } from '@anthropic-ai/claude-agent-sdk'

/**
 * 标准化 prompt 为 content 数组
 * 将字符串转换为文本内容块数组，或直接返回已有的内容块数组
 */
export function normalizePrompt(prompt: string | ContentBlock[]): ContentBlock[] {
  if (typeof prompt === 'string') {
    return [{ type: 'text', text: prompt }]
  }
  return prompt
}

/**
 * 增强 prompt，在文本中添加图片和视频URL的结构化说明
 * 用于发送给模型，不应保存到数据库
 * 注意：video 块会被过滤掉（转换为文本说明），因为 Anthropic SDK 原生不支持 video 类型
 */
export function enhancePrompt(blocks: ContentBlock[]): ContentBlockParam[] {
  const imageUrls: string[] = []
  const videoUrls: string[] = []

  for (const block of blocks) {
    if (block.type === 'image' && 'source' in block && block.source && typeof block.source === 'object' && 'url' in block.source) {
      imageUrls.push(block.source.url as string)
    }
    if (block.type === 'video' && 'source' in block && block.source && typeof block.source === 'object' && 'url' in block.source) {
      videoUrls.push(block.source.url as string)
    }
  }

  // 过滤掉 video 块（原生不支持）
  const filteredBlocks = blocks.filter(block => block.type !== 'video')

  if (imageUrls.length === 0 && videoUrls.length === 0) {
    return filteredBlocks
  }

  let mediaListText = ''

  if (imageUrls.length > 0) {
    mediaListText += `\n\nReference Images:\n${imageUrls.map((url, index) => `- Image ${index + 1}: ${url}`).join('\n')}`
  }

  if (videoUrls.length > 0) {
    mediaListText += `\n\nReference Videos:\n${videoUrls.map((url, index) => `- Video ${index + 1}: ${url}`).join('\n')}`
  }

  let firstTextBlockIndex = -1
  for (let i = 0; i < filteredBlocks.length; i++) {
    if (filteredBlocks[i].type === 'text') {
      firstTextBlockIndex = i
      break
    }
  }

  const result = [...filteredBlocks]

  if (firstTextBlockIndex !== -1) {
    const textBlock = result[firstTextBlockIndex] as { type: 'text', text: string }
    result[firstTextBlockIndex] = {
      type: 'text',
      text: `${textBlock.text}${mediaListText}`,
    }
  }
  else {
    result.unshift({
      type: 'text',
      text: `Please use the following media:${mediaListText}`,
    })
  }

  return result
}

/**
 * 过滤请求 headers，移除基础 HTTP headers，保留业务相关的 headers
 * @param headers 原始请求 headers
 * @returns 过滤后的 headers
 */
export function filterHeaders(headers: Record<string, unknown>): Record<string, string> {
  const basicHeaders = new Set([
    'host',
    'connection',
    'content-length',
    'content-type',
    'accept',
    'accept-encoding',
    'user-agent',
    'cache-control',
    'pragma',
    'upgrade-insecure-requests',
    'if-modified-since',
    'if-none-match',
  ])

  const filtered: Record<string, string> = {}

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase()
    if (!basicHeaders.has(lowerKey)) {
      if (typeof value === 'string') {
        filtered[key] = value
      }
      else if (Array.isArray(value)) {
        filtered[key] = value.join(', ')
      }
    }
  }

  return filtered
}

/**
 * 判断消息是否应该被过滤
 * 过滤掉 type 为 user 且 isSynthetic 为 true 的消息
 * 这些消息不应该保存到数据库，也不应该返回到前端
 */
export function shouldFilterSyntheticMessage(message: SDKMessage): boolean {
  return (
    message.type === 'user'
    && 'isSynthetic' in message
    && message.isSynthetic === true
  ) || message.type === 'system'
}

export function sanitizeMessage(msg: SDKMessage): Omit<SDKMessage, 'session_id'> {
  const { session_id, ...rest } = msg
  if (rest.type === 'assistant') {
    rest.message.content.forEach((block) => {
      if (block.type === 'text' && block.text === '(no content)') {
        block.text = ''
      }
    })
  }
  if (rest.type === 'user' && typeof rest.message.content !== 'string') {
    rest.message.content.forEach((block) => {
      if (block.type === 'tool_result' && block.content && typeof block.content !== 'string') {
        block.content.forEach((subBlock) => {
          if (subBlock.type === 'image') {
            if (subBlock.source.type === 'base64') {
              subBlock.source.data = ''
            }
          }
        })
      }
    })
    if (rest.tool_use_result && typeof rest.tool_use_result !== 'string' && Array.isArray(rest.tool_use_result)) {
      rest.tool_use_result.forEach((block) => {
        if (block.type === 'image') {
          if (block.source.type === 'base64') {
            block.source.data = ''
          }
        }
      })
    }
  }
  return rest
}
