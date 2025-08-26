import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
  UploadPartCommandOutput,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Injectable, Logger } from '@nestjs/common'
import { AppException } from '@/common/exceptions'
import { ErrHttpBack } from '@/common/filters/httpException.code'

@Injectable()
export class S3Service {
  private readonly clients: Map<string, S3Client> = new Map()
  private defaultBucket: string

  // 注册 S3 客户端实例
  registerClient(name: string, client: S3Client, isDefault = false) {
    this.clients.set(name, client)
    if (isDefault)
      this.defaultBucket = name
  }

  // 获取客户端实例
  private getClient(bucketName?: string): S3Client {
    const targetBucket = bucketName || this.defaultBucket
    const client = this.clients.get(targetBucket)
    if (!client)
      throw new Error(`S3 client for bucket ${targetBucket} not found`)
    return client
  }

  // 上传文件（可指定 Bucket）
  async uploadFile(
    key: string,
    file: Buffer,
    contentType = 'application/octet-stream',
    bucketName?: string,
  ) {
    const client = this.getClient(bucketName)

    const command = new PutObjectCommand({
      Bucket: bucketName || this.defaultBucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    })
    try {
      await client.send(command)
      return { key }
    }
    catch (error) {
      Logger.debug(error)
      throw new AppException(ErrHttpBack.fail)
    }
  }

  // 生成预签名 URL（可指定 Bucket）
  getFileUrl(key: string, bucketName?: string, expiresIn = 3600) {
    const client = this.getClient(bucketName)
    const command = new GetObjectCommand({
      Bucket: bucketName || this.defaultBucket,
      Key: key,
    })
    return getSignedUrl(client, command, { expiresIn })
  }

  /**
   * 获取文件上传 URL
   * @param key
   * @param contentType
   * @param bucketName
   * @param expiresIn
   * @returns
   */
  async getUploadUrl(
    key: string,
    option: {
      bucket?: string
      contentType?: string
      expiresIn?: number
    } = {
      contentType: 'application/octet-stream',
      expiresIn: 3600,
    },
  ): Promise<string> {
    const { contentType, expiresIn } = option
    const bucket = option.bucket || this.defaultBucket
    const client = this.getClient(bucket)
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    })

    try {
      return await getSignedUrl(client, command, { expiresIn })
    }
    catch (error) {
      Logger.debug(error)
      throw new AppException(ErrHttpBack.fail)
    }
  }

  /**
   * 开始分片上传
   * @param {string} bucketName - 存储桶名称
   * @param {string} key - 文件键
   * @returns {Promise<string>} - 返回上传ID
   */
  async initiateMultipartUpload(
    key: string,
    bucketName?: string,
  ): Promise<string> {
    bucketName = bucketName || this.defaultBucket
    const client = this.getClient(bucketName)

    const command = new CreateMultipartUploadCommand({
      Bucket: bucketName,
      Key: key,
    })

    const response = await client.send(command)
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
    bucketName = bucketName || this.defaultBucket
    const client = this.getClient(bucketName)
    const command = new UploadPartCommand({
      Bucket: bucketName,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: partData,
    })

    const response = await client.send(command)
    return response
  }

  /**
   * 生成分片上传URL
   * @param key 文件键
   * @param uploadId 上传ID
   * @param partNumber 分片编号
   * @param bucketName 存储桶名称
   * @param expiresIn 过期时间
   * @returns 签名URL
   */
  async getUploadPartUrl(
    key: string,
    uploadId: string,
    partNumber: number,
    option: {
      bucketName?: string
      expiresIn?: number
    } = {
      expiresIn: 3600,
    },
  ): Promise<string> {
    let { bucketName, expiresIn } = option
    bucketName = bucketName || this.defaultBucket
    const client = this.getClient(bucketName)
    const command = new UploadPartCommand({
      Bucket: bucketName,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    })

    return await getSignedUrl(client, command, { expiresIn })
  }

  /**
   * 完成分片上传
   * @param {string} bucketName - 存储桶名称
   * @param {string} key - 文件键
   * @param {string} uploadId - 上传ID
   * @param {Array<{ PartNumber: number; ETag: string }>} parts - 分片列表
   */
  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: { PartNumber: number, ETag: string }[],
    bucketName?: string,
  ): Promise<void> {
    bucketName = bucketName || this.defaultBucket
    const client = this.getClient(bucketName)

    const command = new CompleteMultipartUploadCommand({
      Bucket: bucketName,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    })

    await client.send(command)
  }

  /**
   * 获取某个目录的总空间大小
   * @param prefix
   * @param bucketName
   * @returns
   */
  async getDirectorySize(
    prefix: string,
    bucketName?: string,
  ): Promise<number> {
    bucketName = bucketName || this.defaultBucket
    const client = this.getClient(bucketName)
    let totalSize = 0

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: prefix,
    })
    try {
      const response = await client.send(command)
      totalSize += response.ContentLength || 0
    }
    catch (error) {
      Logger.debug(error)
    }
    return totalSize
  }
}
