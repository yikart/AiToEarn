import { Global, Module } from '@nestjs/common'
import { UserPortraitController } from './user-portrait.controller'
import { UserPortraitService } from './user-portrait.service'

@Global()
@Module({
  imports: [],
  controllers: [UserPortraitController],
  providers: [UserPortraitService],
  exports: [UserPortraitService],
})
export class UserPortraitModule {}
