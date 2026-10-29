import { Module } from '@nestjs/common'
import { Redis } from 'ioredis'
import { config } from '../config'
import { InMemoryPluginKvStore } from './plugin-host.kv-store'
import { RedisPluginKvStore } from './plugin-host.kv-store.redis'
import { PluginHostService } from './plugin-host.service'

export interface PluginSecretResolver {
  resolveSecret: (pluginId: string, key: string, accountId?: string) => Promise<string>
}

/**
 * 插件宿主模块：加载 plugins/ 下的官方插件，对外提供 PluginHostService。
 * 密钥解析默认未配置：由 PluginSecretBridge 在应用启动早期把账号凭据体系注册进来。
 */
@Module({
  providers: [
    {
      // 全局 ioredis 客户端（Redis token 由 @yikart/redis 的 RedisModule.forRoot 注册为 global）。
      // @Optional 兜底：缺少 Redis 的上下文（纯单测）下降级为内存存储。
      provide: 'PLUGIN_HOST_REDIS',
      useFactory: (client?: Redis) => client ?? null,
      inject: [{ token: Redis, optional: true }],
    },
    {
      provide: PluginHostService,
      useFactory: (redisClient: Redis | null) => {
        const pluginsConfig = config.plugins
        const useRedis = pluginsConfig.storage === 'redis' && redisClient
        return new PluginHostService(
          {
            dir: pluginsConfig.dir,
            trustedKeys: pluginsConfig.trustedKeys,
            hostVersion: pluginsConfig.hostVersion,
            fsIsolation: pluginsConfig.fsIsolation,
          },
          {
            resolveSecret: async () => {
              throw new Error('插件密钥解析未配置')
            },
            kvStore: useRedis ? new RedisPluginKvStore(redisClient) : new InMemoryPluginKvStore(),
            allowRawSecrets: pluginsConfig.allowRawSecrets,
          },
        )
      },
      inject: ['PLUGIN_HOST_REDIS'],
    },
  ],
  exports: [PluginHostService],
})
export class PluginHostModule {}
