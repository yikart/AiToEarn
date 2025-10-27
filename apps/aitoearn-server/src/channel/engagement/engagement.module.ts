import { Module } from '@nestjs/common'
import { EngagementController } from './engagement.controller'
import { EngagementService } from './engagement.service'

@Module({
  controllers: [EngagementController],
  providers: [EngagementService],
  exports: [EngagementService],
})

export class EngagementModule { }
