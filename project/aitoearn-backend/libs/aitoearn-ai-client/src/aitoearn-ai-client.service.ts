import { Injectable } from '@nestjs/common'
import { AgentService } from './clients/agent.service'
import { AiService } from './clients/ai.service'

@Injectable()
export class AitoearnAiClientService {
  constructor(
    public readonly ai: AiService,
    public readonly agent: AgentService,
  ) {}
}
