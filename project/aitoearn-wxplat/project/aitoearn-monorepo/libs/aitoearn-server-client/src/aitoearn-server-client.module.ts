import { DynamicModule, Module } from '@nestjs/common'
import { AitoearnServerClientConfig } from './aitoearn-server-client.config'
import { AitoearnServerClientService } from './aitoearn-server-client.service'
import { AccountService, AiService, ContentService, PublishingService, TaskService } from './clients'

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
        AiService,
        ContentService,
        PublishingService,
        TaskService,
        AitoearnServerClientService,
      ],
      exports: [AitoearnServerClientService],
    }
  }
}
