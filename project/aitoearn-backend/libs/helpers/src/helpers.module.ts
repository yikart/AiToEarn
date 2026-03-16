import { Global, Module } from '@nestjs/common'
import { CreditsHelperModule } from './credits/credits-helper.module'

@Global()
@Module({
  imports: [CreditsHelperModule],
  exports: [CreditsHelperModule],
})
export class HelpersModule {}
