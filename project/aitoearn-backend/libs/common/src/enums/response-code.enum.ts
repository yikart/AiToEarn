export enum ResponseCode {
  Success = 0,

  // ========================================
  // 10000-11999: 基础设施层 (libs)
  // ========================================

  // 10000-10099: common（公共库）
  ValidationFailed = 10002,
  DevOnlyEndpoint = 10005,

  // 10100-10199: s3/aws-s3/gcs
  S3DownloadFileFailed = 10100,
  S3UploadFailed = 10101,
  InvalidGcsUri = 10102,

  // 10150-10199: config-editor（配置编辑）
  ConfigEditorUnsupportedFormat = 10150,
  ConfigEditorParseFailed = 10151,
  ConfigEditorValidationFailed = 10152,
  ConfigEditorReadFailed = 10153,
  ConfigEditorWriteFailed = 10154,
  ConfigEditorConfigPathMissing = 10155,
  ConfigEditorPm2Unavailable = 10156,
  ConfigEditorRestartFailed = 10157,

  // ========================================
  // 12000-12999: aitoearn-server（主服务）
  // ========================================

  // 12000-12099: user（用户模块）
  UserNotFound = 12000,
  UserStorageExceeded = 12002,
  UserStatusError = 12003,

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
  // 13000-13999: aitoearn-admin-server（管理后台）
  // ========================================

  // 13200-13299: admin-operation（管理后台操作）
  AdminOperationPasswordError = 13200,

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
  ChannelAuthSessionInvalid = 15039,
  ChannelAuthPlatformMismatch = 15040,
  ChannelAuthSessionCompleted = 15041,
  ChannelAuthCsrfInvalid = 15042,
  ChannelAuthSelectableAccountsNotFound = 15043,
  ChannelAuthCodeMissing = 15045,
  ChannelAuthRefreshTokenMissing = 15046,
  ChannelAuthPlatformUidMissing = 15047,
  ChannelAuthAccountAccessRevoked = 15048,
  ChannelAuthCodeOrStateMissing = 15049,
  PublishFlowNotFound = 15050,
  ChannelPublishValidationFailed = 15051,
  ChannelPublishDuplicateItem = 15052,
  ChannelPublishQueueRemoveFailed = 15053,
  ChannelPublishPlatformCancelFailed = 15054,
  ChannelPublishCancelNotSupported = 15055,
  ChannelPublishQueueFailed = 15056,
  ChannelPublishTimeUpdateNotAllowed = 15057,
  ChannelPublishNowNotAllowed = 15058,
  ChannelPublishUpdateNotAllowed = 15059,
  ChannelPublishPlatformWorkIdMissing = 15060,
  ChannelPublishUpdateNotSupported = 15061,
  ChannelPublishPlatformNotSupported = 15062,
  ChannelPublishPlatformStatusFailed = 15063,
  ChannelWebhookNotSupported = 15064,
  ChannelWebhookChallengeNotSupported = 15065,
  ChannelWebhookInvalidSignature = 15066,
  ChannelWebhookInvalidVerifyToken = 15067,
  ChannelWebhookChallengeCodeMissing = 15068,
  ChannelWebhookPublishFailed = 15069,
  ChannelPlatformApiFailed = 15070,
  ChannelPlatformRateLimited = 15071,
  ChannelPlatformResponseInvalid = 15072,
  ChannelPlatformMediaUnsupported = 15073,
  ChannelPlatformMediaProcessingFailed = 15074,
  ChannelPlatformMediaProcessingTimeout = 15075,
  ChannelPlatformAccountMissing = 15076,
  ChannelPlatformPublishOptionMissing = 15077,
  ChannelPlatformPermissionMissing = 15078,
  ChannelPlatformWorkNotFound = 15079,
  ChannelPlatformOperationNotSupported = 15080,
  ChannelAccountCreateNotSupported = 15081,
  ChannelAccountAlreadyConnectedToAnotherUser = 15082,
  ChannelAuthSelectionRequired = 15083,
  ChannelAuthSelectedAccountUnavailable = 15084,
  ChannelOAuthIdentityAlreadyConnectedToAnotherUser = 15085,
  ChannelOAuthUserAlreadyConnectedToAnotherIdentity = 15086,
  ChannelPublishMixedRelayAndLocalAccounts = 15087,
  ChannelPaginationModeNotSupported = 15088,
  ChannelPaginationLimitExceeded = 15089,
  ChannelPaginationPageSizeExceeded = 15090,
  ChannelPaginationDirectionNotSupported = 15091,
  ChannelAccountCreateRequiredFieldMissing = 15092,
  ChannelPublishPermalinkMissing = 15093,
  ChannelPlatformServiceUnavailable = 15094,
  ChannelPublishRetryNotAllowed = 15095,

  // 15100-15199: short-link（短链接）
  ShortLinkNotFound = 15100,
  ShortLinkExpired = 15101,

  // 16000-16099: channel/work（作品辅助）
  WorkDetailNotFound = 16026, // 作品详情未找到
  AccountAuthRequired = 16037, // 该平台需要先授权账号

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

  // 18300-18399: place-draft（地点草稿）
  PlaceDraftNotFound = 18300,

  // ========================================
  // 19000-19099: api-key / relay
  // ========================================
  ApiKeyInvalid = 19000,
  RelayServerUnavailable = 19001,
}
