import { DynamicModule, Module } from '@nestjs/common'
import { NatsClientModule } from '@yikart/nats-client'
import { FingerprintManagerClient } from './fingerprint-manager.client'
import { FingerprintManagerConfig } from './fingerprint-manager.config'

@Module({})
export class FingerprintManagerClientModule {
  static register(options: FingerprintManagerConfig): DynamicModule {
    return {
      module: FingerprintManagerClientModule,
      imports: [
        NatsClientModule.register({
          name: options.name,
          servers: options.servers,
          user: options.user,
          pass: options.pass,
          prefix: options.prefix || 'fingerprint-manager',
        }),
      ],
      providers: [
        {
          provide: FingerprintManagerConfig,
          useValue: options,
        },
        FingerprintManagerClient,
      ],
      exports: [FingerprintManagerClient, NatsClientModule],
    }
  }

  static registerAsync(options: {
    useFactory: (...args: any[]) => Promise<FingerprintManagerConfig> | FingerprintManagerConfig
    inject?: any[]
    imports?: any[]
  }): DynamicModule {
    return {
      module: FingerprintManagerClientModule,
      imports: [
        ...(options.imports || []),
        NatsClientModule.register({
          name: 'fingerprint-manager',
          servers: ['nats://localhost:4222'],
          prefix: 'fingerprint-manager',
        }),
      ],
      providers: [
        {
          provide: FingerprintManagerConfig,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        FingerprintManagerClient,
      ],
      exports: [FingerprintManagerClient, NatsClientModule],
    }
  }
}
