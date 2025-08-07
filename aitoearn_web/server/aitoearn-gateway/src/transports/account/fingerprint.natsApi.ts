import { GenerateFingerprintDto } from '@core/other/dto/fingerprint.dto'
import { Injectable } from '@nestjs/common'
import { NatsService } from '@transports/nats.service'
import { NatsApi } from '../api'

@Injectable()
export class FingerprintNatsApi {
  constructor(private readonly natsService: NatsService) {}

  async generateFingerprint(data: GenerateFingerprintDto) {
    return await this.natsService.sendMessage<any>(
      NatsApi.account.fingerprint.generateFingerprint,
      data,
    )
  }
}
