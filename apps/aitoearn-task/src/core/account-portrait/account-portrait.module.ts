import { Global, Module } from '@nestjs/common'
import { UserPortraitModule } from '../user-portrait'
import { AccountPortraitController } from './account-portrait.controller'
import { AccountPortraitService } from './account-portrait.service'

@Global()
@Module({
  imports: [
    UserPortraitModule,
  ],
  controllers: [AccountPortraitController],
  providers: [AccountPortraitService],
  exports: [AccountPortraitService],
})
export class AccountPortraitModule {}
