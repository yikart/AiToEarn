import type { DynamicModule, Provider } from '@nestjs/common'
import { S3Client } from '@aws-sdk/client-s3'
import { Global, Module } from '@nestjs/common'
import { S3Config } from './s3.config'
import { S3Service } from './s3.service'

@Global()
@Module({})
export class S3Module {
  static forRoot(config: S3Config): DynamicModule {
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
          credentials: s3Config.accessKeyId && s3Config.secretAccessKey
            ? {
                accessKeyId: s3Config.accessKeyId,
                secretAccessKey: s3Config.secretAccessKey,
              }
            : undefined,
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
