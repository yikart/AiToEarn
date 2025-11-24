import { Module } from '@nestjs/common'
import { AccountModule } from '../account/account.module'
import { PublishingController } from './publishing.controller'
import { PublishingService } from './publishing.service'

@Module({
  imports: [
    AccountModule,
  ],
  providers: [PublishingService],
  exports: [PublishingService],
  controllers: [PublishingController],
})
export class PublishingModule { }
