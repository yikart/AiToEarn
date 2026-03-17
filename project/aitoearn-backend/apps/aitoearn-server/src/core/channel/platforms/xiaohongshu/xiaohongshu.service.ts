import { Injectable, Logger } from '@nestjs/common'
import { AccountType, PublishType } from '@yikart/aitoearn-server-client'
import { AppException, ResponseCode } from '@yikart/common'
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
  }> {
    const noteId = this.parseXiaohongshuUrl(workLink)
    const resolvedDataId = noteId || dataId || ''
    if (!resolvedDataId) {
      throw new AppException(ResponseCode.InvalidWorkLink)
    }

    return {
      dataId: resolvedDataId,
      uniqueId: `${accountType}_${resolvedDataId}`,
      type: PublishType.VIDEO,
      videoType: 'short',
    }
  }

  /**
   * 解析小红书 URL，提取笔记 ID
   * 支持的 URL 格式：
   * - https://www.xiaohongshu.com/explore/NOTE_ID
   * - https://www.xiaohongshu.com/discovery/item/NOTE_ID
   * - https://www.xiaohongshu.com/user/profile/USER_ID/NOTE_ID
   * - https://xhslink.com/SHORT_CODE
   * @param workLink 小红书链接
   * @returns noteId 或 null
   */
  private parseXiaohongshuUrl(workLink: string): string | null {
    let url: URL
    try {
      url = new URL(workLink)
    }
    catch {
      return null
    }

    const hostname = url.hostname.replace('www.', '')

    if (hostname === 'xiaohongshu.com') {
      const pathname = url.pathname

      if (pathname.startsWith('/explore/')) {
        // https://www.xiaohongshu.com/explore/NOTE_ID
        return pathname.split('/explore/')[1]?.split(/[?&#/]/)[0] || null
      }
      else if (pathname.startsWith('/discovery/item/')) {
        // https://www.xiaohongshu.com/discovery/item/NOTE_ID
        return pathname.split('/discovery/item/')[1]?.split(/[?&#/]/)[0] || null
      }
      else if (pathname.includes('/user/profile/')) {
        // https://www.xiaohongshu.com/user/profile/USER_ID/NOTE_ID
        const parts = pathname.split('/')
        const noteId = parts[parts.length - 1]
        return noteId?.split(/[?&#]/)[0] || null
      }
    }
    else if (hostname === 'xhslink.com') {
      // https://xhslink.com/SHORT_CODE
      // 短链接需要通过重定向获取真实链接，这里只返回短码作为 ID
      return url.pathname.slice(1).split(/[?&#/]/)[0] || null
    }

    return null
  }
}
