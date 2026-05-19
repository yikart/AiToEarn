import { Module } from '@nestjs/common'
import { HelpersModule } from '@yikart/helpers'
import { ImageModule } from '../ai/image'
import { VideoModule } from '../ai/video'
import { DraftGenerationMemoryScheduler } from './draft-generation-memory.scheduler'
import { DraftGenerationMemoryService } from './draft-generation-memory.service'
import { DraftGenerationPlannerService } from './draft-generation-planner.service'
import { DraftGenerationConsumer, DraftGenerationLowPriorityConsumer } from './draft-generation.consumer'
import { DraftGenerationController } from './draft-generation.controller'
import { DraftGenerationService } from './draft-generation.service'

@Module({
  imports: [
    HelpersModule,
    ImageModule,
    VideoModule,
  ],
  controllers: [DraftGenerationController],
  providers: [
    DraftGenerationService,
    DraftGenerationMemoryService,
    DraftGenerationPlannerService,
    DraftGenerationMemoryScheduler,
    DraftGenerationConsumer,
    DraftGenerationLowPriorityConsumer,
  ],
  exports: [DraftGenerationService, DraftGenerationMemoryService],
})
export class DraftGenerationModule {}
