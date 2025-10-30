import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as tencentcloud from 'tencentcloud-sdk-nodejs-tms';
import { Client } from 'tencentcloud-sdk-nodejs-tms/tencentcloud/services/tms/v20201229/tms_client';
const TmsClient = tencentcloud.tms.v20201229.Client;

export enum TmsLabels {
  Normal = 'Normal',
  Porn = 'Porn',
  Abuse = 'Abuse',
  Ad = 'Ad',
  Error = 'Error',
}

@Injectable()
export class TmsService {
  private client: Client;
  constructor(private configService: ConfigService) {
    const options: { secretId: string; secretKey: string } =
      this.configService.get('TMS_CONFIG');

    const clientConfig = {
      credential: options,

      region: 'ap-beijing',
      profile: {
        httpProfile: {
          endpoint: 'tms.tencentcloudapi.com',
        },
      },
    };

    this.client = new TmsClient(clientConfig);
  }

  /**
   * 内容安全验证
   * @param content 文本内容
   * **Normal**：正常，**Porn**：色情，**Abuse**：谩骂，**Ad**：广告；以及其他令人反感、不安全或不适宜的内容类型 **Error**
   */
  public async textModeration(content: string): Promise<TmsLabels> {
    try {
      const base64 = Buffer.from(content).toString('base64');
      const result = await this.client.TextModeration({
        Content: base64,
      });

      return result.Label as TmsLabels;
    } catch (error: any) {
      console.log('==== textModeration ====', error);
      return TmsLabels.Error;
    }
  }
}
