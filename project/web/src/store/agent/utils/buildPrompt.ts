/**
 * 构建 Prompt 工具
 * 将用户输入的文本和媒体文件转换为 Claude Prompt 格式
 */

import type { IUploadedMedia, IPromptContentItem } from '../agent.types'

/**
 * 构建 Claude Prompt 格式
 * @param text 用户输入的文本
 * @param medias 媒体文件列表
 * @returns Claude Prompt 格式的数组
 */
export function buildClaudePrompt(
  text: string,
  medias: IUploadedMedia[] = [],
): IPromptContentItem[] {
  const prompt: IPromptContentItem[] = []

  // 过滤有效的媒体文件（已上传完成的）
  const validMedias = medias.filter((m) => m.url && m.progress === undefined)

  // 添加媒体内容项
  validMedias.forEach((media) => {
    const item: IPromptContentItem = {
      type: media.type as 'image' | 'video' | 'document',
      source: {
        type: 'url',
        url: media.url,
      },
    }

    // 如果有缓存控制，添加到项中
    if (media.cache_control) {
      item.cache_control = media.cache_control
    }

    prompt.push(item)
  })

  // 添加文本内容项（放在最后）
  if (text.trim()) {
    prompt.push({
      type: 'text',
      text: text.trim(),
    })
  }

  return prompt
}

/**
 * 将 Claude Prompt 格式转换为 API 所需格式
 * @param text 用户输入的文本
 * @param medias 媒体文件列表
 * @returns JSON 数组格式，如果没有媒体则返回纯文本
 */
export function buildPromptForAPI(
  text: string,
  medias: IUploadedMedia[] = [],
): string | IPromptContentItem[] {
  // 过滤有效的媒体文件
  const validMedias = medias.filter((m) => m.url && m.progress === undefined)

  // 如果没有媒体文件，直接返回文本
  if (validMedias.length === 0) {
    return text.trim()
  }

  // 否则返回 Claude Prompt 格式数组
  return buildClaudePrompt(text, medias)
}

