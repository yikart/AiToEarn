import { DynamicModule, InjectionToken, Module, OptionalFactoryDependency } from '@nestjs/common'
import { AnsibleConfig } from './ansible.interface'
import { AnsibleService } from './ansible.service'

@Module({})
export class AnsibleModule {
  static forRoot(config: AnsibleConfig = {}): DynamicModule {
    return {
      module: AnsibleModule,
      providers: [
        {
          provide: 'ANSIBLE_CONFIG',
          useValue: config,
        },
        {
          provide: AnsibleService,
          useFactory: (ansibleConfig: AnsibleConfig) => {
            return new AnsibleService(ansibleConfig)
          },
          inject: ['ANSIBLE_CONFIG'],
        },
      ],
      exports: [AnsibleService],
      global: true,
    }
  }

  static forRootAsync(options: {
    useFactory: (...args: unknown[]) => Promise<AnsibleConfig> | AnsibleConfig
    inject?: (InjectionToken | OptionalFactoryDependency)[]
  }): DynamicModule {
    return {
      module: AnsibleModule,
      providers: [
        {
          provide: 'ANSIBLE_CONFIG',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: AnsibleService,
          useFactory: (ansibleConfig: AnsibleConfig) => {
            return new AnsibleService(ansibleConfig)
          },
          inject: ['ANSIBLE_CONFIG'],
        },
      ],
      exports: [AnsibleService],
      global: true,
    }
  }
}
