import type { ChannelWorkDataResult, WorkLinkInfoInput, WorkProvider } from '../platforms.interface'
import { Injectable, Logger } from '@nestjs/common'
import { PublishType } from '@yikart/aitoearn-server-shared'
import { AccountType, AppException, ResponseCode } from '@yikart/common'
import axios from 'axios'

@Injectable()
export class BilibiliWorkProvider implements WorkProvider {
  readonly requiresCredentialForLinkInfo = false
  private readonly logger = new Logger(BilibiliWorkProvider.name)

  async getLinkInfo(input: WorkLinkInfoInput): Promise<ChannelWorkDataResult> {
    const resolvedUrl = await this.normalizeLink(input.link)
    const dataId = this.parseVideoId(resolvedUrl)
    if (!dataId) {
      throw new AppException(ResponseCode.InvalidWorkLink)
    }

    const url = `https://www.bilibili.com/video/${dataId}`
    return {
      snapshots: [],
      work: {
        id: dataId,
        url,
        mediaType: PublishType.VIDEO,
      },
      extra: {
        dataId,
        uniqueId: `${AccountType.Bilibili}_${dataId}`,
        type: PublishType.VIDEO,
        videoType: 'long',
        resolvedUrl: url,
      },
      rawResponse: { resolvedUrl },
    }
  }

  private async normalizeLink(link: string): Promise<string> {
    let url: URL
    try {
      url = new URL(link)
    }
    catch {
      return link
    }

    const hostname = url.hostname.replace(/^www\./, '')
    if (hostname === 'b23.tv') {
      return this.resolveRedirectUrl(link)
    }
    return link
  }

  private parseVideoId(link: string): string | undefined {
    let url: URL
    try {
      url = new URL(link)
    }
    catch {
      return undefined
    }

    const hostname = url.hostname.replace(/^www\./, '')
    if (hostname !== 'bilibili.com' && hostname !== 'm.bilibili.com') {
      return undefined
    }

    return url.pathname.match(/\/video\/(BV[0-9A-Z]+|av\d+)/i)?.[1]
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
      this.logger.warn(err, `Failed to resolve Bilibili short link: ${link}`)
      throw new AppException(ResponseCode.InvalidWorkLink)
    }
  }
}
