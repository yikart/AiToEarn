import type { DynamicModule, Provider } from '@nestjs/common'
import type { AssetsConfig } from './assets.config'
import { Global, Module } from '@nestjs/common'
import { AliOssModule, AliOssService } from '@yikart/ali-oss'
import { S3Module, S3Service } from '@yikart/aws-s3'
import { FileUtil } from '@yikart/common'
import { AliOssAdapter } from './adapters/ali-oss.adapter'
import { S3Adapter } from './adapters/s3.adapter'
import { ASSETS_CONFIG } from './assets.config'
import { AssetsService } from './assets.service'
import { R2EventsService } from './r2-events.service'
import { StorageProvider } from './storage-provider'
import { VideoMetadataService } from './video-metadata.service'

@Global()
@Module({})
export class AssetsModule {
  static forRoot(config: AssetsConfig): DynamicModule {
    const endpoint = config.endpoint
      || (config.provider === 'ali-oss' ? `https://${config.bucket}.${config.region}.aliyuncs.com` : '')
    const cdnEndpoint = config.cdnEndpoint

    FileUtil.init({ endpoint, cdnEndpoint })

    const imports = config.provider === 'ali-oss'
      ? [AliOssModule.forRoot(config)]
      : [S3Module.forRoot(config)]

    const storageProviderFactory: Provider = config.provider === 'ali-oss'
      ? {
          provide: StorageProvider,
          useFactory: (aliOssService: AliOssService) =>
            new AliOssAdapter(aliOssService, endpoint, cdnEndpoint, config.callbackUrl),
          inject: [AliOssService],
        }
      : {
          provide: StorageProvider,
          useFactory: (s3Service: S3Service) =>
            new S3Adapter(s3Service, endpoint, cdnEndpoint),
          inject: [S3Service],
        }

    const providers: Provider[] = [
      {
        provide: ASSETS_CONFIG,
        useValue: config,
      },
      storageProviderFactory,
      AssetsService,
      R2EventsService,
      VideoMetadataService,
    ]

    return {
      global: true,
      module: AssetsModule,
      imports,
      providers,
      exports: [AssetsService, R2EventsService, VideoMetadataService, StorageProvider],
    }
  }
}
