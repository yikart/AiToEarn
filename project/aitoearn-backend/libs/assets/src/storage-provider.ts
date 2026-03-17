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
    if (!url.startsWith('http'))
      return url.replace(/^\/+/, '')
    let path = url
    if (this.cdnEndpoint && url.startsWith(this.cdnEndpoint)) {
      path = url.replace(this.cdnEndpoint, '')
    }
    else if (url.startsWith(this.endpoint)) {
      path = url.replace(this.endpoint, '')
    }
    return decodeURIComponent(path.replace(/^\/+/, ''))
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
    const objectPath = this.parsePathFromUrl(urlOrPath)
    return this.getReadSignUrl(objectPath, expiresIn)
  }
}
