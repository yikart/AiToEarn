import Credential, { Config } from '@alicloud/credentials'
/*
 * @Author: white
 * @Date: 2025-09-18 14:39:05
 * @LastEditTime: 2025-09-18 16:39:00
 * @LastEditors: white
 * @Description:
 */
import Green20220302 from '@alicloud/green20220302'
import * as $OpenApi from '@alicloud/openapi-client'
import { Global, Module } from '@nestjs/common'
import { config } from '../../config'
import { ALI_GREEN_CLIENT } from '../ali-green/ali-green-api.constants'
import { AliGreenApiService } from '../ali-green/ali-green-api.service'

@Global()
@Module({
  providers: [
    AliGreenApiService,
    {
      provide: ALI_GREEN_CLIENT,
      useFactory: () => {
        const { accessKeyId, accessKeySecret, endpoint } = config.aliGreen
        const credentialsConfig = new Config({
          // 凭证类型。
          type: 'access_key',
          // 设置accessKeyId值，此处已从环境变量中获取accessKeyId为例。
          accessKeyId,
          // 设置accessKeySecret值，此处已从环境变量中获取accessKeySecret为例。
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
})
export class AliGreenApiModule { }
