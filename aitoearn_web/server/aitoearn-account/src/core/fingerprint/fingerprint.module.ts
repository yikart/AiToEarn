import { Global, Module } from '@nestjs/common'
import { FingerprintController } from './fingerprint.controller'
import { FingerprintService } from './fingerprint.service'

@Global()
@Module({
  providers: [FingerprintService],
  controllers: [FingerprintController],
})
export class FingerprintModule {}
