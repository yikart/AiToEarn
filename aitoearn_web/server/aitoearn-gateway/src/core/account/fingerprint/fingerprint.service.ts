import { GenerateFingerprintDto } from '@core/other/dto/fingerprint.dto'
import { Injectable } from '@nestjs/common'
import { FingerprintNatsApi } from '@transports/account/fingerprint.natsApi'

@Injectable()
export class FingerprintService {
  constructor(private readonly fingerprintNatsApi: FingerprintNatsApi) {}

  generateFingerprint(data: GenerateFingerprintDto) {
    return this.fingerprintNatsApi.generateFingerprint(data)
  }
}
