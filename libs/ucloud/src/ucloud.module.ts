import type { DynamicModule } from '@nestjs/common'
import { Module } from '@nestjs/common'
import { Client, Credential } from '@ucloud-sdks/ucloud-sdk-js'

import { UCloudConfig } from './ucloud.config'
import { UCloudService } from './ucloud.service'

@Module({})
export class UCloudModule {
  static forRoot(config: UCloudConfig): DynamicModule {
    return {
      module: UCloudModule,
      providers: [
        {
          provide: UCloudConfig,
          useValue: config,
        },
        {
          provide: Client,
          useFactory: (ucloudConfig: UCloudConfig) => {
            const credential = new Credential({
              publicKey: ucloudConfig.publicKey,
              privateKey: ucloudConfig.privateKey,
            })

            return new Client({
              credential,
              config: ucloudConfig,
            })
          },
          inject: [UCloudConfig],
        },
        UCloudService,
      ],
      exports: [UCloudService],
      global: true,
    }
  }
}
