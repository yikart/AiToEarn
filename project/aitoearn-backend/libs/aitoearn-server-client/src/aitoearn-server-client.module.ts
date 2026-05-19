import { DynamicModule, Module } from '@nestjs/common'
import { AitoearnServerClientConfig } from './aitoearn-server-client.config'
import { AitoearnServerClientService } from './aitoearn-server-client.service'
import { AccountService, ContentService, NotificationService, PlatformService, PublishingService, PublishRecordService, ShortLinkService, UserService } from './clients'

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
        ContentService,
        NotificationService,
        PlatformService,
        PublishingService,
        UserService,
        PublishRecordService,
        ShortLinkService,
        AitoearnServerClientService,
      ],
      exports: [AitoearnServerClientService],
    }
  }
}
