import { Module } from '@nestjs/common'
import { DraftGenerationModule } from '../draft-generation/draft-generation.module'
import { DraftGenerationInternalController } from './draft-generation.controller'

@Module({
  imports: [
    DraftGenerationModule,
  ],
  providers: [],
  controllers: [
    DraftGenerationInternalController,
  ],
})
export class InternalModule {}
