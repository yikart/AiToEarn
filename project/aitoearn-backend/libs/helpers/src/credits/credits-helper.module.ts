import { Module } from '@nestjs/common'
import { CreditsHelperService } from './credits-helper.service'

@Module({
  imports: [],
  providers: [CreditsHelperService],
  exports: [CreditsHelperService],
})
export class CreditsHelperModule {}
