/**
 * 去重评分模块
 * 在 Create Agent 的混剪管线后插入"去重评分 + 二次混剪触发器"
 */
import { Module } from '@nestjs/common'
import { OpenaiModule } from '../ai/libs/openai'
import { VolcengineModule } from '../ai/libs/volcengine'
import { FrameScorer } from './frame-scorer'
import { AudioScorer } from './audio-scorer'
import { SubtitleScorer } from './subtitle-scorer'
import { CompositeScorer } from './composite-scorer'
import { RemixWrapper } from './remix-wrapper'

@Module({
  imports: [
    // 复用项目已有的 OpenAI 模块（用于字幕 embedding）
    OpenaiModule,
    // 复用项目已有的火山引擎模块（用于混剪任务提交）
    VolcengineModule,
  ],
  providers: [
    FrameScorer,
    AudioScorer,
    SubtitleScorer,
    CompositeScorer,
    RemixWrapper,
  ],
  exports: [
    FrameScorer,
    AudioScorer,
    SubtitleScorer,
    CompositeScorer,
    RemixWrapper,
  ],
})
export class DedupModule {}
