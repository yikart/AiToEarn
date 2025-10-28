import { Injectable } from '@nestjs/common'
import { AccountService, AiService, ContentService, PublishingService, TaskService } from './clients'

@Injectable()
export class AitoearnServerClientService {
  constructor(
    private readonly aiService: AiService,
    private readonly accountService: AccountService,
    private readonly contentService: ContentService,
    private readonly publishingService: PublishingService,
    private readonly taskService: TaskService,
  ) {}

  get ai() {
    return this.aiService
  }

  get account() {
    return this.accountService
  }

  get content() {
    return this.contentService
  }

  get publishing() {
    return this.publishingService
  }

  get task() {
    return this.taskService
  }
}
