import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';

@Injectable()
export class S3Service {
  private readonly clients: Map<string, S3Client> = new Map();
  private defaultBucket: string;

  // 注册 S3 客户端实例
  registerClient(name: string, client: S3Client, isDefault = false) {
    this.clients.set(name, client);
    if (isDefault)
      this.defaultBucket = name;
  }

  // 获取客户端实例
  private getClient(bucketName?: string): S3Client {
    const targetBucket = bucketName || this.defaultBucket;
    const client = this.clients.get(targetBucket);
    if (!client)
      throw new Error(`S3 client for bucket ${targetBucket} not found`);
    return client;
  }

  // 上传文件（可指定 Bucket）
  async uploadFile(
    key: string,
    file: Buffer,
    contentType: string,
    bucketName?: string,
  ) {
    const client = this.getClient(bucketName);
    const command = new PutObjectCommand({
      Bucket: bucketName || this.defaultBucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    });
    await client.send(command);
    return { key };
  }

  // 生成预签名 URL（可指定 Bucket）
  async getFileUrl(key: string, bucketName?: string, expiresIn = 3600) {
    const client = this.getClient(bucketName);
    const command = new GetObjectCommand({
      Bucket: bucketName || this.defaultBucket,
      Key: key,
    });
    return getSignedUrl(client, command, { expiresIn });
  }
}
