import { Injectable } from '@nestjs/common'
import { AiService } from './clients/ai.service'

@Injectable()
export class AitoearnAiClientService {
  constructor(
    public readonly ai: AiService,
  ) {}
}
