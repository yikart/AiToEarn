import type { DynamicModule, FactoryProvider, ModuleMetadata } from '@nestjs/common'
import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { AITOEARN_AUTH_OPTIONS, AitoearnAuthOptions } from './aitoearn-auth.config'
import { AitoearnAuthGuard } from './aitoearn-auth.guard'
import { AitoearnAuthService } from './aitoearn-auth.service'

export interface AitoearnAuthModuleAsyncOptions<TTokenInfo = unknown> {
  imports?: ModuleMetadata['imports']
  inject?: FactoryProvider['inject']
  useFactory: (...args: any[]) => AitoearnAuthOptions<TTokenInfo> | Promise<AitoearnAuthOptions<TTokenInfo>>
}

@Module({})
export class AitoearnAuthModule {
  static forRootAsync<TTokenInfo = unknown>(options: AitoearnAuthModuleAsyncOptions<TTokenInfo>): DynamicModule {
    return {
      global: true,
      module: AitoearnAuthModule,
      imports: [
        ...(options.imports ?? []),
        JwtModule.register({}),
      ],
      providers: [
        {
          provide: AITOEARN_AUTH_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        AitoearnAuthService,
        {
          provide: APP_GUARD,
          useClass: AitoearnAuthGuard,
        },
      ],
      exports: [AitoearnAuthService],
    }
  }
}
