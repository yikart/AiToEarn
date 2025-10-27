import { Injectable } from '@nestjs/common';
import Dysmsapi20170525, * as $Dysmsapi20170525 from '@alicloud/dysmsapi20170525';
import * as $OpenApi from '@alicloud/openapi-client';
import * as $Util from '@alicloud/tea-util';
import { AlicloudSmsOptions } from './interfaces/alicloud-sms-options.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AlicloudSmsService {
  private client: Dysmsapi20170525;
  private options: AlicloudSmsOptions;
  constructor(private configService: ConfigService) {
    const options: AlicloudSmsOptions = this.configService.get('SMS_CONFIG');
    this.options = options;
    const config = new $OpenApi.Config({
      ...options.config,
    });

    this.client = new Dysmsapi20170525(config);
  }

  /**
   * Send message.
   * @param phone 手机号
   * @param code 验证码
   */
  public async sendLoginSms(phone: string, code: string): Promise<boolean> {
    const sendSmsRequest = new $Dysmsapi20170525.SendSmsRequest({
      phoneNumbers: phone,
      signName: this.options.defaults.signName,
      templateCode: this.options.defaults.templateCode,
      templateParam: JSON.stringify({ code }),
    });

    const runtime = new $Util.RuntimeOptions({});

    try {
      const result = await this.client.sendSmsWithOptions(
        sendSmsRequest,
        runtime,
      );

      if (result.body.code === 'isv.BUSINESS_LIMIT_CONTROL') {
        console.log('发送短信失败，请稍后再试');
        return false;
      }

      return true;
    } catch (error: any) {
      console.log('==== sendLoginSms ====', error);
      return false;
    }
  }
}
