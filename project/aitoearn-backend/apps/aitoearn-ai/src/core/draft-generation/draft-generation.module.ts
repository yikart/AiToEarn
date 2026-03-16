import { Module } from '@nestjs/common'
import { HelpersModule } from '@yikart/helpers'
import { AgentModule } from '../agent/agent.module'
import { MediaMcp } from '../agent/mcp/media.mcp'
import { UtilMcp } from '../agent/mcp/util.mcp'
import { VideoUtilsMcp } from '../agent/mcp/video-utils.mcp'
import { ChatModule } from '../ai/chat'
import { ImageModule } from '../ai/image'
import { VideoModule } from '../ai/video'
import { DraftGenerationConsumer } from './draft-generation.consumer'
import { DraftGenerationController } from './draft-generation.controller'
import { DraftGenerationService } from './draft-generation.service'

@Module({
  imports: [
    HelpersModule,
    AgentModule,
    ChatModule,
    ImageModule,
    VideoModule,
  ],
  controllers: [DraftGenerationController],
  providers: [
    DraftGenerationService,
    DraftGenerationConsumer,
    MediaMcp,
    UtilMcp,
    VideoUtilsMcp,
  ],
  exports: [DraftGenerationService],
})
export class DraftGenerationModule {}
