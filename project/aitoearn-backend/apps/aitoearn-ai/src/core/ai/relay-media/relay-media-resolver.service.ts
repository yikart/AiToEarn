import { basename } from 'node:path'
import type { AssetsConfig } from '@yikart/assets'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { AssetType } from '@yikart/mongodb'
import axios, { AxiosInstance } from 'axios'
import { RelayConfig } from '../libs/relay'
import { RELAY_MEDIA_ASSETS_CONFIG, RELAY_MEDIA_CONFIG } from './relay-media.module'

interface UploadSignResult {
  id: string
  url: string
  uploadUrl: string
}

interface RelayCommonResponse<T> {
  code?: number
  message?: string
  data: T
}

@Injectable()
export class RelayMediaResolverService {
  private readonly logger = new Logger(RelayMediaResolverService.name)
  private readonly httpClient: AxiosInstance | undefined
  private readonly localUrlPrefixes: string[]

  constructor(
    @Inject(RELAY_MEDIA_CONFIG) private readonly config: RelayConfig | undefined,
    @Inject(RELAY_MEDIA_ASSETS_CONFIG) private readonly assetsConfig: AssetsConfig | undefined,
  ) {
    this.localUrlPrefixes = []
    if (assetsConfig?.endpoint) {
      this.localUrlPrefixes.push(assetsConfig.endpoint.replace(/\/+$/, ''))
    }
    if (assetsConfig?.cdnEndpoint) {
      this.localUrlPrefixes.push(assetsConfig.cdnEndpoint.replace(/\/+$/, ''))
    }

    if (!config) {
      return
    }

    this.httpClient = axios.create({
      baseURL: config.url,
      timeout: config.timeout,
      headers: {
        'x-api-key': config.apiKey,
      },
    })
  }

  async resolveText(text: string): Promise<string> {
    if (!this.httpClient || !text || this.localUrlPrefixes.length === 0) {
      return text
    }

    const localUrls = this.extractLocalUrls(text)
    if (localUrls.length === 0) {
      return text
    }

    const uploadedByDownloadUrl = new Map<string, string>()
    let resolved = text
    for (const localUrl of localUrls) {
      const downloadUrl = this.toDownloadUrl(localUrl)
      if (!uploadedByDownloadUrl.has(downloadUrl)) {
        uploadedByDownloadUrl.set(downloadUrl, await this.uploadFileFromLocalUrl(downloadUrl))
      }
      const uploadedUrl = uploadedByDownloadUrl.get(downloadUrl)
      if (uploadedUrl) {
        resolved = resolved.split(localUrl).join(uploadedUrl)
      }
    }
    return resolved
  }

  async resolveJson<T>(value: T): Promise<T> {
    if (!this.httpClient || value == null) {
      return value
    }

    if (typeof value === 'string') {
      return await this.resolveText(value) as T
    }

    const serialized = JSON.stringify(value)
    if (!serialized) {
      return value
    }

    const resolved = await this.resolveText(serialized)
    return resolved === serialized
      ? value
      : JSON.parse(resolved) as T
  }

  private extractLocalUrls(text: string): string[] {
    if (this.localUrlPrefixes.length === 0) {
      return []
    }

    const urlPattern = new RegExp(
      `(${this.localUrlPrefixes.map(prefix => this.escapeRegExp(prefix)).join('|')})/[^"\\s]+`,
      'g',
    )
    return [...new Set(text.match(urlPattern) || [])]
  }

  private toDownloadUrl(localUrl: string): string {
    const cdnPrefix = this.assetsConfig?.cdnEndpoint?.replace(/\/+$/, '')
    const endpointPrefix = this.assetsConfig?.endpoint?.replace(/\/+$/, '')
    if (cdnPrefix && endpointPrefix && localUrl.startsWith(cdnPrefix)) {
      const bucket = this.assetsConfig && 'bucketName' in this.assetsConfig
        ? String(this.assetsConfig.bucketName || '')
        : ''
      const internalBase = `${endpointPrefix}${bucket ? `/${bucket}` : ''}`
      return localUrl.replace(cdnPrefix, internalBase)
    }
    return localUrl
  }

  private async post<T>(url: string, data: unknown): Promise<T> {
    const response = await this.httpClient!.post<RelayCommonResponse<T> | T>(url, data)
    const body = response.data

    if (this.isCommonResponse(body)) {
      if (body.code != null && body.code !== 0) {
        throw new Error(`Relay API error [${body.code}]: ${body.message}`)
      }
      return body.data
    }

    return body
  }

  private isCommonResponse<T>(body: RelayCommonResponse<T> | T): body is RelayCommonResponse<T> {
    return typeof body === 'object' && body !== null && 'data' in body
  }

  private async uploadFileFromLocalUrl(localUrl: string): Promise<string> {
    const filename = basename(new URL(localUrl).pathname)

    const fileResponse = await axios.get(localUrl, { responseType: 'arraybuffer' })
    const contentType = fileResponse.headers['content-type'] || 'application/octet-stream'
    const size = (fileResponse.data as ArrayBuffer).byteLength

    const signResult = await this.post<UploadSignResult>('/api/assets/uploadSign', {
      filename,
      type: AssetType.Temp,
      size,
    })

    if (!signResult.uploadUrl) {
      throw new Error(`Relay uploadSign returned no uploadUrl: ${JSON.stringify(signResult)}`)
    }

    await axios.put(signResult.uploadUrl, fileResponse.data, {
      headers: { 'Content-Type': contentType },
      timeout: this.config?.timeout,
    })

    await this.post(`/api/assets/${signResult.id}/confirm`, {})
    this.logger.debug({ localUrl, relayUrl: signResult.url }, 'Uploaded local media to relay')
    return signResult.url
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
}
