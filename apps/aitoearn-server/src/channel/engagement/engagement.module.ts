import { Module } from '@nestjs/common'
import { EngagementNatsApi } from '../api/engagement/engagement.natsApi'
import { EngagementController } from './engagement.controller'
import { EngagementService } from './engagement.service'

@Module({
  controllers: [EngagementController],
  providers: [EngagementService, EngagementNatsApi],
  exports: [EngagementService],
})

export class EngagementModule { }
