import { Injectable } from '@nestjs/common';
import * as $OpenApi from '@alicloud/openapi-client';
import * as $Util from '@alicloud/tea-util';
import { AlicloudSmsOptions } from './interfaces/alicloud-sms-options.interface';
import { ConfigService } from '@nestjs/config';
import Dypnsapi20170525, * as $Dypnsapi20170525 from '@alicloud/dypnsapi20170525';

@Injectable()
export class AlicloudPnsService {
  private client: Dypnsapi20170525;
  constructor(private configService: ConfigService) {
    const options: AlicloudSmsOptions = this.configService.get('SMS_CONFIG');
    const config = new $OpenApi.Config({
      accessKeyId: options.config.accessKeyId,
      accessKeySecret: options.config.accessKeySecret,
    });

    config.endpoint = `dypnsapi.aliyuncs.com`;
    this.client = new Dypnsapi20170525(config);
  }

  /**
   * 获取一键登录的手机号
   * @param accessToken
   * @param outId
   * @returns
   */
  async getOneKeyLoginPhone(
    accessToken: string,
    outId?: string,
  ): Promise<string> {
    const runtime = new $Util.RuntimeOptions({});
    const getMobileRequest = new $Dypnsapi20170525.GetMobileRequest({
      accessToken,
      outId,
    });
    try {
      const res = await this.client.getMobileWithOptions(
        getMobileRequest,
        runtime,
      );

      if (res.statusCode !== 200) throw new Error('not 200' + res.statusCode);
      if (res.body.code !== 'OK') throw new Error(res.body.message);

      return res.body.getMobileResultDTO.mobile;
    } catch (error) {
      console.log('------ getOneKeyLoginPhone ---- error', error);
      return '';
    }
  }
}
