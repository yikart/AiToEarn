import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import OSS from 'ali-oss'
import { AliOssConfig } from './ali-oss.config'

@Injectable()
export class AliOssService {
  private readonly logger = new Logger(AliOssService.name)

  constructor(
    private readonly config: AliOssConfig,
    private readonly client: OSS,
  ) {}

  getClient(): OSS {
    return this.client
  }

  async putObject(key: string, file: Buffer | string, options?: OSS.PutObjectOptions) {
    return await this.client.put(key, file, options)
  }

  async putObjectFromUrl(url: string, objectPath: string) {
    try {
      await this.client.head(objectPath)
      return { path: objectPath, exists: true }
    }
    catch {
      const response = await fetch(url)
      if (response.body === null) {
        throw new AppException(ResponseCode.S3DownloadFileFailed)
      }
      const buffer = Buffer.from(await response.arrayBuffer())
      const contentType = response.headers.get('content-type') || undefined
      const options: OSS.PutObjectOptions = contentType ? { headers: { 'Content-Type': contentType } } : {}
      await this.client.put(objectPath, buffer, options)
      return { path: objectPath }
    }
  }

  async getObject(key: string) {
    return await this.client.get(key)
  }

  async deleteObject(key: string) {
    return await this.client.delete(key)
  }

  async listObjects(query: OSS.ListObjectsQuery, options?: OSS.RequestOptions) {
    return await this.client.list(query, options ?? {})
  }

  async getSignUrl(key: string, options?: OSS.SignatureUrlOptions) {
    return this.client.signatureUrl(key, options)
  }

  getUploadSignUrl(key: string, contentType?: string, trafficLimit?: number, callback?: OSS.ObjectCallback): string {
    return this.client.signatureUrl(key, {
      'method': 'PUT',
      'expires': this.config.signExpires,
      'Content-Type': contentType,
      trafficLimit,
      ...(callback ? { callback } : {}),
    })
  }

  async headObject(key: string) {
    return await this.client.head(key)
  }

  async copyObject(
    objectPath: string,
    options: {
      contentType?: string
      contentDisposition?: string
      metadata?: Record<string, string>
    },
  ) {
    const headers: Record<string, string> = {}
    if (options.contentType)
      headers['Content-Type'] = options.contentType
    if (options.contentDisposition)
      headers['Content-Disposition'] = options.contentDisposition
    const copyOptions: OSS.CopyObjectOptions = {
      headers,
      meta: options.metadata as OSS.UserMeta | undefined,
    }
    await this.client.copy(objectPath, objectPath, copyOptions)
  }
}
