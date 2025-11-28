import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommandInput,
  S3Client,
  UploadPartCommand,
  UploadPartCommandInput,
  UploadPartCommandOutput,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { S3Config } from './s3.config'
import { buildUrl } from './s3.util'

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name)
  private readonly publicEndpoint: string

  constructor(
    private readonly config: S3Config,
    private readonly client: S3Client,
  ) {
    this.publicEndpoint = config.cdnEndpoint || config.endpoint
  }

  async putObject(
    objectPath: string,
    file: PutObjectCommandInput['Body'],
    contentType?: string,
  ) {
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.config.bucketName,
        Key: objectPath,
        Body: file,
        ContentType: contentType,
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
      return this.putObject(objectPath, response.body)
    }
  }

  // 生成预签名上传 URL
  async getUploadSign(objectPath: string, contentType?: string) {
    const result = await createPresignedPost(this.client, {
      Bucket: this.config.bucketName,
      Key: objectPath,
      Expires: this.config.signExpires,
      Conditions: contentType ? [['eq', '$Content-Type', contentType]] : undefined,
      Fields: contentType ? { 'Content-Type': contentType } : undefined,
    })
    return result
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
    const command = new CreateMultipartUploadCommand({
      Bucket: this.config.bucketName,
      Key: objectPath,
      ContentType: contentType,
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

  buildUrl(objectPath: string) {
    return buildUrl(this.publicEndpoint, objectPath)
  }
}
