import type {
  DashscopeVideoAiLogRequest,
  GrokVideoAiLogRequest,
  OpenAIRemixVideoAiLogRequest,
  OpenAIVideoAiLogRequest,
  RelayVideoAiLogRequest,
  TypedAiLog,
  UserVideoGenerationAiLogRequest,
  VolcengineVideoAiLogRequest,
} from '@yikart/mongodb'
import type { RelayVideoCallbackDto } from '../libs/relay/relay.interface'
import type { DashscopeVideoCallbackDto } from './dashscope'
import type { GrokVideoCallbackDto } from './grok/grok.service'
import type { OpenAIVideoCallbackDto } from './openai/openai.dto'
import type { VolcengineCallbackDto } from './volcengine/volcengine.dto'
import { AiLogChannel, AiLogType } from '@yikart/mongodb'

interface SavedVideoMediaInfo {
  mediaId?: string
  coverUrl?: string
  groupId?: string
}

type VideoAiLogBase = Omit<TypedAiLog<AiLogType.Video>, 'channel' | 'request' | 'response'>

export type VolcengineVideoAiLog = VideoAiLogBase & {
  channel: AiLogChannel.Volcengine
  request: VolcengineVideoAiLogRequest
  response?: VolcengineCallbackDto & SavedVideoMediaInfo
}

export type OpenAIVideoAiLog = VideoAiLogBase & {
  channel: AiLogChannel.OpenAI
  request: OpenAIVideoAiLogRequest | OpenAIRemixVideoAiLogRequest
  response?: OpenAIVideoCallbackDto & SavedVideoMediaInfo
}

export type GrokVideoAiLog = VideoAiLogBase & {
  channel: AiLogChannel.Grok
  request: GrokVideoAiLogRequest
  response?: GrokVideoCallbackDto & SavedVideoMediaInfo
}

export type DashscopeVideoAiLog = VideoAiLogBase & {
  channel: AiLogChannel.Dashscope
  request: DashscopeVideoAiLogRequest
  response?: DashscopeVideoCallbackDto & SavedVideoMediaInfo
}
export type RelayVideoAiLog = VideoAiLogBase & {
  channel: AiLogChannel.Relay
  request: RelayVideoAiLogRequest
  response?: RelayVideoCallbackDto & SavedVideoMediaInfo
}

export type UserRequestedVideoAiLog = VideoAiLogBase & {
  request: UserVideoGenerationAiLogRequest
}

export interface VideoAiLogByChannelMap {
  [AiLogChannel.Volcengine]: VolcengineVideoAiLog
  [AiLogChannel.OpenAI]: OpenAIVideoAiLog
  [AiLogChannel.Grok]: GrokVideoAiLog
  [AiLogChannel.Dashscope]: DashscopeVideoAiLog
  [AiLogChannel.Relay]: RelayVideoAiLog
}

export type VideoAiLogByChannel<C extends keyof VideoAiLogByChannelMap> = VideoAiLogByChannelMap[C]

export type VideoAiLog
  = | VolcengineVideoAiLog
    | OpenAIVideoAiLog
    | GrokVideoAiLog
    | DashscopeVideoAiLog
    | RelayVideoAiLog
