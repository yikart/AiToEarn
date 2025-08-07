// src/mcp/mcp.module.ts
import { DynamicModule, Module, Provider } from '@nestjs/common'
import { MCP_OPTIONS } from './constants'
import { McpModuleOptions } from './mcp.interface'
import { McpService } from './mcp.service'
import { mcpProviders } from './providers'

@Module({
  providers: [McpService],
  exports: [McpService],
})
export class McpModule {
  static forRoot(options: McpModuleOptions): DynamicModule {
    return {
      module: McpModule,
      providers: [
        {
          provide: MCP_OPTIONS,
          useValue: options,
        },
        ...mcpProviders,
      ],
      exports: [McpService],
    }
  }

  static forRootAsync(options: {
    isGlobal?: boolean
    useFactory: (
      ...args: any[]
    ) => Promise<McpModuleOptions> | McpModuleOptions
    inject?: any[]
  }): DynamicModule {
    const providers: Provider[] = [
      {
        provide: MCP_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
      ...mcpProviders,
    ]

    return {
      module: McpModule,
      global: options.isGlobal,
      providers,
      exports: [McpService],
    }
  }
}
