/*
 * @Author: nevin
 * @Date: 2025-04-27 06:41:31
 * @LastEditTime: 2025-04-27 14:03:43
 * @LastEditors: nevin
 * @Description:
 */
import Cloudauth20190307, * as $Cloudauth20190307 from '@alicloud/cloudauth20190307';
import * as $OpenApi from '@alicloud/openapi-client';
import * as $Util from '@alicloud/tea-util';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AlicloudRealAuthService {
  private client: any;
  constructor(private configService: ConfigService) {
    const options: {
      accessKeyId: string;
      accessKeySecret: string;
    } = this.configService.get('REAL_NAME_CONFIG');

    const config = new $OpenApi.Config({
      ...options,
    });

    config.endpoint = `cloudauth.cn-beijing.aliyuncs.com`;
    this.client = new Cloudauth20190307(config);
  }

  /**
   * 身份号认证
   * @param identifyNum
   * @param userName
   */
  public async realNameAuth(
    identifyNum: string,
    userName: string,
  ): Promise<boolean> {
    const id2MetaVerifyRequest = new $Cloudauth20190307.Id2MetaVerifyRequest({
      paramType: 'normal',
      identifyNum,
      userName,
    });
    const runtime = new $Util.RuntimeOptions({});
    try {
      const res: {
        body: {
          code: string;
          message: string;
          requestId: string;
          resultObject: {
            bizCode: '1' | '2' | '3';
          };
        };
      } = await this.client.id2MetaVerifyWithOptions(
        id2MetaVerifyRequest,
        runtime,
      );

      return res.body.resultObject.bizCode === '1';
    } catch (error) {
      console.log('----- realNameAuth error ------', error.message);

      return false;
    }
  }
}
