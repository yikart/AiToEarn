import { DynamicModule, Module, Provider } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import OSS from 'ali-oss'
import { ALI_OSS_CLIENT, ALI_OSS_MODULE_OPTIONS } from './ali-oss.constants'
import {
  AliOSSModuleAsyncOptions,
  AliOSSModuleOptions,
} from './ali-oss.interfaces'
import { AliOSSService } from './ali-oss.service'

@Module({})
export class AliOSSModule {
  static forRoot(options: AliOSSModuleOptions): DynamicModule {
    return {
      module: AliOSSModule,
      providers: [
        {
          provide: ALI_OSS_MODULE_OPTIONS,
          useValue: options,
        },
        {
          provide: ALI_OSS_CLIENT,
          useFactory: (options: AliOSSModuleOptions): OSS => {
            return new OSS(options)
          },
          inject: [ALI_OSS_MODULE_OPTIONS],
        },
        AliOSSService,
      ],
      exports: [AliOSSService],
    }
  }

  static forRootAsync(options: AliOSSModuleAsyncOptions): DynamicModule {
    return {
      module: AliOSSModule,
      imports: [ConfigModule],
      providers: [
        this.createAsyncOptionsProvider(options),
        {
          provide: ALI_OSS_CLIENT,
          useFactory: (options: AliOSSModuleOptions): OSS => {
            return new OSS(options)
          },
          inject: [ALI_OSS_MODULE_OPTIONS],
        },
        AliOSSService,
      ],
      exports: [AliOSSService],
    }
  }

  private static createAsyncOptionsProvider(
    options: AliOSSModuleAsyncOptions,
  ): Provider {
    return {
      provide: ALI_OSS_MODULE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject || [],
    }
  }
}
