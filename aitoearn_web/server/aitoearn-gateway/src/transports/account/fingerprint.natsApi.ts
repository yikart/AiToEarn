import { GenerateFingerprintDto } from '@core/other/dto/fingerprint.dto'
import { Injectable } from '@nestjs/common'
import { NatsApi } from '../api'
import { BaseNatsApi } from '../base.natsApi'

@Injectable()
export class FingerprintNatsApi extends BaseNatsApi {
  async generateFingerprint(data: GenerateFingerprintDto) {
    return await this.sendMessage<any>(
      NatsApi.account.fingerprint.generateFingerprint,
      data,
    )
  }
}
