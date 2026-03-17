import type OSS from 'ali-oss'
import type { Readable } from 'node:stream'
import type { CopyObjectOptions, StorageGetObjectResult, StorageHeadResult } from '../storage-provider'
import { AliOssService } from '@yikart/ali-oss'
import { StorageProvider } from '../storage-provider'

export class AliOssAdapter extends StorageProvider {
  constructor(
    private readonly aliOssService: AliOssService,
    endpoint: string,
    cdnEndpoint?: string,
    private readonly callbackUrl?: string,
  ) {
    super(endpoint, cdnEndpoint)
  }

  async putObject(objectPath: string, file: Buffer | Readable, contentType?: string): Promise<{ path: string }> {
    const options = contentType ? { headers: { 'Content-Type': contentType } } : undefined
    await this.aliOssService.putObject(objectPath, file as Buffer, options)
    return { path: objectPath }
  }

  async headObject(objectPath: string): Promise<StorageHeadResult> {
    const result = await this.aliOssService.headObject(objectPath)
    const headers = result.res?.headers as Record<string, string> | undefined
    return {
      contentLength: headers?.['content-length'] ? Number(headers['content-length']) : undefined,
      contentType: headers?.['content-type'],
    }
  }

  async putObjectFromUrl(url: string, objectPath: string): Promise<{ path: string, exists?: boolean }> {
    return this.aliOssService.putObjectFromUrl(url, objectPath)
  }

  async deleteObject(objectPath: string): Promise<void> {
    await this.aliOssService.deleteObject(objectPath)
  }

  private static readonly MIN_TRAFFIC_LIMIT = 819200

  async getUploadSignUrl(objectPath: string, contentType?: string, contentLength?: number, callbackVars?: Record<string, string>): Promise<string> {
    const callback: OSS.ObjectCallback | undefined = this.callbackUrl
      ? this.buildCallback(callbackVars)
      : undefined
    const trafficLimit = contentLength
      ? Math.max(contentLength, AliOssAdapter.MIN_TRAFFIC_LIMIT)
      : undefined
    return this.aliOssService.getUploadSignUrl(objectPath, contentType, trafficLimit, callback)
  }

  private buildCallback(callbackVars?: Record<string, string>): OSS.ObjectCallback {
    const customBody = callbackVars
      ? `,${this.parseResultBody(callbackVars)}`
      : ''
    return {
      url: this.callbackUrl!,
      body: `{"object":\${object},"size":\${size},"mimeType":\${mimeType}${customBody}}`,
      contentType: 'application/json',
    }
  }

  private parseResultBody(data: Record<string, string>): string {
    const str = JSON.stringify(data)
    return str.slice(1, str.length - 1)
  }

  async copyObject(objectPath: string, options: CopyObjectOptions): Promise<void> {
    await this.aliOssService.copyObject(objectPath, options)
  }

  async getObject(objectPath: string): Promise<StorageGetObjectResult> {
    const result = await this.aliOssService.getObject(objectPath)
    const buffer = result.content ? Buffer.from(result.content) : undefined
    return { buffer }
  }

  async getReadSignUrl(objectPath: string, expiresIn?: number): Promise<string> {
    return Promise.resolve(this.aliOssService.getSignUrl(objectPath, expiresIn ? { expires: expiresIn } : undefined))
  }
}
