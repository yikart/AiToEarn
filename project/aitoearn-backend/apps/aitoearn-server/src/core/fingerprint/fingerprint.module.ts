import { Global, Module } from '@nestjs/common'
import { FingerprintService } from './fingerprint.service'

@Global()
@Module({
  providers: [FingerprintService],
  controllers: [],
})
export class FingerprintModule { }
