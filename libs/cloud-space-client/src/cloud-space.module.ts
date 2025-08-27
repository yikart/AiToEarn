import { DynamicModule, Module } from '@nestjs/common'
import { NatsClientModule } from '@yikart/nats-client'
import { CloudSpaceClient } from './cloud-space.client'
import { CloudSpaceConfig } from './cloud-space.config'

@Module({})
export class CloudSpaceClientModule {
  static forRoot(options: CloudSpaceConfig): DynamicModule {
    return {
      global: true,
      module: CloudSpaceClientModule,
      imports: [
        NatsClientModule.register({
          name: options.name,
          servers: options.servers,
          user: options.user,
          pass: options.pass,
          prefix: options.prefix,
        }),
      ],
      providers: [
        {
          provide: CloudSpaceConfig,
          useValue: options,
        },
        CloudSpaceClient,
      ],
      exports: [CloudSpaceClient, NatsClientModule],
    }
  }
}
