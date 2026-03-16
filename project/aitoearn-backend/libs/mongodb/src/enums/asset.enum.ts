export enum AssetType {
  // AI 生成
  AiImage = 'aiImage',
  AiVideo = 'aiVideo',
  AiCard = 'aiCard',
  AiChatImage = 'aiChatImage',

  // Aideo/视频编辑
  AideoOutput = 'aideoOutput',
  VideoEdit = 'videoEdit',
  DramaRecap = 'dramaRecap',
  StyleTransfer = 'styleTransfer',
  ImageEdit = 'imageEdit',
  Subtitle = 'subtitle',

  // 用户上传
  UserMedia = 'userMedia',
  UserFile = 'userFile',

  // 发布内容
  PublishMedia = 'publishMedia',

  // 社交
  Avatar = 'avatar',

  // Agent
  AgentSession = 'agentSession',

  // 视频缩略图
  VideoThumbnail = 'videoThumbnail',

  // 临时
  Temp = 'temp',
}

export enum AssetStatus {
  Pending = 'pending',
  Uploaded = 'uploaded',
  Confirmed = 'confirmed',
  Failed = 'failed',
}
