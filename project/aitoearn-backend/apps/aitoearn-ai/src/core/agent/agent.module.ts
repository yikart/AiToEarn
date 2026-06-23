import { Module } from '@nestjs/common'
import { config } from '../../config'
import { AideoModule } from '../ai/aideo'
import { ChatModule } from '../ai/chat'
import { ImageModule } from '../ai/image'
import { RelayMediaModule } from '../ai/relay-media'
import { VideoModule } from '../ai/video'
import { AgentTaskTimeoutScheduler } from './agent-task-timeout.scheduler'
import { AgentController } from './agent.controller'
import { AgentService } from './agent.service'
import { ClaudeCodeRouterModule } from './claude-code-router/claude-code-router.module'
import { ImageEditMcp } from './mcp/image-edit.mcp'
import { MediaMcp } from './mcp/media.mcp'
import { SubtitleMcp } from './mcp/subtitle.mcp'
import { UtilMcp } from './mcp/util.mcp'
import { VideoUtilsMcp } from './mcp/video-utils.mcp'
import { AideoMcp } from './mcp/volcengine/aideo.mcp'
import { DramaRecapMcp } from './mcp/volcengine/drama-recap.mcp'
import { StyleTransferMcp } from './mcp/volcengine/style-transfer.mcp'
import { VideoEditMcp } from './mcp/volcengine/video-edit.mcp'
import { AgentRuntimeService } from './services/agent-runtime.service'
import { SkillInitService } from './skill-init.service'

@Module({
  imports: [
    ChatModule,
    ImageModule,
    VideoModule,
    AideoModule,
    RelayMediaModule.forRoot(config.ai.relay),
    ClaudeCodeRouterModule,
  ],
  controllers: [AgentController],
  providers: [
    AgentService,
    MediaMcp,
    AideoMcp,
    UtilMcp,
    VideoEditMcp,
    AgentTaskTimeoutScheduler,
    DramaRecapMcp,
    StyleTransferMcp,
    VideoUtilsMcp,
    ImageEditMcp,
    SubtitleMcp,
    SkillInitService,
    AgentRuntimeService,
  ],
  exports: [AgentService],
})
export class AgentModule {}
