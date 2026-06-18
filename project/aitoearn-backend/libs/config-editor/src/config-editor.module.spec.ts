import type { DynamicModule } from '@nestjs/common'
import { RouterModule } from '@nestjs/core/router'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { ConfigEditorConfig } from './config-editor.config'
import { ConfigEditorController } from './config-editor.controller'
import { ConfigEditorModule } from './config-editor.module'

describe('configEditorModule', () => {
  it('使用 RouterModule 挂载配置前缀并用 class token 注入配置', () => {
    const module = ConfigEditorModule.forRoot({
      schema: z.object({ name: z.string() }),
      config: {
        meta: {
          configPath: 'config.yaml',
        },
      },
      routePrefix: '/open/config/',
    })
    const routerModule = module.imports?.[0] as DynamicModule
    const routesProvider = routerModule.providers?.find(provider => typeof provider === 'object' && provider && 'useValue' in provider)
    const configProvider = module.providers?.find(provider => typeof provider === 'object' && provider && 'provide' in provider && provider.provide === ConfigEditorConfig)

    expect(module.controllers).toEqual([ConfigEditorController])
    expect(routerModule.module).toBe(RouterModule)
    expect(routesProvider).toMatchObject({
      useValue: [{
        path: 'open/config',
        module: ConfigEditorModule,
      }],
    })
    expect(configProvider).toMatchObject({
      useValue: expect.objectContaining({
        configPath: 'config.yaml',
        routePrefix: 'open/config',
      }),
    })
  })
})
