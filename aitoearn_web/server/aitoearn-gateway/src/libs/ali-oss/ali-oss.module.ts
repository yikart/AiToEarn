import { DynamicModule, Module } from '@nestjs/common'
import * as OSS from 'ali-oss'
import { AliOssConfig } from './ali-oss.config'
import { ALI_OSS_CLIENT } from './ali-oss.constants'

import { AliOSSService } from './ali-oss.service'

@Module({})
export class AliOSSModule {
  static forRoot(config: AliOssConfig): DynamicModule {
    return {
      module: AliOSSModule,
      providers: [
        { provide: AliOssConfig, useValue: config },
        {
          provide: ALI_OSS_CLIENT,
          useFactory: (aliConfig: AliOssConfig): OSS => {
            return new OSS(aliConfig)
          },
          inject: [AliOssConfig],
        },
        AliOSSService,
      ],
      exports: [AliOSSService],
    }
  }
}
