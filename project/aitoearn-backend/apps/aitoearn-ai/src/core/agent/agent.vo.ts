import { AccountType, createPaginationVo, createZodDto } from '@yikart/common'
import { ContentGenerationTaskStatus } from '@yikart/mongodb'
import { z } from 'zod'

export enum AgentMessageType {
  Assistant = 'assistant',
  User = 'user',
  Result = 'result',
  System = 'system',
  StreamEvent = 'stream_event',
  ToolProgress = 'tool_progress',
  AuthStatus = 'auth_status',
  KeepAlive = 'keep_alive',
  Init = 'init',
  Complete = 'complete',
  TitleUpdated = 'title_updated',
  Error = 'error',
}

export const ContentGenerationMediaVoSchema = z.object({
  type: z.enum(['IMAGE', 'VIDEO']),
  url: z.string(),
  thumbUrl: z.string().optional(),
  prompt: z.string().optional(),
})
export class ContentGenerationMediaVo extends createZodDto(ContentGenerationMediaVoSchema) { }

// MediaOnly result schema (single object only)
const MediaOnlyBaseSchema = z.object({
  type: z.literal('mediaOnly'),
  medias: z.array(ContentGenerationMediaVoSchema),
})

const MediaOnlyNoneActionSchema = MediaOnlyBaseSchema.extend({
  action: z.literal('none'),
})

const MediaOnlyNavigateToMediaActionSchema = MediaOnlyBaseSchema.extend({
  action: z.literal('navigateToMedia'),
  mediaId: z.string(),
  groupId: z.string(),
})

const MediaOnlyResultSchema = z.discriminatedUnion('action', [
  MediaOnlyNoneActionSchema,
  MediaOnlyNavigateToMediaActionSchema,
])

// FullContent result schema (array only)
// Base fields for each array element
const FullContentElementBaseSchema = z.object({
  type: z.literal('fullContent'),
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  medias: z.array(ContentGenerationMediaVoSchema),
})

// Action: none (platform not needed)
const FullContentNoneActionSchema = FullContentElementBaseSchema.extend({
  action: z.literal('none'),
  platform: z.enum(AccountType).optional(),
  flowId: z.string().optional(),
})

// Action: navigateToDraft (platform not needed)
const FullContentNavigateToDraftActionSchema = FullContentElementBaseSchema.extend({
  action: z.literal('navigateToDraft'),
  groupId: z.string(),
  platform: z.enum(AccountType).optional(),
})

// Action: navigateToMedia (platform not needed)
const FullContentNavigateToMediaActionSchema = FullContentElementBaseSchema.extend({
  action: z.literal('navigateToMedia'),
  mediaId: z.string(),
  groupId: z.string(),
  platform: z.enum(AccountType).optional(),
})

// Action: createChannel (platform required)
const FullContentCreateChannelActionSchema = FullContentElementBaseSchema.extend({
  action: z.literal('createChannel'),
  platform: z.enum(AccountType), // required
  errorMessage: z.string().optional(),
})

// Action: updateChannel (platform required)
const FullContentUpdateChannelActionSchema = FullContentElementBaseSchema.extend({
  action: z.literal('updateChannel'),
  platform: z.enum(AccountType), // required
  accountId: z.string().optional(),
  errorMessage: z.string().optional(),
})

// Action: navigateToPublish (platform required)
const FullContentNavigateToPublishActionSchema = FullContentElementBaseSchema.extend({
  action: z.literal('navigateToPublish'),
  platform: z.enum(AccountType), // required
  accountId: z.string().optional(),
  publishTime: z.iso.datetime().optional(),
  topics: z.array(z.string()).optional(),
  errorMessage: z.string().optional(),
})

// FullContent single element union
const FullContentElementSchema = z.discriminatedUnion('action', [
  FullContentNoneActionSchema,
  FullContentNavigateToDraftActionSchema,
  FullContentNavigateToMediaActionSchema,
  FullContentCreateChannelActionSchema,
  FullContentUpdateChannelActionSchema,
  FullContentNavigateToPublishActionSchema,
])

// FullContent result is an array (minimum 1 element)
const FullContentResultSchema = z.array(FullContentElementSchema).min(1)

// Final union: mediaOnly (single object) OR fullContent (array)
export const ContentGenerationTaskResultUnionSchema = z.union([
  MediaOnlyResultSchema,
  FullContentResultSchema,
])

export const ContentGenerationTaskResultSchema = z.object({
  result: ContentGenerationTaskResultUnionSchema,
})

const APIUserMessageSchema = z.object({
  content: z.union([z.string(), z.array(z.unknown())]), // string | Array<ContentBlockParam>
  role: z.enum(['user', 'assistant']),
})

const APIAssistantMessageSchema = z.object({
  id: z.string().optional(),
  content: z.array(z.unknown()).optional(), // Array<BetaContentBlock>
  model: z.string().optional(),
  role: z.literal('assistant').optional(),
  stop_reason: z.enum(['end_turn', 'max_tokens', 'stop_sequence', 'tool_use', 'pause_turn', 'refusal']).nullable().optional(),
  stop_sequence: z.string().nullable().optional(),
  type: z.literal('message').optional(),
  usage: z.object({
    cache_creation: z.object({
      ephemeral_1h_input_tokens: z.number().optional(),
      ephemeral_5m_input_tokens: z.number().optional(),
    }).nullable().optional(),
    cache_creation_input_tokens: z.number().nullable().optional(),
    cache_read_input_tokens: z.number().nullable().optional(),
    input_tokens: z.number().optional(),
    output_tokens: z.number().optional(),
    server_tool_use: z.object({
      web_search_requests: z.number(),
    }).nullable().optional(),
    service_tier: z.string().nullable().optional(), // 允许 service_tier 字段
  }).loose().optional(), // 使用 passthrough 允许额外字段
  container: z.unknown().nullable().optional(), // BetaContainer
  context_management: z.unknown().nullable().optional(), // BetaContextManagementResponse
}).loose() // 允许额外字段

const NonNullableUsageSchema = z.object({
  cache_creation: z.object({
    ephemeral_1h_input_tokens: z.number(),
    ephemeral_5m_input_tokens: z.number(),
  }).optional(),
  cache_creation_input_tokens: z.number().optional(),
  cache_read_input_tokens: z.number().optional(),
  input_tokens: z.number().optional(),
  output_tokens: z.number().optional(),
  server_tool_use: z.object({
    web_search_requests: z.number(),
  }).optional(),
})

const RawMessageStreamEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('message_start'),
    message: z.unknown(),
  }),
  z.object({
    type: z.literal('message_delta'),
    delta: z.object({
      stop_reason: z.string().nullable().optional(),
      stop_sequence: z.string().nullable().optional(),
    }).optional(),
    usage: z.object({
      cache_creation_input_tokens: z.number().nullable().optional(),
      cache_read_input_tokens: z.number().nullable().optional(),
      input_tokens: z.number().nullable().optional(),
      output_tokens: z.number().optional(),
      server_tool_use: z.object({
        web_search_requests: z.number(),
      }).nullable().optional(),
    }).loose().optional(),
  }),
  z.object({
    type: z.literal('message_stop'),
  }),
  z.object({
    type: z.literal('content_block_start'),
    index: z.number(),
    content_block: z.unknown(),
  }),
  z.object({
    type: z.literal('content_block_delta'),
    index: z.number(),
    delta: z.unknown(),
  }),
  z.object({
    type: z.literal('content_block_stop'),
    index: z.number(),
  }),
])

const SDKUserMessageSchema = z.object({
  type: z.literal(AgentMessageType.User),
  uuid: z.string().optional(),
  message: APIUserMessageSchema.optional(),
  content: z.union([z.string(), z.array(z.unknown())]).optional(),
  parent_tool_use_id: z.string().nullable().optional(),
  isSynthetic: z.boolean().optional(),
  tool_use_result: z.unknown().optional(),
  isReplay: z.literal(true).optional(),
})

const SDKAssistantMessageSchema = z.object({
  type: z.literal(AgentMessageType.Assistant),
  uuid: z.string(),
  message: APIAssistantMessageSchema.optional(),
  parent_tool_use_id: z.string().nullable().optional(),
  error: z.enum(['authentication_failed', 'billing_error', 'rate_limit', 'invalid_request', 'server_error', 'unknown']).optional(),
})

const SDKResultMessageSuccessSchema = z.object({
  type: z.literal(AgentMessageType.Result),
  subtype: z.literal('success'),
  uuid: z.string(),
  duration_ms: z.number().optional(),
  duration_api_ms: z.number().optional(),
  is_error: z.boolean().optional(),
  num_turns: z.number().optional(),
  message: z.string().optional(),
  result: ContentGenerationTaskResultUnionSchema.nullable().optional(),
  total_cost_usd: z.number().optional(),
  usage: NonNullableUsageSchema.optional(),
  permission_denials: z.array(z.object({
    tool_name: z.string(),
    tool_use_id: z.string(),
    tool_input: z.record(z.string(), z.unknown()),
  })).optional(),
  structured_output: z.unknown().optional(),
})

const SDKResultMessageErrorSchema = z.object({
  type: z.literal(AgentMessageType.Result),
  subtype: z.enum(['error_during_execution', 'error_max_turns', 'error_max_budget_usd', 'error_max_structured_output_retries']),
  uuid: z.string(),
  duration_ms: z.number().optional(),
  duration_api_ms: z.number().optional(),
  is_error: z.boolean().optional(),
  num_turns: z.number().optional(),
  total_cost_usd: z.number().optional(),
  usage: NonNullableUsageSchema.optional(),
  permission_denials: z.array(z.object({
    tool_name: z.string(),
    tool_use_id: z.string(),
    tool_input: z.record(z.string(), z.unknown()),
  })).optional(),
  errors: z.array(z.string()).optional(),
})

const SDKResultMessageSchema = z.discriminatedUnion('subtype', [
  SDKResultMessageSuccessSchema,
  SDKResultMessageErrorSchema,
])

const SDKCompactBoundaryMessageSchema = z.object({
  type: z.literal(AgentMessageType.System),
  subtype: z.literal('compact_boundary'),
  uuid: z.string(),
  compact_metadata: z.object({
    trigger: z.enum(['manual', 'auto']),
    pre_tokens: z.number(),
  }).optional(),
})

const SDKStatusMessageSchema = z.object({
  type: z.literal(AgentMessageType.System),
  subtype: z.literal('status'),
  uuid: z.string(),
  status: z.enum(['compacting']).nullable().optional(),
})

const SDKHookResponseMessageSchema = z.object({
  type: z.literal(AgentMessageType.System),
  subtype: z.literal('hook_response'),
  uuid: z.string(),
  hook_name: z.string().optional(),
  hook_event: z.string().optional(),
  stdout: z.string().optional(),
  stderr: z.string().optional(),
  exit_code: z.number().optional(),
})

const SDKSystemMessageSchema = z.discriminatedUnion('subtype', [
  SDKCompactBoundaryMessageSchema,
  SDKStatusMessageSchema,
  SDKHookResponseMessageSchema,
])

const SDKPartialAssistantMessageSchema = z.object({
  type: z.literal(AgentMessageType.StreamEvent),
  uuid: z.string(),
  event: RawMessageStreamEventSchema.optional(),
  parent_tool_use_id: z.string().nullable().optional(),
})

const SDKToolProgressMessageSchema = z.object({
  type: z.literal(AgentMessageType.ToolProgress),
  uuid: z.string(),
  tool_use_id: z.string().optional(),
  tool_name: z.string().optional(),
  parent_tool_use_id: z.string().nullable().optional(),
  elapsed_time_seconds: z.number().optional(),
})

const SDKAuthStatusMessageSchema = z.object({
  type: z.literal(AgentMessageType.AuthStatus),
  uuid: z.string(),
  isAuthenticating: z.boolean().optional(),
  output: z.array(z.string()).optional(),
  error: z.string().optional(),
})

const SDKErrorMessageSchema = z.object({
  type: z.literal(AgentMessageType.Error),
  code: z.number(),
  message: z.string(),
  data: z.unknown().optional(),
  timestamp: z.number(),
})

export const AgentMessageVoSchema = z.discriminatedUnion('type', [
  SDKUserMessageSchema,
  SDKAssistantMessageSchema,
  SDKResultMessageSchema,
  SDKSystemMessageSchema,
  SDKPartialAssistantMessageSchema,
  SDKToolProgressMessageSchema,
  SDKAuthStatusMessageSchema,
  SDKErrorMessageSchema,
])

export type AgentMessageVo = z.infer<typeof AgentMessageVoSchema>

export const AgentMessageVoHelper = {
  create: (input: unknown): AgentMessageVo => {
    return AgentMessageVoSchema.parse(input)
  },
}

export const ContentGenerationTaskVoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  title: z.string().optional(),
  messages: z.array(AgentMessageVoSchema).optional(),
  status: z.enum(ContentGenerationTaskStatus),
  rating: z.number().int().min(1).max(5).optional(),
  ratingComment: z.string().optional(),
  favoritedAt: z.date().nullable().optional(),
})
export class ContentGenerationTaskVo extends createZodDto(ContentGenerationTaskVoSchema) { }

export const ContentGenerationTaskListItemVoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string().optional(),
  status: z.enum(ContentGenerationTaskStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
  rating: z.number().int().min(1).max(5).optional(),
  ratingComment: z.string().optional(),
  favoritedAt: z.date().nullable().optional(),
})
export class ContentGenerationTaskListItemVo extends createZodDto(ContentGenerationTaskListItemVoSchema) { }

export class ContentGenerationTaskListVo extends createPaginationVo(ContentGenerationTaskListItemVoSchema, 'ContentGenerationTaskListVo') { }

export const ContentGenerationTaskInitChunkVoSchema = z.object({
  type: z.literal(AgentMessageType.Init),
  taskId: z.string(),
  messages: z.array(AgentMessageVoSchema).optional(),
})
export class ContentGenerationTaskInitChunkVo extends createZodDto(ContentGenerationTaskInitChunkVoSchema) { }

export const ContentGenerationTaskKeepAliveChunkVoSchema = z.object({
  type: z.literal(AgentMessageType.KeepAlive),
})
export class ContentGenerationTaskKeepAliveChunkVo extends createZodDto(ContentGenerationTaskKeepAliveChunkVoSchema) { }

export const ContentGenerationTaskTitleUpdatedChunkVoSchema = z.object({
  type: z.literal(AgentMessageType.TitleUpdated),
  taskId: z.string(),
  title: z.string(),
})
export class ContentGenerationTaskTitleUpdatedChunkVo extends createZodDto(ContentGenerationTaskTitleUpdatedChunkVoSchema) { }

export const ContentGenerationTaskErrorChunkVoSchema = z.object({
  type: z.literal(AgentMessageType.Error),
  code: z.number(),
  message: z.string(),
  data: z.unknown().optional(),
  timestamp: z.number(),
})
export class ContentGenerationTaskErrorChunkVo extends createZodDto(ContentGenerationTaskErrorChunkVoSchema) { }

export const ContentGenerationTaskAgentChunkVoSchema = z.object({
  type: z.enum([
    AgentMessageType.Assistant,
    AgentMessageType.User,
    AgentMessageType.Result,
    AgentMessageType.System,
    AgentMessageType.StreamEvent,
    AgentMessageType.ToolProgress,
    AgentMessageType.AuthStatus,
  ]),
  message: AgentMessageVoSchema,
})
export class ContentGenerationTaskAgentChunkVo extends createZodDto(ContentGenerationTaskAgentChunkVoSchema) { }

export type ContentGenerationTaskChunkVo
  = | ContentGenerationTaskInitChunkVo
    | ContentGenerationTaskKeepAliveChunkVo
    | ContentGenerationTaskTitleUpdatedChunkVo
    | ContentGenerationTaskAgentChunkVo
    | ContentGenerationTaskErrorChunkVo

export const ContentGenerationTaskChunkVoSchema = z.discriminatedUnion('type', [
  ContentGenerationTaskInitChunkVoSchema,
  ContentGenerationTaskKeepAliveChunkVoSchema,
  ContentGenerationTaskTitleUpdatedChunkVoSchema,
  ContentGenerationTaskAgentChunkVoSchema,
  ContentGenerationTaskErrorChunkVoSchema,
])

export const TaskMessagesVoSchema = z.object({
  messages: z.array(AgentMessageVoSchema),
  status: z.enum(ContentGenerationTaskStatus),
})
export class TaskMessagesVo extends createZodDto(TaskMessagesVoSchema, 'TaskMessagesVo') { }

export const PublicShareVoSchema = z.object({
  token: z.string(),
  expiresAt: z.date(),
})
export class PublicShareVo extends createZodDto(PublicShareVoSchema, 'PublicShareVo') { }
