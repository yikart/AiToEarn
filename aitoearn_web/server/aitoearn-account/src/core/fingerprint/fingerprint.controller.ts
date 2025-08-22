import { GenerateFingerprintDto } from '@core/fingerprint/dto/fingerprint.dto'
import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { NatsMessagePattern } from '@/common'
import { FingerprintService } from './fingerprint.service'

@ApiTags('浏览器指纹')
@Controller('fingerprint')
export class FingerprintController {
  constructor(private readonly fingerprintService: FingerprintService) {}

  @ApiOperation({
    description: '生成随机浏览器指纹',
  })
  @NatsMessagePattern('account.fingerprint.generateFingerprint')
  async generateFingerprint(@Payload() data: GenerateFingerprintDto) {
    return null
  }
}
