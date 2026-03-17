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
  S3UploadFailed = 10101,
  InvalidGcsUri = 10102,

  // ========================================
  // 12000-12999: aitoearn-server（主服务）
  // ========================================

  // 12000-12099: user（用户模块）
  UserNotFound = 12000,
  UserCreditsInsufficient = 12001,
  UserStorageExceeded = 12002,
  UserStatusError = 12003,
  UserPasswordError = 12004,
  UserLoginCodeError = 12005,
  UserInviteCodeError = 12006,
  UserAlreadyExists = 12007,
  UserBanned = 12008,
  UserMembershipExpired = 12009,
  GetUserTokenFailed = 12010,
  UserAlreadyHasLibrary = 12011,
  UserNoLibrary = 12012,

  // 12100-12199: balance-record/withdraw（余额记录/提现模块）
  UserInsufficientBalance = 12102,
  WithdrawRecordNotFound = 12105,
  WithdrawRecordStatusError = 12106,
  WithdrawRecordExists = 12107,

  // 12200-12299: wallet-account（钱包账户）
  UserWalletAccountAlreadyExists = 12200,
  UserWalletAccountLimitExceeded = 12201,

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

  // 12400-12499: notification（通知）
  NotificationNotFound = 12400,

  // 12500-12599: app-release（应用发布）
  AppReleaseNotFound = 12500,
  AppReleaseAlreadyExists = 12501,

  // 12600-12699: account（社交账号）
  AccountNotFound = 12600,
  AccountGroupNotFound = 12601,
  AccountStatisticsNotFound = 12602,
  AccountGroupCountryCodeInvalid = 12603,
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
  MaterialTaskNotFound = 12802,
  MaterialGroupDefaultNotAllowed = 12803,
  MaterialAdaptationNotFound = 12804,
  MaterialAdaptationFailed = 12805,

  // 12900-12999: content（内容组合）
  MaterialGroupEmpty = 12900,
  MaterialGroupTypeError = 12901,
  MediaGroupTypeNotSupported = 12902,
  GroupInfoNotFound = 12903,

  // ========================================
  // 13000-13999: aitoearn-admin-server（管理后台）
  // ========================================

  // 13000-13099: manager（管理员）
  ManagerAlreadyExists = 13000,
  ManagerCreateFailed = 13001,
  ManagerNotFound = 13002,
  ManagerPasswordError = 13003,

  // 13100-13199: feedback（反馈）
  FeedbackCreateFailed = 13100,

  // 13200-13299: admin-operation（管理后台操作）
  AdminOperationPasswordError = 13200,

  // ========================================
  // 14000-14999: aitoearn-payment（支付服务）
  // ========================================

  // 14000-14099: payment（支付相关）
  PaymentInvalidWebhookSignature = 14000,
  PaymentCheckoutNotFound = 14001,
  PaymentChargeNotFound = 14002,
  PaymentSubscriptionNotFound = 14003,
  PaymentMissingSubscriptionId = 14004,
  PaymentInvalidPaymentIntent = 14005,
  PaymentInvalidMode = 14006,
  PaymentPriceNotFound = 14007,
  PaymentProductCreateFailed = 14008,
  PaymentProductUpdateFailed = 14009,
  PaymentSubscriptionAlreadyExists = 14010,
  PaymentSubscriptionNotPendingCancel = 14011,
  ConnectedAccountNotFound = 14012,
  ConnectedAccountNotActive = 14013,
  ConnectedAccountOnboardingIncomplete = 14014,
  ConnectedAccountOnboardingComplete = 14015,
  TransferNotFound = 14016,
  TransferFailed = 14017,
  PaymentMembershipSuspended = 14018,

  // 14100-14199: balance/withdraw（余额/提现）
  InsufficientBalance = 14100,
  InsufficientFrozenBalance = 14101,
  UserWalletAccountNotFound = 14102,
  InvalidParameter = 14103,
  NoPendingBalanceToWithdraw = 14104,
  WithdrawRecordCannotCancel = 14105,
  InvalidWalletAccountType = 14106,
  UserWalletAccountNotVerified = 14107,

  // 14108-14119: Wise（Wise 转账）
  WiseRecipientNotFound = 14108,
  WiseRecipientCreateFailed = 14109,
  WiseQuoteCreateFailed = 14110,
  WiseTransferCreateFailed = 14111,
  WiseTransferFundFailed = 14112,
  WiseAccountRequirementsFailed = 14113,
  WiseInvalidBankDetails = 14114,
  WiseTransferNotFound = 14115,
  WiseWebhookSignatureInvalid = 14116,

  // 14120-14199: balance-record（余额记录）
  BalanceRecordNotFound = 14120,

  // 14200-14299: refund（退款）
  PaymentNoRefundableCheckout = 14200,
  PaymentRefundAmountExceeded = 14201,

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

  // 15100-15199: short-link（短链接）
  ShortLinkNotFound = 15100,
  ShortLinkExpired = 15101,

  // ========================================
  // 16000-16999: aitoearn-task（任务服务）
  // ========================================

  // 16000-16099: task（任务核心）
  TaskNotFound = 16000,
  TaskOpportunityNotFound = 16001,
  TaskOpportunityAlreadyExists = 16002,
  UserTaskNotFound = 16003,
  InvalidUserTaskId = 16004,
  TaskOpportunityCannotDelete = 16005,
  UserTaskStatusInvalid = 16006,
  TaskExpired = 16007,
  TaskRecruitsFullDec = 16008,
  TaskAccountNotBelongToUser = 16009,
  TaskAccountTypeInvalid = 16010,
  TaskAlreadyTaken = 16011,
  MaterialConsumed = 16012,
  TaskMatcherNotFound = 16013,
  FailedToSettleUserTasks = 16014,
  UserTaskSettleNotFound = 16015,
  UserTaskPostNotFound = 16016,
  PostDataError = 16017,
  WorkAlreadySubmitted = 16022, // 作品已被提交过
  WorkDataIdNotFound = 16023, // 作品数据ID未找到
  WorkDataNotMatch = 16024, // 作品数据不匹配
  WorkLinkInfoNotFound = 16025, // 作品链接信息未找到
  WorkDetailNotFound = 16026, // 作品详情未找到
  WorkPublishTimeExpired = 16034, // 作品发布时间超过限制
  TaskPricingNotFound = 16035, // 任务定价配置不存在
  AdvertiserInsufficientBalance = 16036, // 广告主余额不足，请充值
  AccountAuthRequired = 16037, // 该平台需要先授权账号
  PlatformNotDetected = 16038, // 无法从链接识别平台
  UserTaskKeepTimeExpired = 16039, // 用户任务保留时间已过期
  TaskAlreadyCancelled = 16040, // 任务已停止
  TaskNotOwnedByUser = 16041, // 任务不属于当前用户
  LocationScreenshotRequired = 16042, // 同城任务需要提交位置截图
  LocationVerifyFailed = 16043, // 位置截图与任务城市不匹配
  UserTaskDisputeNotFound = 16044, // 争议记录未找到
  UserTaskDisputeAlreadyExists = 16045, // 该任务已存在待处理争议
  UserTaskDisputeStatusInvalid = 16046, // 争议状态无效

  // 16047: instance-capture（即时抓取）
  InstanceCaptureTooFrequent = 16047, // 同一任务10分钟内只能提交一次

  // 16027-16049: promotion-code（推广码）
  PromotionCodeNotFound = 16027,
  PromotionCodeAlreadyExists = 16028,
  PromotionCodeTaskNotFound = 16029,
  PromotionCodeAlreadyLinked = 16030,
  PromotionCodeDisabled = 16031,
  PromotionCodeNotLinked = 16032,
  PromotionCodeTaskNotActive = 16033,

  // 16050-16099: task-material（任务素材）
  TaskMaterialGroupNotFound = 16050,
  TaskMaterialEmpty = 16051,
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

  // 18300-18399: place-draft（地点草稿）
  PlaceDraftNotFound = 18300,

  // 18400-18499: tools（工具模块）
  QrCodeArtImageNotFound = 18400,

  // 18500-18599: campaign（探店活动）
  CampaignNotFound = 18500,
  CampaignAlreadyClosed = 18501,
  CampaignBudgetExceeded = 18502,
  CampaignQuestionnaireGenerateFailed = 18503,
  CampaignStatusInvalid = 18504,

  // 18600-18699: campaign-application（探店报名）
  CampaignApplicationNotFound = 18600,
  CampaignApplicationDuplicate = 18601,
  CampaignApplicationSlotsFull = 18602,
  CampaignApplicationFollowersInsufficient = 18603,
  CampaignApplicationLotteryNotDrawn = 18604,
  CampaignApplicationVerifyCodeInvalid = 18605,
  CampaignApplicationAlreadyVerified = 18606,
  CampaignApplicationStatusInvalid = 18607,

  // 18608-18610: campaign-application（探店内容提交）
  CampaignApplicationContentNotReady = 18608,
  CampaignApplicationContentDeadlineExpired = 18609,
  CampaignApplicationContentRetryExceeded = 18610,
  CampaignApplicationVerifyCodeExpired = 18611,
}
