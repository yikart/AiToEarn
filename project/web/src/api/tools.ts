import type { AiCreateType } from './types/tools'
/*
 * @Author: nevin
 * @Date: 2025-02-22 12:02:55
 * @LastEditTime: 2025-03-02 22:21:01
 * @LastEditors: nevin
 * @Description: 工具
 */
import http, { request } from '@/utils/request'

export const toolsApi = {
  /**
   * 获取智能标题
   * @param url
   * @param type 1=标题 2=描述
   * @param max
   */
  async apiVideoAiTitle(url: string, type: AiCreateType, max: number) {
    const res = await http.post<string>('tools/ai/video/title', {
      url,
      type,
      max: max - 10,
    })
    return res!.data
  },

  /**
   * 智能图文
   */
  async apiReviewImgAi(data: {
    imgUrl: string
    title?: string
    desc?: string
    max?: number
  }) {
    const res = await http.post<string>('tools/ai/reviewImg', data)
    return res!.data
  },

  /**
   * 智能评论
   */
  async apiReviewAi(data: { title: string, desc?: string, max?: number }) {
    const res = await http.post<string>('tools/ai/review', data)
    return res!.data
  },

  /**
   * 智能评论回复
   */
  async apiReviewAiRecover(data: {
    content: string
    title?: string
    desc?: string
    max?: number
  }) {
    const res = await http.post<string>('tools/ai/recover/review', data)
    return res!.data
  },

  /**
   * 生成AI的html图文 弃用: 时间太长得走sse
   */
  async aiArticleHtml(content: string) {
    const res = await http.post<string>('tools/ai/article/html', {
      content,
    })
    return res!.data
  },

  // TODO: sse生成AI的html图文

  /**
   * 文本内容安全
   */
  async textModeration(content: string) {
    const res = await http.post<string>('aliGreen/textGreen', {
      content,
    })
    return res
  },
}
