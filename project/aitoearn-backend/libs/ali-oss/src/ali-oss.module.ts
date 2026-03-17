import type { DynamicModule, Provider } from '@nestjs/common'
import { Global, Module } from '@nestjs/common'
import OSS from 'ali-oss'
import { AliOssConfig } from './ali-oss.config'
import { AliOssService } from './ali-oss.service'

@Global()
@Module({})
export class AliOssModule {
  static forRoot(config: AliOssConfig): DynamicModule {
    const providers: Provider[] = [
      {
        provide: AliOssConfig,
        useValue: config,
      },
      {
        provide: OSS,
        useFactory: (ossConfig: AliOssConfig) => new OSS(ossConfig),
        inject: [AliOssConfig],
      },
      AliOssService,
    ]

    return {
      global: true,
      module: AliOssModule,
      providers,
      exports: [AliOssService],
    }
  }
}
