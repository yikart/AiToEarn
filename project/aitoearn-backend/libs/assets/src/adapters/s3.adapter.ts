import type { Readable } from 'node:stream'
import type { CopyObjectOptions, StorageGetObjectResult, StorageHeadResult } from '../storage-provider'
import { S3Service } from '@yikart/aws-s3'
import { StorageProvider } from '../storage-provider'

export class S3Adapter extends StorageProvider {
  constructor(
    private readonly s3Service: S3Service,
    endpoint: string,
    cdnEndpoint?: string,
  ) {
    super(endpoint, cdnEndpoint)
  }

  async putObject(objectPath: string, file: Buffer | Readable, contentType?: string): Promise<{ path: string }> {
    return this.s3Service.putObject(objectPath, file, contentType)
  }

  async headObject(objectPath: string): Promise<StorageHeadResult> {
    const result = await this.s3Service.headObject(objectPath)
    return {
      contentLength: result.ContentLength,
      contentType: result.ContentType,
    }
  }

  async putObjectFromUrl(url: string, objectPath: string): Promise<{ path: string, exists?: boolean }> {
    return this.s3Service.putObjectFromUrl(url, objectPath)
  }

  async deleteObject(objectPath: string): Promise<void> {
    await this.s3Service.deleteObject(objectPath)
  }

  async getUploadSignUrl(objectPath: string, contentType?: string, contentLength?: number, _callbackVars?: Record<string, string>): Promise<string> {
    return this.s3Service.getUploadSignUrl(objectPath, contentType, contentLength)
  }

  async copyObject(objectPath: string, options: CopyObjectOptions): Promise<void> {
    await this.s3Service.copyObject(objectPath, options)
  }

  async getObject(objectPath: string): Promise<StorageGetObjectResult> {
    const response = await this.s3Service.getObject(objectPath)
    const buffer = response.Body ? Buffer.from(await response.Body.transformToByteArray()) : undefined
    return { buffer }
  }

  async getReadSignUrl(objectPath: string, expiresIn?: number): Promise<string> {
    return this.s3Service.getReadSignUrl(objectPath, expiresIn)
  }
}
