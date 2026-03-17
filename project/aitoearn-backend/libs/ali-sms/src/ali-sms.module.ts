import type { DynamicModule, Provider } from '@nestjs/common'
import { Global, Module } from '@nestjs/common'
import { AliSmsConfig } from './ali-sms.config'
import { AliSmsService } from './ali-sms.service'

@Global()
@Module({})
export class AliSmsModule {
  static forRoot(config: AliSmsConfig): DynamicModule {
    const providers: Provider[] = [
      {
        provide: AliSmsConfig,
        useValue: config,
      },
      AliSmsService,
    ]

    return {
      global: true,
      module: AliSmsModule,
      providers,
      exports: [AliSmsService],
    }
  }
}
