// Re-export enums from shared lib (canonical source)
export { AiLogChannel, AiLogStatus, AiLogType, VolcengineContentType, VolcengineImageRole, VolcengineTaskStatus } from '@yikart/aitoearn-ai-shared'

// Re-export zod-based DTOs/VOs from shared lib
export {
  AiLogSettlementMetadataVo,
  AiLogSettlementVo,
  AsyncTaskResponseVo,
  // Chat DTOs
  ChatCompletionDto,
  // Chat VOs
  ChatCompletionVo,
  ChatMessageDto,
  ChatModelConfigVo,
  ChatModelsQueryDto,
  ImageEditDto,
  ImageEditModelParamsVo,
  ImageEditModelsQueryDto,
  // Image DTOs
  ImageGenerationDto,
  ImageGenerationModelParamsVo,
  ImageGenerationModelsQueryDto,
  // Image VOs
  ImageResponseVo,
  ListVideoTasksQueryDto,
  ListVideoTasksResponseVo,
  InternalLogDetailQueryDto as LogDetailQueryDto,
  LogDetailResponseVo as LogDetailVo,
  // Logs DTOs
  InternalLogListQueryDto as LogListQueryDto,
  LogsListResponseVo,
  // Logs VOs
  LogItemVo as LogVo,
  // Models Config
  ModelsConfigVo,
  QrCodeArtDto,
  QrCodeArtResponseVo,
  TaskStatusResponseVo,
  UserChatCompletionDto,
  UserImageEditDto,
  UserImageGenerationDto,
  UserListVideoTasksQueryDto,
  UserQrCodeArtDto,
  UserVideoGenerationRequestDto,
  UserVideoTaskQueryDto,
  UserVolcengineGenerationRequestDto,
  VideoGenerationModelParamsVo,
  VideoGenerationModelsQueryDto,
  // Video DTOs
  VideoGenerationRequestDto,
  // Video VOs
  VideoGenerationResponseVo,
  VideoTaskQueryDto,
  VideoTaskStatusResponseVo,
  // Volcengine DTOs
  VolcengineGenerationRequestDto,
  VolcengineTaskStatusResponseVo,
  // Volcengine VOs
  VolcengineVideoGenerationResponseVo,
} from '@yikart/aitoearn-ai-shared'

export {
  aiLogSettlementMetadataSchema,
  aiLogSettlementSchema,
} from '@yikart/aitoearn-ai-shared'

export type {
  AiLogSettlement,
  AiLogSettlementMetadata,
} from '@yikart/aitoearn-ai-shared'

export {
  ChatCompletionChunkVo,
  ChatMessage,
  MessageContent,
  ModelsConfigDto,
  VideoTaskInput,
} from '@yikart/aitoearn-ai-shared'
