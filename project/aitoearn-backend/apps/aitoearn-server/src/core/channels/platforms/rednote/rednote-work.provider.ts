import type { ChannelWorkDataResult, WorkLinkInfoInput, WorkProvider } from '../platforms.interface'
import { Injectable, Logger } from '@nestjs/common'
import { AccountType, AppException, ResponseCode, WorkStatus } from '@yikart/common'
import { PublishType } from '@yikart/mongodb'
import axios from 'axios'

export type RedNoteWorkLinkExtra = {
  dataId: string
  uniqueId: string
  type: PublishType
  videoType: 'short'
  resolvedUrl: string
  originalWorkLink?: string
  workStatus?: WorkStatus
} & Record<string, string | PublishType | WorkStatus | undefined>

export type RedNoteWorkLinkInfoResult = ChannelWorkDataResult<RedNoteWorkLinkExtra> & { extra: RedNoteWorkLinkExtra }

@Injectable()
export class RedNoteWorkProvider implements WorkProvider {
  readonly requiresCredentialForLinkInfo = false
  private readonly logger = new Logger(RedNoteWorkProvider.name)

  async getLinkInfo(input: WorkLinkInfoInput): Promise<ChannelWorkDataResult> {
    return this.getWorkLinkInfo(input.link, input.dataId)
  }

  async getWorkLinkInfo(workLink: string, dataId?: string): Promise<RedNoteWorkLinkInfoResult> {
    const parsed = await this.parseRedNoteUrl(workLink)
    const resolvedDataId = parsed.noteId || dataId || ''
    if (!resolvedDataId) {
      throw new AppException(ResponseCode.InvalidWorkLink)
    }

    const resolvedUrl = parsed.resolvedUrl ?? workLink
    const extra: RedNoteWorkLinkExtra = {
      dataId: resolvedDataId,
      uniqueId: `${AccountType.RedNote}_${resolvedDataId}`,
      type: PublishType.VIDEO,
      videoType: 'short',
      resolvedUrl,
      originalWorkLink: resolvedUrl !== workLink ? workLink : undefined,
      workStatus: parsed.noteId && !parsed.xsecToken ? WorkStatus.LINK_ERROR : undefined,
    }

    return {
      work: {
        id: resolvedDataId,
        url: resolvedUrl,
        mediaType: PublishType.VIDEO,
        status: extra.workStatus,
      },
      snapshots: [],
      extra,
      rawResponse: parsed,
    }
  }

  private async parseRedNoteUrl(workLink: string): Promise<{ noteId: string | null, resolvedUrl?: string, xsecToken?: string }> {
    let url: URL
    try {
      url = new URL(workLink)
    }
    catch {
      return { noteId: null }
    }

    const hostname = url.hostname.replace(/^www\./, '')
    if (hostname === 'xiaohongshu.com') {
      return {
        noteId: this.extractNoteId(url),
        resolvedUrl: workLink,
        xsecToken: this.getXsecToken(url),
      }
    }

    if (hostname === 'xhslink.com') {
      return this.resolveShortLink(workLink)
    }

    return { noteId: null }
  }

  private extractNoteId(url: URL): string | null {
    const segments = url.pathname.split('/').filter(Boolean)
    if (segments[0] === 'explore' && segments[1]) {
      return segments[1]
    }
    if (segments[0] === 'red_video' && segments[1]) {
      return segments[1]
    }
    if (segments[0] === 'discovery' && segments[1] === 'item' && segments[2]) {
      return segments[2]
    }
    if (segments[0] === 'user' && segments[1] === 'profile' && segments[3]) {
      return segments[3]
    }
    return null
  }

  private async resolveShortLink(shortUrl: string): Promise<{ noteId: string | null, resolvedUrl?: string, xsecToken?: string }> {
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
      if (resolvedUrl.hostname.replace(/^www\./, '') !== 'xiaohongshu.com') {
        return { noteId: null }
      }

      return {
        noteId: this.extractNoteId(resolvedUrl),
        resolvedUrl: finalUrl,
        xsecToken: this.getXsecToken(resolvedUrl),
      }
    }
    catch (error) {
      this.logger.warn(error, `Failed to resolve RedNote short link: ${shortUrl}`)
      return { noteId: null }
    }
  }

  private getXsecToken(url: URL): string | undefined {
    return url.searchParams.get('xsec_token')?.trim() || undefined
  }
}
