import { DynamicModule, Module } from '@nestjs/common'
import { AitoearnAiClientConfig } from '@yikart/aitoearn-ai-client'
import { IntentClassifier } from './intent-classifier'

/**
 * 养号状态机模块
 * 提供 IntentClassifier（评论意图分类），供 EngagementService 调用
 */
@Module({})
export class NurtureModule {
  static register(): DynamicModule {
    return {
      module: NurtureModule,
      providers: [
        {
          provide: IntentClassifier,
          useFactory: (config: AitoearnAiClientConfig) => new IntentClassifier(config),
          inject: [AitoearnAiClientConfig],
        },
      ],
      exports: [IntentClassifier],
    }
  }
}
