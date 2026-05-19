export enum ResponseCode {
  Success = 0,

  // ========================================
  // 10000-11999: 基础设施层 (libs)
  // ========================================

  // 10000-10099: common（公共库）
  MailSendFail = 10001,
  ValidationFailed = 10002,
  SmsSendFail = 10004,
  DevOnlyEndpoint = 10005,

  // 10100-10199: s3/aws-s3/gcs
  S3DownloadFileFailed = 10100,
  S3UploadFailed = 10101,
  InvalidGcsUri = 10102,

  // ========================================
  // 12000-12999: aitoearn-server（主服务）
  // ========================================

  // 12000-12099: user（用户模块）
  UserNotFound = 12000,
  UserStorageExceeded = 12002,
  UserStatusError = 12003,
  UserPasswordError = 12004,
  UserLoginCodeError = 12005,
  UserAlreadyExists = 12007,
  UserBanned = 12008,
  UserMembershipExpired = 12009,
  GetUserTokenFailed = 12010,
  UserAlreadyHasLibrary = 12011,
  UserNoLibrary = 12012,

  // 12300-12399: ai（AI 模块）
  InvalidModel = 12300,
  AiCallFailed = 12301,
  InvalidAiTaskId = 12302,
  AiLogNotFound = 12303,
  VideoUploadInvalidInput = 12304,
  VideoUploadJobIdNotFound = 12305,
  VideoUploadTaskInfoNotFound = 12306,
  VideoUploadVidNotFound = 12307,
  VideoUploadFailed = 12308,
  DraftGenerationMemoryNotFound = 12309,

  // 12400-12499: notification（通知）
  NotificationNotFound = 12400,

  // 12500-12599: app-release（应用发布）
  AppReleaseNotFound = 12500,
  AppReleaseAlreadyExists = 12501,
  StatusPageIncidentNotFound = 12510,

  // 12600-12699: account（社交账号）
  AccountNotFound = 12600,
  AccountGroupNotFound = 12601,
  AccountStatisticsNotFound = 12602,
  AccountGroupCountryCodeInvalid = 12603,
  AccountCreateFailed = 12604,
  AccountRefreshTooFrequent = 12605,
  AccountRefreshNotSupported = 12606,

  // 12700-12799: media（媒体文件）
  MediaNotFound = 12700,
  MediaGroupNotFound = 12701,
  MediaGroupDefaultNotAllowed = 12702,

  // 12750-12799: assets（资源模块）
  AssetNotFound = 12750,
  AssetUploadFailed = 12751,
  AssetTooLarge = 12752,

  // 12800-12899: material（素材）
  MaterialNotFound = 12800,
  MaterialGroupNotFound = 12801,
  MaterialGroupDefaultNotAllowed = 12803,

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
  ChannelCredentialNotFound = 15006,
  ChannelRefreshTokenNotFound = 15007,
  ChannelRefreshTokenExpired = 15008,
  ChannelRefreshTokenFailed = 15009,
  ChannelAccessTokenFailed = 15010,
  ChannelPlatformTokenNotFound = 15011,
  ChannelAuthTaskFailed = 15012,
  ChannelAuthorizationFailed = 15013,
  ChannelNoAccountsFound = 15014,
  PublishServiceNotFound = 15015,
  PublishTaskFailed = 15016,
  PublishTaskInProgress = 15017,
  PublishTaskStatusInvalid = 15018,
  PublishTimeInvalid = 15019,
  EngagementTaskInProgress = 15020,
  ChannelAccountNotFound = 15021,
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
  PublishTaskInvalid = 15035,
  // 解析链接，获取视频ID
  InvalidWorkLink = 15036,
  // 作品不属于该账号
  WorkNotBelongToAccount = 15037,
  PublishResourceUnavailable = 15038,

  // 15100-15199: short-link（短链接）
  ShortLinkNotFound = 15100,
  ShortLinkExpired = 15101,

  // 16000-16099: work validation（作品校验）
  WorkAlreadyDeleted = 16021,
  WorkDataIdNotFound = 16023,
  WorkLinkInfoNotFound = 16025,
  WorkDetailNotFound = 16026,
  AccountAuthRequired = 16037,
  MaterialGroupPlatformMismatch = 16052,

  // 18100-18199: agent（代理服务）
  AgentTaskNotFound = 18100,
  AgentTaskStatusInvalid = 18101,
  GenerateImagesFailed = 18102,
  GenerateVideosFailed = 18103,
  AgentTaskFailed = 18104,
  DailyTaskQuotaExceeded = 18105,
  GenerateContentFailed = 18106,
  AgentTaskTimeout = 18107,
  AgentTaskNotRunning = 18108,
  AgentSessionRecoveryFailed = 18109,
  AgentAnalysisNotFound = 18110,
  AgentWeekSummaryNotFound = 18111,

  // 18300-18399: place-draft（地点草稿）
  PlaceDraftNotFound = 18300,

  // 18400-18499: tools（工具模块）
  QrCodeArtImageNotFound = 18400,

  // ========================================
  // 19000-19099: api-key / relay
  // ========================================
  ApiKeyInvalid = 19000,
  RelayServerUnavailable = 19001,
}
