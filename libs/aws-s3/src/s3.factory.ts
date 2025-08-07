import type { S3ModuleOptions } from './s3.interface'
import { S3Client } from '@aws-sdk/client-s3'

export class S3Factory {
  static createS3Client(options: S3ModuleOptions): S3Client {
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
