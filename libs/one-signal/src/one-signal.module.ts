import { DynamicModule, Module } from '@nestjs/common'
import * as OneSignal from '@onesignal/node-onesignal'
import { OneSignalConfig } from './one-signal.config'
import { OneSignalService } from './one-signal.service'

@Module({})
export class OneSignalModule {
  static register(options: OneSignalConfig): DynamicModule {
    return {
      module: OneSignalModule,
      imports: [
      ],
      providers: [
        {
          provide: OneSignalConfig,
          useValue: options,
        },
        {
          provide: OneSignal.DefaultApi,
          useFactory: () => {
            const configuration = OneSignal.createConfiguration(options)
            return new OneSignal.DefaultApi(configuration)
          },
        },
        OneSignalService,
      ],
      exports: [OneSignalService],
    }
  }
}
