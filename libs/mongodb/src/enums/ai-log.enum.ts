export enum AiLogType {
  Chat = 'chat',
  Image = 'image',
  Card = 'card',
  Video = 'video',
}

export enum AiLogStatus {
  Generating = 'generating',
  Success = 'success',
  Failed = 'failed',
}

export enum AiLogChannel {
  NewApi = 'new-api',
  Md2Card = 'md2card',
  FireflyCard = 'fireflyCard',
  Kling = 'kling',
  Volcengine = 'volcengine',
}
