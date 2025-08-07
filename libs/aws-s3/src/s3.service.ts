import type {
  S3Client,
  UploadPartCommandOutput,
} from '@aws-sdk/client-s3'
import type { S3Config } from './s3.config'
import { AppException, ResponseCode } from '@aitoearn/common'
import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  PutObjectCommand,
  UploadPartCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name)
  constructor(
    private readonly config: S3Config,
    private readonly client: S3Client,
  ) {

  }

  // 上传文件（可指定 Bucket）
  async uploadFile(
    key: string,
    file: Buffer,
    contentType = 'application/octet-stream',
    bucketName?: string,
  ) {
    const command = new PutObjectCommand({
      Bucket: bucketName || this.config.bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
    })
    try {
      await this.client.send(command)
      return { key }
    }
    catch (error) {
      this.logger.error(error)
      throw new AppException(ResponseCode.S3PutObjectError, (error as Error).message)
    }
  }

  // 生成预签名 URL（可指定 Bucket）
  getFileUrl(key: string, bucketName?: string, expiresIn = 3600) {
    const command = new GetObjectCommand({
      Bucket: bucketName || this.config.bucketName,
      Key: key,
    })
    return getSignedUrl(this.client, command, { expiresIn })
  }

  /**
   * 开始分片上传
   * @param {string} key - 文件键
   * @returns {Promise<string>} - 返回上传ID
   * @param {string} bucketName - 存储桶名称
   */
  async initiateMultipartUpload(
    key: string,
    bucketName?: string,
  ): Promise<string> {
    bucketName = bucketName || this.config.bucketName

    const command = new CreateMultipartUploadCommand({
      Bucket: bucketName,
      Key: key,
    })

    const response = await this.client.send(command)
    return response.UploadId || ''
  }

  /**
   * 上传单个分片
   * @param {string} key - 文件键
   * @param {string} uploadId - 上传ID
   * @param {number} partNumber - 分片编号
   * @param {Buffer} partData - 分片数据
   * @param {string} bucketName - 存储桶名称
   * @returns {Promise<string>} - 返回ETag
   */
  async uploadPart(
    key: string,
    uploadId: string,
    partNumber: number,
    partData: Buffer,
    bucketName?: string,
  ): Promise<UploadPartCommandOutput> {
    bucketName = bucketName || this.config.bucketName
    const command = new UploadPartCommand({
      Bucket: bucketName,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: partData,
    })

    const response = await this.client.send(command)
    return response
  }

  /**
   * 完成分片上传
   * @param {string} key - 文件键
   * @param {string} uploadId - 上传ID
   * @param {Array<{ PartNumber: number; ETag: string }>} parts - 分片列表
   * @param {string} bucketName - 存储桶名称
   */
  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: { PartNumber: number, ETag: string }[],
    bucketName?: string,
  ): Promise<void> {
    bucketName = bucketName || this.config.bucketName

    const command = new CompleteMultipartUploadCommand({
      Bucket: bucketName,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    })

    await this.client.send(command)
  }
}
