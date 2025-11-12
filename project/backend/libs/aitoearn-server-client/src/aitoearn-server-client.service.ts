import { Injectable } from '@nestjs/common'
import { AccountService, AiService, ContentService, NotificationService, PublishingService, PublishRecordService, UserService } from './clients'

@Injectable()
export class AitoearnServerClientService {
  constructor(
    private readonly aiService: AiService,
    private readonly accountService: AccountService,
    private readonly contentService: ContentService,
    private readonly notificationService: NotificationService,
    private readonly publishingService: PublishingService,
    private readonly userService: UserService,
    private readonly publishRecordService: PublishRecordService,
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

  get publishRecord() {
    return this.publishRecordService
  }

  get notification() {
    return this.notificationService
  }

  get user() {
    return this.userService
  }
}
