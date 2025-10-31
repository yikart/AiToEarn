import { Injectable } from '@nestjs/common'
import { AccountService, AiService, CloudSpaceService, ContentService, IncomeService, NotificationService, PublishingService, TaskService, UserService } from './clients'

@Injectable()
export class AitoearnServerClientService {
  constructor(
    private readonly aiService: AiService,
    private readonly accountService: AccountService,
    private readonly cloudSpaceService: CloudSpaceService,
    private readonly contentService: ContentService,
    private readonly incomeService: IncomeService,
    private readonly notificationService: NotificationService,
    private readonly publishingService: PublishingService,
    private readonly taskService: TaskService,
    private readonly userService: UserService,
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

  get cloudSpace() {
    return this.cloudSpaceService
  }

  get income() {
    return this.incomeService
  }

  get notification() {
    return this.notificationService
  }

  get user() {
    return this.userService
  }
}
