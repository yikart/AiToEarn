import { DynamicModule, Module } from '@nestjs/common'
import { AnsibleConfig } from './ansible.config'
import { AnsibleService } from './ansible.service'

@Module({})
export class AnsibleModule {
  static forRoot(config: AnsibleConfig): DynamicModule {
    return {
      module: AnsibleModule,
      providers: [
        {
          provide: AnsibleConfig,
          useValue: config,
        },
        AnsibleService,
      ],
      exports: [AnsibleService],
      global: true,
    }
  }
}
