import type { ChannelWorkDataResult, WorkLinkInfoInput, WorkProvider } from '../platforms.interface'
import { Injectable, Logger } from '@nestjs/common'
import { PublishType } from '@yikart/aitoearn-server-shared'
import { AccountType, AppException, ResponseCode } from '@yikart/common'
import axios from 'axios'
import { buildDouyinVideoWorkLink } from './douyin.interface'

@Injectable()
export class DouyinWorkProvider implements WorkProvider {
  readonly requiresCredentialForLinkInfo = false
  private readonly logger = new Logger(DouyinWorkProvider.name)

  async getLinkInfo(input: WorkLinkInfoInput): Promise<ChannelWorkDataResult> {
    const resolvedUrl = await this.normalizeLink(input.link)
    const dataId = this.parseWorkId(resolvedUrl)
    if (!dataId) {
      throw new AppException(ResponseCode.InvalidWorkLink)
    }

    const url = this.buildWorkLink(dataId, resolvedUrl)
    return {
      snapshots: [],
      work: {
        id: dataId,
        url,
        mediaType: PublishType.VIDEO,
      },
      extra: {
        dataId,
        uniqueId: `${AccountType.Douyin}_${dataId}`,
        type: PublishType.VIDEO,
        videoType: 'short',
        resolvedUrl: url,
      },
      rawResponse: { resolvedUrl },
    }
  }

  private async normalizeLink(link: string): Promise<string> {
    try {
      const url = new URL(link)
      if (url.hostname.replace(/^www\./, '') === 'v.douyin.com') {
        return await this.resolveRedirectUrl(link)
      }
    }
    catch {
      return link
    }
    return link
  }

  private parseWorkId(link: string): string | undefined {
    let url: URL
    try {
      url = new URL(link)
    }
    catch {
      return undefined
    }

    const hostname = url.hostname.replace(/^www\./, '')
    const pathname = url.pathname
    if (hostname === 'douyin.com') {
      if (pathname.startsWith('/video/')) {
        return pathname.split('/video/')[1]?.split(/[?&#/]/)[0] || undefined
      }
      if (pathname.startsWith('/note/')) {
        return pathname.split('/note/')[1]?.split(/[?&#/]/)[0] || undefined
      }
      return url.searchParams.get('modal_id') ?? undefined
    }
    if (hostname === 'iesdouyin.com') {
      return pathname.match(/\/video\/(\d+)/)?.[1]
    }
    return undefined
  }

  private async resolveRedirectUrl(link: string): Promise<string> {
    try {
      const response = await axios.get(link, {
        maxRedirects: 5,
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      })
      return response.request?.res?.responseUrl || response.config?.url || link
    }
    catch (err) {
      this.logger.warn(err, `Failed to resolve Douyin short link: ${link}`)
      throw new AppException(ResponseCode.InvalidWorkLink)
    }
  }

  private buildWorkLink(dataId: string, resolvedUrl: string): string {
    try {
      const url = new URL(resolvedUrl)
      if (url.hostname.replace(/^www\./, '') === 'douyin.com' && url.pathname.startsWith('/note/')) {
        return `https://www.douyin.com/note/${dataId}`
      }
    }
    catch {
      // Fall back to the canonical video URL below.
    }
    return buildDouyinVideoWorkLink(dataId)
  }
}
