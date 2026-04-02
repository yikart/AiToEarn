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

export enum AiLogChannel {
  NewApi = 'new-api',
  /** @deprecated Removed feature, kept for DB backward compatibility */
  Md2Card = 'md2card',
  /** @deprecated Removed feature, kept for DB backward compatibility */
  FireflyCard = 'fireflyCard',
  /** @deprecated Removed feature, kept for DB backward compatibility */
  Kling = 'kling',
  Volcengine = 'volcengine',
  /** @deprecated Removed feature, kept for DB backward compatibility */
  Dashscope = 'dashscope',
  /** @deprecated Removed feature, kept for DB backward compatibility */
  Sora2 = 'sora2',
  OpenAI = 'openai',
  ClaudeAgent = 'claude-agent',
  Crawler = 'crawler',
  StyleTransfer = 'style-transfer',
  Gemini = 'gemini',
  /** @deprecated Removed feature, kept for DB backward compatibility */
  Jimeng = 'jimeng',
  Grok = 'grok',
}
