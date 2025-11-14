import { Body, Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ApiDoc } from '@yikart/common'
import { GenerateFingerprintDto } from './dto/fingerprint.dto'
import { FingerprintService } from './fingerprint.service'

@ApiTags('OpenSource/Fingerprint/Fingerprint')
@Controller('fingerprint')
export class FingerprintController {
  constructor(private readonly fingerprintService: FingerprintService) { }

  @ApiDoc({
    summary: 'Generate Random Browser Fingerprint',
  })
  // @NatsMessagePattern('account.fingerprint.generateFingerprint')

  async generateFingerprint(@Body() _data: GenerateFingerprintDto) {
    return null
  }
}
