import { DynamicModule, Module } from '@nestjs/common'
import { AitoearnServerClientConfig } from './aitoearn-server-client.config'
import { AitoearnServerClientService } from './aitoearn-server-client.service'
import { AccountService, BrandLibService, ContentService, NotificationService, PlatformService, PublishingService, PublishRecordService, ShortLinkService, TaskService, UserService } from './clients'

@Module({})
export class AitoearnServerClientModule {
  static forRoot(options: AitoearnServerClientConfig): DynamicModule {
    return {
      global: true,
      module: AitoearnServerClientModule,
      imports: [
      ],
      providers: [
        {
          provide: AitoearnServerClientConfig,
          useValue: options,
        },
        AccountService,
        BrandLibService,
        ContentService,
        NotificationService,
        PlatformService,
        PublishingService,
        TaskService,
        UserService,
        PublishRecordService,
        ShortLinkService,
        AitoearnServerClientService,
      ],
      exports: [AitoearnServerClientService],
    }
  }
}
