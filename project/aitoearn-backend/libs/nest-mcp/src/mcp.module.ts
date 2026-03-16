import type {
  McpAsyncOptions,
  McpModuleAsyncOptions,
  McpOptions,
  McpOptionsFactory,
} from './interfaces'
import { DynamicModule, Module, Provider, Type } from '@nestjs/common'
import { DiscoveryModule } from '@nestjs/core'
import { McpTransportType } from './interfaces'
import { McpExecutorService } from './services/mcp-executor.service'
import { McpRegistryService } from './services/mcp-registry.service'
import { McpSseService } from './services/mcp-sse.service'
import { McpStreamableHttpService } from './services/mcp-streamable-http.service'
import { SsePingService } from './services/sse-ping.service'
import { createSseController } from './transport/sse.controller.factory'
import { createStreamableHttpController } from './transport/streamable-http.controller.factory'
import { normalizeEndpoint } from './utils/normalize-endpoint'

let instanceIdCounter = 0

@Module({
  imports: [DiscoveryModule],
  providers: [McpRegistryService, McpExecutorService],
})
export class McpModule {
  /**
   * To avoid import circular dependency issues, we use a marker property.
   */
  readonly __isMcpModule = true

  static forRoot(options: McpOptions): DynamicModule {
    const defaultOptions: Partial<McpOptions> = {
      transport: [
        McpTransportType.SSE,
        McpTransportType.STREAMABLE_HTTP,
        McpTransportType.STDIO,
      ],
      sseEndpoint: 'sse',
      messagesEndpoint: 'messages',
      mcpEndpoint: 'mcp',
      guards: [],
      decorators: [],
      streamableHttp: {
        enableJsonResponse: true,
        sessionIdGenerator: undefined,
        statelessMode: true,
      },
      sse: {
        pingEnabled: true,
        pingIntervalMs: 30000,
      },
    }
    const mergedOptions = { ...defaultOptions, ...options } as McpOptions
    mergedOptions.sseEndpoint = normalizeEndpoint(mergedOptions.sseEndpoint)
    mergedOptions.messagesEndpoint = normalizeEndpoint(
      mergedOptions.messagesEndpoint,
    )
    mergedOptions.mcpEndpoint = normalizeEndpoint(mergedOptions.mcpEndpoint)

    const moduleId = `mcp-module-${instanceIdCounter++}`
    const providers = this.createProvidersFromOptions(mergedOptions, moduleId)
    const controllers = this.createControllersFromOptions(mergedOptions)
    return {
      module: McpModule,
      controllers,
      providers,
      exports: [McpRegistryService, McpSseService, McpStreamableHttpService],
    }
  }

  /**
   * Asynchronous variant of forRoot. Controllers are NOT auto-registered here because
   * they must be declared synchronously at module definition time. This keeps the
   * API explicit: when using forRootAsync, you are responsible for creating and
   * registering any transport controllers (e.g. via createSseController / createStreamableHttpController).
   *
   * The exposed async options intentionally omit the `transport` property. Transport
   * selection only influences automatic controller creation (which does not occur here)
   * and STDIO auto-start. If you need STDIO with forRootAsync, manually instantiate
   * and bootstrap it (e.g. by importing a module that injects StdioService) or add
   * an explicit provider that sets options.transport before use.
   */
  static forRootAsync(options: McpModuleAsyncOptions): DynamicModule {
    const moduleId = `mcp-module-${instanceIdCounter++}`
    const asyncProviders = this.createAsyncProviders(options)
    const baseProviders: Provider[] = [
      {
        provide: 'MCP_MODULE_ID',
        useValue: moduleId,
      },
      McpRegistryService,
      McpExecutorService,
      SsePingService,
      McpSseService,
      McpStreamableHttpService,
    ]

    return {
      module: McpModule,
      imports: options.imports ?? [],
      // No automatic controllers in async mode
      controllers: [],
      providers: [
        ...asyncProviders,
        ...baseProviders,
        ...(options.extraProviders ?? []),
      ],
      exports: [McpRegistryService, McpSseService, McpStreamableHttpService],
    }
  }

  private static createAsyncProviders(
    options: McpModuleAsyncOptions,
  ): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: 'MCP_OPTIONS',
          useFactory: async (...args: unknown[]) => {
            const resolved: McpAsyncOptions = await options.useFactory!(
              ...args,
            )
            return this.mergeAndNormalizeAsyncOptions(resolved)
          },
          inject: options.inject ?? [],
        },
      ]
    }

    // useClass / useExisting path
    const inject: any[] = []
    let optionsFactoryProvider: Provider | undefined

    if (options.useExisting || options.useClass) {
      const useExisting = options.useExisting || options.useClass!
      inject.push(useExisting)
      if (options.useClass) {
        optionsFactoryProvider = {
          provide: options.useClass,
          useClass: options.useClass,
        } as Provider
      }

      return [
        ...(optionsFactoryProvider ? [optionsFactoryProvider] : []),
        {
          provide: 'MCP_OPTIONS',
          useFactory: async (factory: McpOptionsFactory) => {
            const resolved = await factory.createMcpOptions()
            return this.mergeAndNormalizeAsyncOptions(resolved)
          },
          inject,
        },
      ]
    }

    throw new Error('Invalid McpModuleAsyncOptions configuration.')
  }

  private static mergeAndNormalizeAsyncOptions(
    resolved: McpAsyncOptions,
  ): McpOptions {
    const defaultOptions: Partial<McpOptions> = {
      sseEndpoint: 'sse',
      messagesEndpoint: 'messages',
      mcpEndpoint: 'mcp',
      guards: [],
      decorators: [],
      streamableHttp: {
        enableJsonResponse: true,
        sessionIdGenerator: undefined,
        statelessMode: true,
      },
      sse: {
        pingEnabled: true,
        pingIntervalMs: 30000,
      },
    }
    // Note: transport intentionally omitted
    const merged = { ...defaultOptions, ...resolved } as McpOptions
    merged.sseEndpoint = normalizeEndpoint(merged.sseEndpoint)
    merged.messagesEndpoint = normalizeEndpoint(merged.messagesEndpoint)
    merged.mcpEndpoint = normalizeEndpoint(merged.mcpEndpoint)
    return merged
  }

  private static createControllersFromOptions(
    options: McpOptions,
  ): Type<any>[] {
    const sseEndpoint = options.sseEndpoint ?? 'sse'
    const messagesEndpoint = options.messagesEndpoint ?? 'messages'
    const mcpEndpoint = options.mcpEndpoint ?? 'mcp'
    const guards = options.guards ?? []
    const transports = Array.isArray(options.transport)
      ? options.transport
      : [options.transport ?? McpTransportType.SSE]
    const controllers: Type<any>[] = []
    const decorators = options.decorators ?? []
    const apiPrefix = options.apiPrefix ?? ''

    if (transports.includes(McpTransportType.SSE)) {
      const sseController = createSseController(
        sseEndpoint,
        messagesEndpoint,
        apiPrefix,
        guards,
        decorators,
      )
      controllers.push(sseController)
    }

    if (transports.includes(McpTransportType.STREAMABLE_HTTP)) {
      const streamableHttpController = createStreamableHttpController(
        mcpEndpoint,
        apiPrefix,
        guards,
        decorators,
      )
      controllers.push(streamableHttpController)
    }

    if (transports.includes(McpTransportType.STDIO)) {
      // STDIO transport is handled by injectable StdioService, no controller
    }

    return controllers
  }

  private static createProvidersFromOptions(
    options: McpOptions,
    moduleId: string,
  ): Provider[] {
    const providers: Provider[] = [
      {
        provide: 'MCP_OPTIONS',
        useValue: options,
      },
      {
        provide: 'MCP_MODULE_ID',
        useValue: moduleId,
      },
      McpRegistryService,
      McpExecutorService,
      SsePingService,
      McpSseService,
      McpStreamableHttpService,
    ]

    return providers
  }
}
