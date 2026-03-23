import {
  CompleteMultipartUploadCommand,
  CopyObjectCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
  UploadPartCommand,
  UploadPartCommandInput,
  UploadPartCommandOutput,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { S3Config } from './s3.config'
import { S3_SIGNING_CLIENT } from './s3.constants'

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name)

  constructor(
    private readonly config: S3Config,
    private readonly client: S3Client,
    @Inject(S3_SIGNING_CLIENT) private readonly signingClient: S3Client,
  ) {}

  async putObject(
    objectPath: string,
    file: PutObjectCommandInput['Body'],
    contentType?: string,
  ) {
    const contentDisposition = contentType?.startsWith('video/') ? 'inline' : undefined

    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.config.bucketName,
        Key: objectPath,
        Body: file,
        ContentType: contentType,
        ContentDisposition: contentDisposition,
      },
    })
    await upload.done()
    return { path: objectPath }
  }

  async headObject(objectPath: string) {
    const command = new HeadObjectCommand({
      Bucket: this.config.bucketName,
      Key: objectPath,
    })
    return await this.client.send(command)
  }

  async putObjectFromUrl(
    url: string,
    objectPath: string,
  ) {
    try {
      await this.headObject(objectPath)
      return { path: objectPath, exists: true }
    }
    catch {
      const response = await fetch(url)
      if (response.body === null) {
        throw new AppException(ResponseCode.S3DownloadFileFailed)
      }
      const contentType = response.headers.get('content-type') || undefined
      return this.putObject(objectPath, response.body, contentType)
    }
  }

  // 生成预签名上传 URL
  async getUploadSignPost(objectPath: string, contentType?: string) {
    const result = await createPresignedPost(this.signingClient, {
      Bucket: this.config.bucketName,
      Key: objectPath,
      Expires: this.config.signExpires,
      Conditions: contentType ? [['eq', '$Content-Type', contentType]] : undefined,
      Fields: contentType ? { 'Content-Type': contentType } : undefined,
    })
    return result
  }

  async getUploadSignUrl(objectPath: string, contentType?: string, contentLength?: number) {
    return getSignedUrl(this.signingClient, new PutObjectCommand({
      Bucket: this.config.bucketName,
      Key: objectPath,
      ContentType: contentType,
      ContentLength: contentLength,
    }), { expiresIn: this.config.signExpires })
  }

  /**
   * 开始分片上传
   * @param {string} objectPath - 文件键
   * @param {string} contentType - 文件MIME类型
   * @returns {Promise<string>} - 返回上传ID
   */
  async initiateMultipartUpload(
    objectPath: string,
    contentType?: string,
  ): Promise<string> {
    const contentDisposition = contentType?.startsWith('video/') ? 'inline' : undefined

    const command = new CreateMultipartUploadCommand({
      Bucket: this.config.bucketName,
      Key: objectPath,
      ContentType: contentType,
      ContentDisposition: contentDisposition,
    })

    const response = await this.client.send(command)
    return response.UploadId!
  }

  /**
   * 上传单个分片
   * @param {string} objectPath - 文件键
   * @param {string} uploadId - 上传ID
   * @param {number} partNumber - 分片编号
   * @param {Buffer} partData - 分片数据
   * @returns {Promise<string>} - 返回ETag
   */
  async uploadPart(
    objectPath: string,
    uploadId: string,
    partNumber: number,
    partData: UploadPartCommandInput['Body'],
  ): Promise<UploadPartCommandOutput> {
    const command = new UploadPartCommand({
      Bucket: this.config.bucketName,
      Key: objectPath,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: partData,
    })

    return await this.client.send(command)
  }

  /**
   * 完成分片上传
   * @param {string} objectPath - 文件键
   * @param {string} uploadId - 上传ID
   * @param {Array<{ PartNumber: number; ETag: string }>} parts - 分片列表
   */
  async completeMultipartUpload(
    objectPath: string,
    uploadId: string,
    parts: { PartNumber: number, ETag: string }[],
  ): Promise<void> {
    const command = new CompleteMultipartUploadCommand({
      Bucket: this.config.bucketName,
      Key: objectPath,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    })

    await this.client.send(command)
  }

  // 删除文件
  async deleteObject(objectPath: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.config.bucketName,
      Key: objectPath,
    })
    await this.client.send(command)
  }

  /**
   * 复制对象（用于更新元数据/Content-Type）
   * S3 不支持直接更新元数据，需要通过复制对象到自身实现
   */
  async copyObject(
    objectPath: string,
    options: {
      contentType?: string
      contentDisposition?: string
      metadata?: Record<string, string>
    },
  ) {
    const command = new CopyObjectCommand({
      Bucket: this.config.bucketName,
      Key: objectPath,
      CopySource: `${this.config.bucketName}/${objectPath}`,
      ContentType: options.contentType,
      ContentDisposition: options.contentDisposition,
      Metadata: options.metadata,
      MetadataDirective: 'REPLACE',
    })
    await this.client.send(command)
  }

  /**
   * 生成预签名 GET URL（用于让外部服务读取 R2 对象，绕过 CDN 限制）
   */
  async getReadSignUrl(objectPath: string, expiresIn = 3600) {
    return getSignedUrl(this.signingClient, new GetObjectCommand({
      Bucket: this.config.bucketName,
      Key: objectPath,
    }), { expiresIn })
  }

  /**
   * 将 CDN URL 或 path 转为预签名 GET URL
   */
  async toPresignedUrl(urlOrPath: string, expiresIn = 3600): Promise<string> {
    const objectPath = this.extractObjectPath(urlOrPath)
    return this.getReadSignUrl(objectPath, expiresIn)
  }

  /**
   * 下载 S3 对象
   */
  async getObject(key: string) {
    const command = new GetObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
    })
    return await this.client.send(command)
  }

  private extractObjectPath(url: string): string {
    if (!url.startsWith('http')) {
      return url.replace(/^\/+/, '')
    }
    let path = url
    if (this.config.cdnEndpoint && url.startsWith(this.config.cdnEndpoint)) {
      path = url.replace(this.config.cdnEndpoint, '')
    }
    else if (url.startsWith(this.config.endpoint)) {
      path = url.replace(this.config.endpoint, '')
    }
    return decodeURIComponent(path.replace(/^\/+/, ''))
  }
}
