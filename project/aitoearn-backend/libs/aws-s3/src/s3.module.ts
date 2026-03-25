import type { DynamicModule, Provider } from '@nestjs/common'
import { S3Client } from '@aws-sdk/client-s3'
import { Global, Module } from '@nestjs/common'
import { S3Config } from './s3.config'
import { S3_SIGNING_CLIENT } from './s3.constants'
import { S3Service } from './s3.service'

@Global()
@Module({})
export class S3Module {
  static forRoot(config: S3Config): DynamicModule {
    const buildCredentials = (s3Config: S3Config) =>
      s3Config.accessKeyId && s3Config.secretAccessKey
        ? { accessKeyId: s3Config.accessKeyId, secretAccessKey: s3Config.secretAccessKey }
        : undefined

    const providers: Provider[] = [
      {
        provide: S3Config,
        useValue: config,
      },
      {
        provide: S3Client,
        useFactory: (s3Config: S3Config) => new S3Client({
          region: s3Config.region,
          endpoint: s3Config.endpoint,
          forcePathStyle: s3Config.forcePathStyle,
          credentials: buildCredentials(s3Config),
        }),
        inject: [S3Config],
      },
      {
        provide: S3_SIGNING_CLIENT,
        useFactory: (s3Config: S3Config) => new S3Client({
          region: s3Config.region,
          endpoint: s3Config.publicEndpoint || s3Config.endpoint,
          forcePathStyle: s3Config.forcePathStyle,
          credentials: buildCredentials(s3Config),
        }),
        inject: [S3Config],
      },
      S3Service,
    ]

    return {
      global: true,
      module: S3Module,
      providers,
      exports: [S3Service],
    }
  }
}
