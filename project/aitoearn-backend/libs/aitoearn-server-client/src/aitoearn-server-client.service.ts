import { Injectable } from '@nestjs/common'
import { AccountService, BrandLibService, ContentService, NotificationService, PlatformService, PublishingService, PublishRecordService, ShortLinkService, TaskService, UserService } from './clients'

@Injectable()
export class AitoearnServerClientService {
  constructor(
    private readonly accountService: AccountService,
    private readonly brandLibService: BrandLibService,
    private readonly contentService: ContentService,
    private readonly notificationService: NotificationService,
    private readonly platformService: PlatformService,
    private readonly publishingService: PublishingService,
    private readonly taskService: TaskService,
    private readonly userService: UserService,
    private readonly publishRecordService: PublishRecordService,
    private readonly shortLinkService: ShortLinkService,
  ) {}

  get account() {
    return this.accountService
  }

  get brandLib() {
    return this.brandLibService
  }

  get content() {
    return this.contentService
  }

  get platform() {
    return this.platformService
  }

  get publishing() {
    return this.publishingService
  }

  get publishRecord() {
    return this.publishRecordService
  }

  get task() {
    return this.taskService
  }

  get notification() {
    return this.notificationService
  }

  get user() {
    return this.userService
  }

  get shortLink() {
    return this.shortLinkService
  }
}
