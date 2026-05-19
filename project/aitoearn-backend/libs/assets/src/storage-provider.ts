import type { Readable } from 'node:stream'
import { buildUrl } from '@yikart/common'

export interface StorageHeadResult {
  contentLength?: number
  contentType?: string
}

export interface StorageGetObjectResult {
  buffer: Buffer | undefined
}

export interface CopyObjectOptions {
  contentType?: string
  contentDisposition?: string
  metadata?: Record<string, string>
}

export abstract class StorageProvider {
  protected readonly endpoint: string
  protected readonly cdnEndpoint: string | undefined
  protected readonly publicEndpoint: string

  constructor(endpoint: string, cdnEndpoint?: string) {
    this.endpoint = endpoint.replace(/\/+$/, '')
    this.cdnEndpoint = cdnEndpoint?.replace(/\/+$/, '')
    this.publicEndpoint = this.cdnEndpoint || this.endpoint
  }

  buildUrl(objectPath: string): string {
    return buildUrl(this.publicEndpoint, objectPath)
  }

  parsePathFromUrl(url: string): string {
    const normalizedUrl = String(url ?? '').trim()
    if (!normalizedUrl.startsWith('http'))
      return normalizedUrl.replace(/^\/+/, '')
    let path = normalizedUrl
    if (this.cdnEndpoint && normalizedUrl.startsWith(this.cdnEndpoint)) {
      path = normalizedUrl.replace(this.cdnEndpoint, '')
    }
    else if (normalizedUrl.startsWith(this.endpoint)) {
      path = normalizedUrl.replace(this.endpoint, '')
    }
    return decodeURIComponent(path.split(/[?#]/)[0].replace(/^\/+/, ''))
  }

  abstract putObject(objectPath: string, file: Buffer | Readable, contentType?: string): Promise<{ path: string }>
  abstract headObject(objectPath: string): Promise<StorageHeadResult>
  abstract putObjectFromUrl(url: string, objectPath: string): Promise<{ path: string, exists?: boolean }>
  abstract deleteObject(objectPath: string): Promise<void>
  abstract getUploadSignUrl(objectPath: string, contentType?: string, contentLength?: number, callbackVars?: Record<string, string>): Promise<string>
  abstract copyObject(objectPath: string, options: CopyObjectOptions): Promise<void>
  abstract getObject(objectPath: string): Promise<StorageGetObjectResult>
  abstract getReadSignUrl(objectPath: string, expiresIn?: number): Promise<string>

  async toPresignedUrl(urlOrPath: string, expiresIn = 3600): Promise<string> {
    const normalizedUrlOrPath = String(urlOrPath ?? '').trim()
    if (
      (normalizedUrlOrPath.startsWith('http://') || normalizedUrlOrPath.startsWith('https://'))
      && !(this.cdnEndpoint && normalizedUrlOrPath.startsWith(this.cdnEndpoint))
      && !normalizedUrlOrPath.startsWith(this.endpoint)
    ) {
      return normalizedUrlOrPath
    }
    const objectPath = this.parsePathFromUrl(normalizedUrlOrPath)
    return this.getReadSignUrl(objectPath, expiresIn)
  }
}
