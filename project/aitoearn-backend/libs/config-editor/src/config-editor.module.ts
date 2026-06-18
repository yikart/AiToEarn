import type { DynamicModule } from '@nestjs/common'
import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core/router'
import { ConfigEditorConfig, ConfigEditorModuleOptions } from './config-editor.config'
import { ConfigEditorController } from './config-editor.controller'
import { ConfigEditorService } from './config-editor.service'
import { ConfigRestartService } from './config-restart.service'

@Module({})
export class ConfigEditorModule {
  static forRoot<T>(options: ConfigEditorModuleOptions<T>): DynamicModule {
    const config = new ConfigEditorConfig(options)
    return {
      module: ConfigEditorModule,
      imports: [
        RouterModule.register([
          {
            path: config.routePrefix,
            module: ConfigEditorModule,
          },
        ]),
      ],
      controllers: [ConfigEditorController],
      providers: [
        {
          provide: ConfigEditorConfig,
          useValue: config,
        },
        ConfigEditorService,
        ConfigRestartService,
      ],
      exports: [ConfigEditorService, ConfigRestartService],
    }
  }
}
