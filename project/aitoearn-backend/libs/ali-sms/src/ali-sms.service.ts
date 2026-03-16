import Dysmsapi20170525, * as $Dysmsapi20170525 from '@alicloud/dysmsapi20170525'
import * as $OpenApi from '@alicloud/openapi-client'
import { Injectable, Logger } from '@nestjs/common'
import { AliSmsConfig } from './ali-sms.config'

@Injectable()
export class AliSmsService {
  private readonly logger = new Logger(AliSmsService.name)
  private readonly client: Dysmsapi20170525

  constructor(private readonly config: AliSmsConfig) {
    const openApiConfig = new $OpenApi.Config({
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      endpoint: 'dysmsapi.aliyuncs.com',
    })
    this.client = new Dysmsapi20170525(openApiConfig)
  }

  async sendSms(phone: string, templateParam: Record<string, string>): Promise<boolean> {
    const request = new $Dysmsapi20170525.SendSmsRequest({
      phoneNumbers: phone,
      signName: this.config.signName,
      templateCode: this.config.templateCode,
      templateParam: JSON.stringify(templateParam),
    })

    try {
      const response = await this.client.sendSms(request)
      if (response.body?.code !== 'OK') {
        this.logger.error(
          `SMS send failed: code=${response.body?.code}, message=${response.body?.message}, phone=${phone}`,
        )
        return false
      }
      return true
    }
    catch (error) {
      const errDetail = JSON.stringify(error, Object.getOwnPropertyNames(error as object), 2)
      this.logger.error(`SMS send error: phone=${phone}, detail=${errDetail}`)
      return false
    }
  }
}
