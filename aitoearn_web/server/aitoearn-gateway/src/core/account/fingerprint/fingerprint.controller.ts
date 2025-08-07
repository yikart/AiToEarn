import { FingerprintService } from '@core/account/fingerprint/fingerprint.service'
import { GenerateFingerprintDto } from '@core/other/dto/fingerprint.dto'
import { Body, Controller, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken } from '@/auth/auth.guard'
import { TokenInfo } from '@/auth/interfaces/auth.interfaces'

@ApiTags('指纹生成')
@Controller('fingerprint')
export class FingerprintController {
  constructor(
    private readonly fingerprintService: FingerprintService,
  ) {}

  @ApiOperation({
    description: '生成指纹浏览器参数',
  })
  @Post('generateFingerprint')
  async cenerateFingerprin(
    @GetToken() token: TokenInfo,
    @Body() body: GenerateFingerprintDto,
  ) {
    return await this.fingerprintService.generateFingerprint(body)
  }
}
