export enum ResponseCode {
  Success = 0,

  // ========================================
  // 10000-11999: 基础设施层 (libs)
  // ========================================

  // 10000-10099: common（公共库）
  MailSendFail = 10001,
  ValidationFailed = 10002,

  // 10100-10199: s3/aws-s3
  S3DownloadFileFailed = 10100,
  S3UploadFailed = 10101,

  // ========================================
  // 12000-12999: aitoearn-server（主服务）
  // ========================================

  // 12000-12099: user（用户模块）
  UserNotFound = 12000,
  UserPointsInsufficient = 12001,
  UserStorageExceeded = 12002,
  UserStatusError = 12003,
  UserPasswordError = 12004,
  UserLoginCodeError = 12005,
  UserInviteCodeError = 12006,
  UserAlreadyExists = 12007,
  UserBanned = 12008,
  UserMembershipExpired = 12009,
  GetUserTokenFailed = 12010,

  // 12300-12399: ai（AI 模块）
  InvalidModel = 12300,
  AiCallFailed = 12301,
  InvalidAiTaskId = 12302,
  AiLogNotFound = 12303,

  // 12400-12499: notification（通知）
  NotificationNotFound = 12400,

  // 12600-12699: account（社交账号）
  AccountNotFound = 12600,
  AccountGroupNotFound = 12601,
  AccountStatisticsNotFound = 12602,
  AccountGroupCountryCodeInvalid = 12603,

  // 12700-12799: media（媒体文件）
  MediaNotFound = 12700,
  MediaGroupNotFound = 12701,

  // 12800-12899: material（素材）
  MaterialNotFound = 12800,
  MaterialGroupNotFound = 12801,
  MaterialTaskNotFound = 12802,

  // 12900-12999: content（内容组合）
  MaterialGroupEmpty = 12900,
  MaterialGroupTypeError = 12901,
  MediaGroupTypeNotSupported = 12902,
  GroupInfoNotFound = 12903,

  // ========================================
  // 15000-15999: aitoearn-channel（渠道服务）
  // ========================================

  // 15000-15099: channel/publish（渠道发布相关）
  PublishRecordNotFound = 15000,
  ChannelAccountNotAuthorized = 15001,
  ChannelAuthorizationExpired = 15002,
  ChannelAccountInfoFailed = 15003,
  PublishTaskNotFound = 15004,
  ChannelWebhookFailed = 15005,
  ChannelCredentialNotFound = 15006,
  ChannelRefreshTokenNotFound = 15007,
  ChannelRefreshTokenExpired = 15008,
  ChannelRefreshTokenFailed = 15009,
  ChannelAccessTokenFailed = 15010,
  ChannelPlatformTokenNotFound = 15011,
  ChannelAuthTaskFailed = 15012,
  ChannelSkKeyRequired = 15013,
  ChannelNoAccountsFound = 15014,
  PublishServiceNotFound = 15015,
  PublishTaskFailed = 15016,
  PublishTaskInProgress = 15017,
  PublishTaskStatusInvalid = 15018,
  PublishTimeInvalid = 15019,
  EngagementTaskInProgress = 15020,
  SkKeyAccountNotFound = 15021,
  InteractAccountTypeNotSupported = 15022,
  InteractRecordNotFound = 15023,
  DataCubeAccountTypeNotSupported = 15024,
  ChannelPublishTaskAlreadyExists = 15025,
  PublishTaskAlreadyPublishing = 15026,
  PublishTaskAlreadyCompleted = 15027,
  PublishTaskNotPublished = 15028,
  PublishTaskAlreadyUpdating = 15029,
  PublishTaskAlreadyWaitingForUpdate = 15030,
  PostCategoryNotSupported = 15031,
  PlatformNotSupported = 15032,
  PublishTaskUpdateFailed = 15033,
  DeletePostFailed = 15034,
}
