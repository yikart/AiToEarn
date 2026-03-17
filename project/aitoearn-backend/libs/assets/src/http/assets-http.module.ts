import type { DynamicModule, Provider } from '@nestjs/common'
import { Module } from '@nestjs/common'
import { AssetsModule } from '../assets.module'
import { AssetsHttpController } from './assets-http.controller'
import { ASSETS_HTTP_OPTIONS, AssetsHttpModuleOptions } from './assets-http.options'
import { AssetsHttpScheduler } from './assets-http.scheduler'

@Module({})
export class AssetsHttpModule {
  static forRoot(options: AssetsHttpModuleOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: ASSETS_HTTP_OPTIONS,
        useValue: options,
      },
    ]

    if (options.enableScheduler !== false) {
      providers.push(AssetsHttpScheduler)
    }

    return {
      module: AssetsHttpModule,
      imports: [AssetsModule.forRoot(options.assetsConfig)],
      controllers: [AssetsHttpController],
      providers,
    }
  }
}
