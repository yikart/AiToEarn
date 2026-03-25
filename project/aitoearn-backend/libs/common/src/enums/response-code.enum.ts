export enum ResponseCode {
  Success = 0,

  // ========================================
  // 10000-11999: 基础设施层 (libs)
  // ========================================

  // 10000-10099: common（公共库）
  MailSendFail = 10001,
  ValidationFailed = 10002,
  TooManyRequests = 10003,
  SmsSendFail = 10004,

  // 10100-10199: s3/aws-s3/gcs
  S3DownloadFileFailed = 10100,

  // ========================================
  // 12000-12999: aitoearn-server（主服务）
  // ========================================

  // 12000-12099: user（用户模块）
  UserNotFound = 12000,
  UserCreditsInsufficient = 12001,
  UserStatusError = 12003,
  UserLoginCodeError = 12005,

  // 12300-12399: ai（AI 模块）
  InvalidModel = 12300,
  AiCallFailed = 12301,
  InvalidAiTaskId = 12302,
  AiLogNotFound = 12303,
  VideoUploadVidNotFound = 12307,
  VideoUploadFailed = 12308,

  // 12400-12499: notification（通知）
  NotificationNotFound = 12400,

  // 12600-12699: account（社交账号）
  AccountNotFound = 12600,
  AccountGroupNotFound = 12601,
  AccountCreateFailed = 12604,

  // 12700-12799: media（媒体文件）
  MediaNotFound = 12700,
  MediaGroupNotFound = 12701,
  MediaGroupDefaultNotAllowed = 12702,

  // 12750-12799: assets（资源模块）
  AssetNotFound = 12750,
  AssetUploadFailed = 12751,

  // 12800-12899: material（素材）
  MaterialNotFound = 12800,
  MaterialGroupNotFound = 12801,
  MaterialGroupDefaultNotAllowed = 12803,
  MaterialAdaptationNotFound = 12804,
  MaterialAdaptationFailed = 12805,

  // ========================================
  // 15000-15999: aitoearn-channel（渠道服务）
  // ========================================

  // 15000-15099: channel/publish（渠道发布相关）
  PublishRecordNotFound = 15000,
  ChannelAuthorizationExpired = 15002,
  ChannelAccountInfoFailed = 15003,
  PublishTaskNotFound = 15004,
  ChannelWebhookFailed = 15005,
  ChannelRefreshTokenFailed = 15009,
  ChannelAccessTokenFailed = 15010,
  ChannelPlatformTokenNotFound = 15011,
  ChannelAuthTaskFailed = 15012,
  PublishTaskFailed = 15016,
  PublishTaskInProgress = 15017,
  PublishTaskStatusInvalid = 15018,
  EngagementTaskInProgress = 15020,
  ChannelAccountNotFound = 15021,
  InteractAccountTypeNotSupported = 15022,
  InteractRecordNotFound = 15023,
  DataCubeAccountTypeNotSupported = 15024,
  ChannelPublishTaskAlreadyExists = 15025,
  PublishTaskNotPublished = 15028,
  PostCategoryNotSupported = 15031,
  PlatformNotSupported = 15032,
  PublishTaskUpdateFailed = 15033,
  DeletePostFailed = 15034,
  PublishTaskInvalid = 15035,
  InvalidWorkLink = 15036,
  WorkNotBelongToAccount = 15037,

  // 15100-15199: short-link（短链接）
  ShortLinkNotFound = 15100,

  // ========================================
  // 16000-16999: aitoearn-task（任务服务）
  // ========================================

  WorkDetailNotFound = 16026,
  AccountAuthRequired = 16037,

  // 16050-16099: task-material（任务素材）
  MaterialGroupPlatformMismatch = 16052,

  // ========================================
  // 18000-18999: aitoearn-ai（AI 服务）
  // ========================================

  // 18100-18199: agent（代理服务）
  AgentTaskNotFound = 18100,
  AgentTaskStatusInvalid = 18101,
  AgentTaskFailed = 18104,
  AgentTaskTimeout = 18107,
  AgentTaskNotRunning = 18108,
  AgentSessionRecoveryFailed = 18109,

  // 18400-18499: tools（工具模块）
  QrCodeArtImageNotFound = 18400,

  // ========================================
  // 19000-19099: api-key / relay
  // ========================================
  ApiKeyInvalid = 19000,
  RelayServerUnavailable = 19001,
}
