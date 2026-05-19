import type { TokenPayload } from '@yikart/aitoearn-auth'
import { createHash } from 'node:crypto'
import { Module, UnauthorizedException } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { AitoearnAuthModule } from '@yikart/aitoearn-auth'
import { AitoearnQueueModule } from '@yikart/aitoearn-queue'
import { AitoearnServerClientModule } from '@yikart/aitoearn-server-client'
import { AssetsModule } from '@yikart/assets'
import { HelpersModule } from '@yikart/helpers'
import { ApiKeyRepository, MongodbModule, UserRepository, UserStatus } from '@yikart/mongodb'
import { RedlockModule } from '@yikart/redlock'
import { config } from './config'
import { AgentModule } from './core/agent/agent.module'
import { AiAvailabilityModule } from './core/ai-availability'
import { AiModule } from './core/ai/ai.module'
import { AiTaskRefundModule } from './core/credits/ai-task-refund.module'
import { DraftGenerationModule } from './core/draft-generation'
import { InternalModule } from './core/internal'

@Module({
  imports: [
    AiAvailabilityModule.forRoot(),
    ScheduleModule.forRoot(),
    MongodbModule.forRoot(config.mongodb),
    AitoearnQueueModule.forRoot({
      redis: config.redis,
      prefix: '{bull}',
    }),
    RedlockModule.forRoot(config.redlock),
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
    AitoearnServerClientModule.forRoot(config.serverClient),
    AssetsModule.forRoot(config.assets),
    HelpersModule,
    AiModule,
    AgentModule,
    InternalModule,
    DraftGenerationModule,
    AiTaskRefundModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
