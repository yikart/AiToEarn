import { S3Client } from '@aws-sdk/client-s3'
import { S3ModuleOptions } from './common'

export class S3Factory {
  static createS3Client(options: S3ModuleOptions): S3Client {
    return new S3Client({
      region: options.region,
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
    })
  }
}
