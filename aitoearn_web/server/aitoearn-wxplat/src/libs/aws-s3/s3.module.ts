import { DynamicModule, Module, Provider } from '@nestjs/common'
import { S3ModuleAsyncOptions, S3ModuleOptions } from './common'
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
        provide: 'S3_CONFIG',
        useValue: config,
      },
      {
        provide: S3Service,
        useFactory: (s3Config: S3Config) => {
          const service = new S3Service()
          const client = S3Factory.createS3Client(s3Config)
          service.registerClient(s3Config.bucketName, client, true)
          return service
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

  // 异步配置（如从 ConfigService 读取）
  static forRootAsync(options: S3ModuleAsyncOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'S3_CONFIG',
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
      {
        provide: S3Service,
        useFactory: (config: S3ModuleOptions) => {
          const service = new S3Service()
          const client = S3Factory.createS3Client(config)
          service.registerClient(config.bucketName, client, true)
          return service
        },
        inject: ['S3_CONFIG'],
      },
    ]

    return {
      module: S3Module,
      imports: options.imports || [],
      providers,
      exports: [S3Service],
    }
  }
}
