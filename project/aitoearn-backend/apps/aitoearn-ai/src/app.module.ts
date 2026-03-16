import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { AitoearnAuthModule } from '@yikart/aitoearn-auth'
import { AitoearnQueueModule } from '@yikart/aitoearn-queue'
import { AitoearnServerClientModule } from '@yikart/aitoearn-server-client'
import { AssetsModule } from '@yikart/assets'
import { HelpersModule } from '@yikart/helpers'
import { MongodbModule } from '@yikart/mongodb'
import { RedlockModule } from '@yikart/redlock'
import { config } from './config'
import { AgentModule } from './core/agent/agent.module'
import { AiModule } from './core/ai/ai.module'
import { DraftGenerationModule } from './core/draft-generation'
import { InternalModule } from './core/internal'
import { MaterialAdaptationModule } from './core/material-adaptation'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongodbModule.forRoot(config.mongodb),
    AitoearnQueueModule.forRoot({
      redis: config.redis,
      prefix: '{bull}',
    }),
    RedlockModule.forRoot(config.redlock),
    AitoearnAuthModule.forRoot(config.auth),
    AitoearnServerClientModule.forRoot(config.serverClient),
    AssetsModule.forRoot(config.assets),
    HelpersModule,
    AiModule,
    AgentModule,
    InternalModule,
    MaterialAdaptationModule,
    DraftGenerationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
