import { DynamicModule, Module } from '@nestjs/common'
import { AitoearnAiClientConfig } from './aitoearn-ai-client.config'
import { AitoearnAiClientService } from './aitoearn-ai-client.service'
import { AgentService } from './clients/agent.service'
import { AiService } from './clients/ai.service'

@Module({})
export class AitoearnAiClientModule {
  static forRoot(options: AitoearnAiClientConfig): DynamicModule {
    return {
      global: true,
      module: AitoearnAiClientModule,
      providers: [
        {
          provide: AitoearnAiClientConfig,
          useValue: options,
        },
        AiService,
        AgentService,
        AitoearnAiClientService,
      ],
      exports: [AitoearnAiClientService, AiService, AgentService],
    }
  }
}
