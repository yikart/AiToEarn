export enum AiLogType {
  Chat = 'chat',
  Image = 'image',
  /** @deprecated Removed feature, kept for DB backward compatibility */
  Card = 'card',
  Video = 'video',
  Agent = 'agent',
  Aideo = 'aideo',
  Crawler = 'crawler',
  StyleTransfer = 'style-transfer',
  VideoEdit = 'video-edit',
  DraftGeneration = 'draft-generation',
}

export enum AiLogStatus {
  Generating = 'generating',
  Success = 'success',
  Failed = 'failed',
}

export enum AiLogSettlementStatus {
  Pending = 'pending',
  Settled = 'settled',
  Failed = 'failed',
  Refunded = 'refunded',
}

export enum AiLogSettlementBillingMode {
  Fixed = 'fixed',
  Token = 'token',
}

export enum AiLogSettlementType {
  AsyncSuccessDeltaDeduct = 'async-success-delta-deduct',
  AsyncSuccessDeltaRefund = 'async-success-delta-refund',
}

export enum AiLogSettlementTaskType {
  Generation = 'generation',
  Edit = 'edit',
  QrCodeArt = 'qr-code-art',
}

export enum AiLogSettlementRefundReason {
  AiTaskFailed = 'ai-task-failed',
}

export enum AiLogSettlementSettledBy {
  OpenAICallback = 'openai-callback',
  GrokCallback = 'grok-callback',
  GeminiCallback = 'gemini-callback',
  VolcengineCallback = 'volcengine-callback',
  DashscopeCallback = 'dashscope-callback',
  AiTaskRefundQueue = 'ai-task-refund-queue',
  ImageAsyncConsumer = 'image-async-consumer',
}

export enum AiLogChannel {
  NewApi = 'new-api',
  /** @deprecated Removed feature, kept for DB backward compatibility */
  Md2Card = 'md2card',
  /** @deprecated Removed feature, kept for DB backward compatibility */
  FireflyCard = 'fireflyCard',
  /** @deprecated Removed feature, kept for DB backward compatibility */
  Kling = 'kling',
  Volcengine = 'volcengine',
  Dashscope = 'dashscope',
  /** @deprecated Removed feature, kept for DB backward compatibility */
  Sora2 = 'sora2',
  OpenAI = 'openai',
  ClaudeAgent = 'claude-agent',
  Crawler = 'crawler',
  StyleTransfer = 'style-transfer',
  Anthropic = 'anthropic',
  Gemini = 'gemini',
  Grok = 'grok',
}
