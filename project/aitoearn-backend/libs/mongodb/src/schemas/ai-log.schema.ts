import type {
  AiLogSettlement as AiLogSettlementInterface,
  AiLogSettlementMetadata,
} from '@yikart/aitoearn-ai-shared'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { UserType } from '@yikart/common'
import { AiLogChannel, AiLogSettlementStatus, AiLogStatus, AiLogType } from '../enums'
import { DEFAULT_SCHEMA_OPTIONS } from '../mongodb.constants'
import { WithTimestampSchema } from './timestamp.schema'

export interface AiLogExtraFields { [key: string]: any }

type AiLogObject<T extends object = Record<string, never>> = T & AiLogExtraFields

type AiLogUsage = AiLogObject<{
  input_tokens?: number
  output_tokens?: number
  total_tokens?: number
  promptTokenCount?: number
  candidatesTokenCount?: number
  totalTokenCount?: number
  inputTokenDetails?: Record<string, unknown>
  outputTokenDetails?: Record<string, unknown>
}>

type AiLogChatMessagePart = AiLogObject<{
  type: string
  text?: string
  image_url?: AiLogObject<{
    url: string
    detail?: string
  }>
}>

type AiLogChatMessage = AiLogObject<{
  role: string
  content: string | AiLogChatMessagePart[]
}>

export type AiLogImageResult = AiLogObject<{
  url?: string
  b64_json?: string
  revised_prompt?: string
}>

type AiLogVideoTool = AiLogObject<{
  type: string
}>

type AiLogVideoContentItem = AiLogObject<{
  type: string
  text?: string
  role?: string
  image_url?: AiLogObject<{ url: string }>
  video_url?: AiLogObject<{ url: string }>
  audio_url?: AiLogObject<{ url: string }>
}>

type AiLogDraftPlan = AiLogObject<{
  title?: string
  description?: string
  topics?: string[]
  videoPrompt?: string
  imagePrompts?: string[]
}>

type AiLogImageExecution = AiLogObject<{
  referenceHandling?: string
  resolvedSize?: string
}>

type AiLogVideoError = string | AiLogObject<{
  code?: string
  message?: string
}>

export type ChatAiLogRequest = AiLogObject<{
  model: string
  messages: AiLogChatMessage[]
  temperature?: number
  maxTokens?: number
  maxCompletionTokens?: number
  modalities?: string[]
  topP?: number
  modelKwargs?: Record<string, unknown>
}>

export type ChatAiLogResponse = AiLogObject<{
  model: string
  created?: number
  choices?: unknown[]
  usage?: AiLogUsage
}>

export type ImageAiLogRequest = AiLogObject<{
  prompt: string
  model?: string
  content?: string
  image?: string | string[]
  imageUrls?: string[]
  imageSize?: string
  aspectRatio?: string
  referenceImageUrl?: string
  mask?: string
  n?: number
  quality?: string
  response_format?: 'url' | 'b64_json'
  size?: string
  style?: string
  user?: string
}>

export type ImageAiLogResponse = AiLogObject<{
  created?: number
  data?: AiLogImageResult[]
  list?: AiLogImageResult[]
  images?: AiLogImageResult[]
  image?: string
  imageUrl?: string
  usage?: AiLogUsage
}>

export type UserVideoGenerationAiLogRequest = AiLogObject<{
  model: string
  prompt: string
  groupId?: string
  image?: string | string[]
  image_tail?: string
  video_url?: string
  images?: string[]
  videos?: string[]
  audios?: string[]
  mode?: string
  size?: string
  resolution?: string
  ratio?: string
  duration?: number
  seed?: number
  watermark?: boolean
  tools?: AiLogVideoTool[]
  metadata?: Record<string, unknown>
}>

export type VolcengineVideoAiLogRequest = AiLogObject<{
  model: string
  content: AiLogVideoContentItem[]
  return_last_frame?: boolean
  resolution?: string
  ratio?: string
  duration?: number
  seed?: number
  watermark?: boolean
  tools?: AiLogVideoTool[]
  groupId?: string
}>

type OpenAIVideoAiLogRequestBase = AiLogObject<{
  prompt: string
  input_reference?: string
  groupId?: string
}>

export type OpenAIVideoAiLogRequest = OpenAIVideoAiLogRequestBase & {
  model?: string
  seconds?: string
  size?: string
}

export type OpenAIRemixVideoAiLogRequest = OpenAIVideoAiLogRequestBase & {
  remixed_from_video_id: string
}

export type GrokVideoAiLogRequest = AiLogObject<{
  model: string
  prompt: string
  duration?: number
  aspectRatio?: string
  resolution?: string
  image?: string
  referenceImages?: string[]
  videoUrl?: string
  groupId?: string
}>

export type DashscopeVideoAiLogRequest = AiLogObject<{
  model: string
  providerModel?: string
  mode?: string
  prompt: string
  images?: string[]
  videoUrl?: string
  resolution?: string
  ratio?: string
  duration?: number
  watermark?: boolean
  seed?: number
  groupId?: string
}>

export type GeminiVideoAiLogRequest = AiLogObject<{
  model: string
  prompt: string
  image?: string
  duration?: number
  resolution?: string
  aspectRatio?: string
  keyPairId?: string
  groupId?: string
}>

export type VideoAiLogRequest
  = | UserVideoGenerationAiLogRequest
    | VolcengineVideoAiLogRequest
    | OpenAIVideoAiLogRequest
    | OpenAIRemixVideoAiLogRequest
    | GrokVideoAiLogRequest
    | DashscopeVideoAiLogRequest
    | GeminiVideoAiLogRequest

export type VideoAiLogResponse = AiLogObject<{
  id?: string
  name?: string
  status?: string | AiLogStatus
  done?: boolean
  createdAt?: Date
  completedAt?: Date | null
  model?: string
  prompt?: string
  url?: string
  video_url?: string
  videoUrl?: string
  content?: AiLogObject<{
    video_url?: string
    last_frame_url?: string
  }>
  generatedVideos?: Array<AiLogObject<{
    url: string
    gcsUrl: string | null
  }>>
  response?: AiLogObject<{
    generatedVideos?: Array<AiLogObject<{
      video?: AiLogExtraFields
    }>>
  }>
  error?: AiLogVideoError
  mediaId?: string
  coverUrl?: string
  groupId?: string
}>

type VideoDraftGenerationAiLogRequest = AiLogObject<{
  groupId: string
  version: 'v2'
  model: string
  duration?: number
  aspectRatio?: string
  prompt?: string
  captionPrompt?: string
  imageUrls?: string[]
  videoUrls?: string[]
  draftType?: string
  plannerModel?: string
  imageExecution?: AiLogImageExecution
}>

type ImageTextDraftGenerationAiLogRequest = AiLogObject<{
  groupId: string
  version: 'v2-image-text'
  imageModel: string
  imageCount?: number
  imageSize?: string
  aspectRatio?: string
  prompt: string
  imageUrls?: string[]
  draftType?: string
  plannerModel?: string
  imageExecution?: AiLogImageExecution
}>

export type DraftGenerationAiLogRequest
  = | VideoDraftGenerationAiLogRequest
    | ImageTextDraftGenerationAiLogRequest

export type DraftGenerationAiLogResponse = AiLogObject<{
  materialId?: string
  mediaId?: string
  mediaIds?: string[]
  title?: string
  description?: string
  topics?: string[]
  videoUrl?: string
  coverUrl?: string
  imageUrls?: string[]
  requestedImageCount?: number
  generatedImageCount?: number
  imageGenerationErrors?: AiLogExtraFields[]
  plan?: AiLogDraftPlan
}>

export type AideoAiLogRequest = AiLogObject<{
  spaceName?: string
  prompt?: string
  skillType?: string
  skillParams?: Record<string, unknown>
  multiInputs?: unknown[]
  vids?: string[]
  dramaScriptTaskId?: string
  recapText?: string
  speakerConfig?: Record<string, unknown>
  isEraseSubtitle?: boolean
  fontConfig?: Record<string, unknown>
  recapStyle?: string
  recapTextSpeed?: number
  recapTextLength?: number
  pauseTime?: number
  allowRepeatMatch?: boolean
}>

export type AideoAiLogResponse = AiLogObject<{
  taskId?: string
  dramaScriptTaskId?: string
  status?: string
  Status?: string
  SkillType?: string
  SkillParams?: Record<string, unknown>
  ApiResponses?: Array<AiLogObject<{
    Error?: AiLogObject<{
      Code?: string
      Message?: string
    }>
  }>>
  outputVid?: string
  outputUrl?: string
  errorMessage?: string
  error?: AiLogExtraFields
}>

export type VideoEditAiLogRequest = AiLogObject<{
  Canvas: Record<string, unknown>
  Output: Record<string, unknown>
  tracksCount: number
}>

export type VideoEditAiLogResponse = AiLogObject<{
  outputUrl?: string
  outputVid?: string
  error?: string | AiLogExtraFields
}>

export type AgentAiLogRequest = AiLogObject<{
  materialId?: string
  platforms?: string[]
  configOnly?: boolean
  imageCount?: number
  videoUrl?: string
}>

export type AgentAiLogResponse = AiLogObject<{
  modelUsage?: Record<string, unknown>
  taskResult?: unknown
  title?: string
  description?: string
  topics?: string[]
}>

export type StyleTransferAiLogRequest = AiLogObject<{
  videoInput: string
  style?: string
  resolution?: string
  vid?: string
}>

export type StyleTransferAiLogResponse = AiLogObject<{
  taskId?: string
  outputVid?: string
  outputUrl?: string
  duration?: number
  resolution?: string
  price?: number
}>

export type CardAiLogRequest = AiLogExtraFields
export type CardAiLogResponse = AiLogExtraFields

export type CrawlerAiLogRequest = AiLogObject<{
  userId: string
  link: string
}>

export type CrawlerAiLogResponse = AiLogObject<{
  status?: string
  result?: Record<string, unknown>
  error?: string
  uploadMediaList?: unknown[]
}>

export interface AiLogRequestByTypeMap {
  [AiLogType.Chat]: ChatAiLogRequest
  [AiLogType.Image]: ImageAiLogRequest
  [AiLogType.Card]: CardAiLogRequest
  [AiLogType.Video]: VideoAiLogRequest
  [AiLogType.Agent]: AgentAiLogRequest
  [AiLogType.Aideo]: AideoAiLogRequest
  [AiLogType.Crawler]: CrawlerAiLogRequest
  [AiLogType.StyleTransfer]: StyleTransferAiLogRequest
  [AiLogType.VideoEdit]: VideoEditAiLogRequest
  [AiLogType.DraftGeneration]: DraftGenerationAiLogRequest
}

export interface AiLogResponseByTypeMap {
  [AiLogType.Chat]: ChatAiLogResponse
  [AiLogType.Image]: ImageAiLogResponse
  [AiLogType.Card]: CardAiLogResponse
  [AiLogType.Video]: VideoAiLogResponse
  [AiLogType.Agent]: AgentAiLogResponse
  [AiLogType.Aideo]: AideoAiLogResponse
  [AiLogType.Crawler]: CrawlerAiLogResponse
  [AiLogType.StyleTransfer]: StyleTransferAiLogResponse
  [AiLogType.VideoEdit]: VideoEditAiLogResponse
  [AiLogType.DraftGeneration]: DraftGenerationAiLogResponse
}

export type AiLogRequest = AiLogRequestByTypeMap[keyof AiLogRequestByTypeMap]
export type AiLogResponse = AiLogResponseByTypeMap[keyof AiLogResponseByTypeMap]
export type AiLogRequestByType<T extends AiLogType> = AiLogRequestByTypeMap[T]
export type AiLogResponseByType<T extends AiLogType> = AiLogResponseByTypeMap[T]

@Schema({ _id: false })
export class AiLogSettlement {
  @Prop({
    required: true,
    enum: AiLogSettlementStatus,
  })
  status: AiLogSettlementStatus

  @Prop({
    required: true,
  })
  prepaidPoints: number

  @Prop({
    required: false,
  })
  actualPoints?: number

  @Prop({
    required: false,
  })
  deltaPoints?: number

  @Prop({
    required: false,
    type: Date,
  })
  settledAt?: Date

  @Prop({
    required: false,
    type: Object,
  })
  metadata?: AiLogSettlementMetadata
}

export const AiLogSettlementSchema = SchemaFactory.createForClass(AiLogSettlement)

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'aiLogs' })
export class AiLog extends WithTimestampSchema {
  id: string

  @Prop({
    required: true,
    index: true,
  })
  userId: string

  @Prop({
    required: true,
    enum: UserType,
  })
  userType: UserType

  @Prop({
    required: false,
    index: true,
  })
  libraryId?: string

  @Prop({
    required: false,
    index: true,
  })
  taskId?: string

  @Prop({
    required: true,
    enum: AiLogType,
  })
  type: AiLogType

  @Prop({
    required: true,
  })
  model: string

  @Prop({
    required: true,
    enum: AiLogChannel,
  })
  channel: AiLogChannel

  @Prop({
    required: false,
  })
  action?: string

  @Prop({
    required: true,
    enum: AiLogStatus,
  })
  status: AiLogStatus

  @Prop({
    required: true,
    type: Date,
  })
  startedAt: Date

  @Prop({
    required: false,
  })
  duration?: number

  @Prop({
    required: true,
    type: Object,
  })
  request: AiLogRequest

  @Prop({
    required: false,
    type: Object,
  })
  response?: AiLogResponse

  @Prop({
    required: false,
    type: Object,
  })
  errorMessage?: string

  @Prop({
    required: true,
  })
  points: number

  @Prop({
    required: false,
    type: AiLogSettlementSchema,
  })
  settlement?: AiLogSettlementInterface
}

export type TypedAiLog<T extends AiLogType> = Omit<AiLog, 'type' | 'request' | 'response'> & {
  type: T
  request: AiLogRequestByType<T>
  response?: AiLogResponseByType<T>
}

export const AiLogSchema = SchemaFactory.createForClass(AiLog)
AiLogSchema.index({ type: 1, status: 1, channel: 1, createdAt: -1 })
AiLogSchema.index({ userId: 1, type: 1, userType: 1, createdAt: -1 })
AiLogSchema.index({ status: 1, createdAt: -1 })
