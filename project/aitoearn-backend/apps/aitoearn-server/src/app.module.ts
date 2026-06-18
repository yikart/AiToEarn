import type { TokenPayload } from '@yikart/aitoearn-auth'
import { createHash } from 'node:crypto'
import { Module, UnauthorizedException } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { AitoearnAiClientModule } from '@yikart/aitoearn-ai-client'
import { AitoearnAuthModule } from '@yikart/aitoearn-auth'
import { AitoearnQueueModule } from '@yikart/aitoearn-queue'
import { ChannelDbModule } from '@yikart/channel-db'
import { ConfigEditorModule } from '@yikart/config-editor'
import { ApiKeyRepository, MongodbModule, UserRepository, UserStatus } from '@yikart/mongodb'
import { RedlockModule } from '@yikart/redlock'
import { ServerRedisModule } from './common/redis'
import { AppConfig, config } from './config'
import { ApiKeyModule } from './core/api-key/api-key.module'
import { AssetsModule } from './core/assets/assets.module'
import { ChannelsModule } from './core/channels/channels.module'
import { ChannelsMcpModule } from './core/channels/mcp/channels.mcp.module'
import { ContentMcpModule } from './core/content/content-mcp.module'
import { ContentModule } from './core/content/content.module'
import { PublishModule } from './core/publish-record/publish-record.module'
import { RelayModule } from './core/relay/relay.module'
import { ShortLinkModule } from './core/short-link/short-link.module'
import { UnifiedMcpModule } from './core/unified-mcp/unified-mcp.module'
import { UserModule } from './core/user/user.module'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigEditorModule.forRoot({
      schema: AppConfig,
      config,
      routePrefix: 'config',
    }),
    MongodbModule.forRoot(config.mongodb),
    ChannelDbModule.forRoot(config.channel.channelDb),
    AitoearnQueueModule.forRoot({
      redis: config.redis,
      prefix: '{bull}',
    }),
    ServerRedisModule,
    AitoearnAuthModule.forRootAsync({
      inject: [UserRepository, ApiKeyRepository],
      useFactory: (userRepository: UserRepository, apiKeyRepository: ApiKeyRepository) => {
        const getOpenUser = async (userId: string) => {
          const user = await userRepository.getById(userId)
          if (!user || user.isDelete || user.status !== UserStatus.OPEN) {
            throw new UnauthorizedException()
          }
          return user
        }
        return {
          ...config.auth,
          getTokenInfo: (payload: TokenPayload) => getOpenUser(payload.id),
          getTokenInfoByApiKey: async (apiKey: string) => {
            const keyHash = createHash('sha1').update(apiKey).digest('hex')
            const record = await apiKeyRepository.getByKeyHash(keyHash)
            if (!record) {
              throw new UnauthorizedException()
            }
            await apiKeyRepository.updateLastUsedAt(record.id)
            return getOpenUser(record.userId)
          },
        }
      },
    }),
    RedlockModule.forRoot(config.redlock),
    AitoearnAiClientModule.forRoot(config.aiClient),
    AssetsModule,
    UserModule,
    ContentModule,
    ChannelsModule,
    PublishModule,
    ShortLinkModule,
    ApiKeyModule,
    RelayModule,
    // MCP modules (after business modules to ensure @Global services are available)
    ChannelsMcpModule,
    ContentMcpModule,
    UnifiedMcpModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
