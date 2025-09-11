import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
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

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name)
  constructor(
    private readonly config: S3Config,
    private readonly client: S3Client,
  ) {
  }

  async putObject(
    objectPath: string,
    file: PutObjectCommandInput['Body'],
  ) {
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.config.bucketName,
        Key: objectPath,
        Body: file,
      },
    })
    await upload.done()
    return { path: objectPath }
  }

  async putObjectFromUrl(
    url: string,
    objectPath: string,
  ) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.bucketName,
        Key: objectPath,
      })
      await this.client.send(command)
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
  getUploadSign(objectPath: string) {
    return createPresignedPost(this.client, {
      Bucket: this.config.bucketName,
      Key: objectPath,
      Expires: this.config.signExpires,
    })
  }

  /**
   * 开始分片上传
   * @param {string} objectPath - 文件键
   * @returns {Promise<string>} - 返回上传ID
   */
  async initiateMultipartUpload(
    objectPath: string,
  ): Promise<string> {
    const command = new CreateMultipartUploadCommand({
      Bucket: this.config.bucketName,
      Key: objectPath,
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
}
