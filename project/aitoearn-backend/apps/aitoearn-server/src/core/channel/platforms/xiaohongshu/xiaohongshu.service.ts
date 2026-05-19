import { Injectable, Logger } from '@nestjs/common'
import { AccountType, PublishType } from '@yikart/aitoearn-server-client'
import { AppException, ResponseCode, WorkStatus } from '@yikart/common'
import axios from 'axios'
import { PlatformBaseService } from '../base.service'

@Injectable()
export class XiaohongshuService extends PlatformBaseService {
  protected override readonly platform: AccountType = AccountType.Xhs
  protected override readonly logger = new Logger(XiaohongshuService.name)

  constructor() {
    super()
  }

  async getAccessTokenStatus(_accountId: string): Promise<number> {
    return 0
  }

  /**
   * 获取作品信息
   * @param accountType
   * @param workLink
   * @param dataId
   * @returns
   */
  async getWorkLinkInfo(accountType: AccountType, workLink: string, dataId?: string): Promise<{
    dataId: string
    uniqueId: string
    type: PublishType
    videoType?: 'short' | 'long'
    resolvedUrl?: string
    originalWorkLink?: string
    workStatus?: WorkStatus.LINK_ERROR
  }> {
    const { noteId, resolvedUrl, xsecToken } = await this.parseXiaohongshuUrl(workLink)
    const resolvedDataId = noteId || dataId || ''
    if (!resolvedDataId) {
      throw new AppException(ResponseCode.InvalidWorkLink)
    }

    return {
      dataId: resolvedDataId,
      uniqueId: `${accountType}_${resolvedDataId}`,
      type: PublishType.VIDEO,
      videoType: 'short',
      resolvedUrl,
      originalWorkLink: resolvedUrl && resolvedUrl !== workLink ? workLink : undefined,
      workStatus: noteId && !xsecToken ? WorkStatus.LINK_ERROR : undefined,
    }
  }

  /**
   * 解析小红书 URL，提取笔记 ID
   * 支持的 URL 格式：
   * - https://www.xiaohongshu.com/explore/NOTE_ID
   * - https://www.xiaohongshu.com/discovery/item/NOTE_ID
   * - https://www.xiaohongshu.com/user/profile/USER_ID/NOTE_ID
   * - https://xhslink.com/SHORT_CODE（通过重定向解析为真实链接）
   * @param workLink 小红书链接
   * @returns noteId 或 null
   */
  private async parseXiaohongshuUrl(workLink: string): Promise<{ noteId: string | null, resolvedUrl?: string, xsecToken?: string }> {
    let url: URL
    try {
      url = new URL(workLink)
    }
    catch {
      return { noteId: null }
    }

    const hostname = url.hostname.replace('www.', '')

    if (hostname === 'xiaohongshu.com') {
      return { noteId: this.extractNoteIdFromXhsUrl(url), xsecToken: this.getXsecToken(url) }
    }

    if (hostname === 'xhslink.com') {
      return this.resolveXhsShortLink(workLink)
    }

    return { noteId: null }
  }

  /**
   * 从 xiaohongshu.com 长链接中提取笔记 ID
   */
  private extractNoteIdFromXhsUrl(url: URL): string | null {
    const pathname = url.pathname

    if (pathname.startsWith('/explore/')) {
      return pathname.split('/explore/')[1]?.split(/[?&#/]/)[0] || null
    }
    if (pathname.startsWith('/discovery/item/')) {
      return pathname.split('/discovery/item/')[1]?.split(/[?&#/]/)[0] || null
    }
    if (pathname.includes('/user/profile/')) {
      const parts = pathname.split('/')
      const noteId = parts[parts.length - 1]
      return noteId?.split(/[?&#]/)[0] || null
    }

    return null
  }

  /**
   * 解析小红书短链接，通过 HTTP 重定向获取真实 noteId
   */
  private async resolveXhsShortLink(shortUrl: string): Promise<{ noteId: string | null, resolvedUrl?: string, xsecToken?: string }> {
    try {
      const response = await axios.get(shortUrl, {
        maxRedirects: 5,
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      })
      const finalUrl: string | undefined = response.request?.res?.responseUrl || response.config?.url
      if (!finalUrl) {
        return { noteId: null }
      }

      const resolvedUrl = new URL(finalUrl)
      if (resolvedUrl.hostname.replace('www.', '') === 'xiaohongshu.com') {
        return {
          noteId: this.extractNoteIdFromXhsUrl(resolvedUrl),
          resolvedUrl: finalUrl,
          xsecToken: this.getXsecToken(resolvedUrl),
        }
      }

      return { noteId: null }
    }
    catch (error) {
      this.logger.error(error, `Failed to resolve xhs short link: ${shortUrl}`)
      return { noteId: null }
    }
  }

  private getXsecToken(url: URL): string | undefined {
    return url.searchParams.get('xsec_token')?.trim() || undefined
  }
}
