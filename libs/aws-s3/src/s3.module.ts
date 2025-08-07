import type { DynamicModule, Provider } from '@nestjs/common'
import { S3Client } from '@aws-sdk/client-s3'
import { Module } from '@nestjs/common'
import { S3Config } from './s3.config'
import { S3Factory } from './s3.factory'
import { S3Service } from './s3.service'

@Module({})
export class S3Module {
  // 同步配置
  static forRoot(config: S3Config): DynamicModule {
    const providers: Provider[] = [
      { provide: S3Config, useValue: config },
      {
        provide: S3Config,
        useValue: config,
      },
      {
        provide: S3Client,
        useFactory: (s3Config: S3Config) => {
          return S3Factory.createS3Client(s3Config)
        },
        inject: [S3Config],
      },
    ]

    return {
      module: S3Module,
      providers,
      exports: [S3Service],
    }
  }
}
