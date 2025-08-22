import { Module } from '@nestjs/common'
import { AccountPortraitService } from './accountPortrait.service'
import { UserPortraitService } from './userPortrait.service'

@Module({
  imports: [],
  providers: [UserPortraitService, AccountPortraitService],
})
export class TaskModule {}
