import Credential, { Config } from '@alicloud/credentials'
import Green20220302 from '@alicloud/green20220302'
import * as $OpenApi from '@alicloud/openapi-client'
import { DynamicModule, Module } from '@nestjs/common'
import { ALI_GREEN_CLIENT } from './ali-green-api.constants'
import { AliGreenApiService } from './ali-green-api.service'

@Module({})
export class AliGreenApiModule {
  static forRoot(config: {
    accessKeyId: string
    accessKeySecret: string
    endpoint: string
  }): DynamicModule {
    return {
      module: AliGreenApiModule,
      providers: [
        {
          provide: ALI_GREEN_CLIENT,
          useFactory: () => {
            const { accessKeyId, accessKeySecret, endpoint } = config
            const credentialsConfig = new Config({
              type: 'access_key', // 凭证类型。
              accessKeyId,
              accessKeySecret,
            })
            const credential = new Credential(credentialsConfig)
            const ali_config = new $OpenApi.Config({
              credential,
            })
            ali_config.endpoint = endpoint
            return new Green20220302(ali_config)
          },
        },
      ],
      exports: [ALI_GREEN_CLIENT, AliGreenApiService],
    }
  }
}
