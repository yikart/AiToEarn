import { S3Client } from '@aws-sdk/client-s3'
import { S3Config } from './s3.config'

export class S3Factory {
  static createS3Client(options: S3Config): S3Client {
    return new S3Client({
      region: options.region,
      credentials: options.accessKeyId && options.secretAccessKey
        ? {
            accessKeyId: options.accessKeyId,
            secretAccessKey: options.secretAccessKey,
          }
        : undefined,
    })
  }
}
