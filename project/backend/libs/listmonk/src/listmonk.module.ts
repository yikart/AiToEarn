import { DynamicModule, Module } from '@nestjs/common'
import { SubscribersService } from './api/subscribers.service'
import { TemplatesService } from './api/templates.service'
import { TransactionalService } from './api/transactional.service'
import { ListmonkConfig } from './interfaces'

@Module({})
export class ListmonkModule {
  static forRoot(options: ListmonkConfig): DynamicModule {
    return {
      global: true,
      module: ListmonkModule,
      imports: [
      ],
      providers: [
        {
          provide: 'LISTMONK_CONFIG',
          useValue: options,
        },
        SubscribersService,
        TransactionalService,
        TemplatesService,
      ],
      exports: [
        SubscribersService,
        TransactionalService,
        TemplatesService,
      ],
    }
  }
}
