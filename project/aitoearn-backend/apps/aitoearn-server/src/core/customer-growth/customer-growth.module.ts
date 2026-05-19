import { Module } from '@nestjs/common'
import {
  CustomerRadarController,
  GlobalKnowledgeController,
  SystemSettingsController,
} from './customer-growth.controller'
import { CustomerGrowthService } from './customer-growth.service'

@Module({
  controllers: [GlobalKnowledgeController, CustomerRadarController, SystemSettingsController],
  providers: [CustomerGrowthService],
  exports: [CustomerGrowthService],
})
export class CustomerGrowthModule { }
