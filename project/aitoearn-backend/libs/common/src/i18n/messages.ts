import template from 'art-template'
import { ResponseCode } from '../enums'

export type Locale = 'en-US' | 'zh-CN'

// 消息可以是字符串或预编译的模板函数
type MessageValue = string | ((data: unknown) => string
)
export const messages: Record<ResponseCode, Record<Locale, MessageValue>> = {
  [ResponseCode.Success]: {
    'en-US': 'Success',
    'zh-CN': '请求成功',
  },

  // 10000 (common)
  [ResponseCode.MailSendFail]: {
    'en-US': 'Failed to send email',
    'zh-CN': '邮件发送失败',
  },
  [ResponseCode.ValidationFailed]: {
    'en-US': 'Validation failed',
    'zh-CN': '参数验证失败',
  },
  [ResponseCode.TooManyRequests]: {
    'en-US': template.compile('Too many requests, please try again after {{ttl}} seconds'),
    'zh-CN': template.compile('请求过于频繁，请在{{ttl}}秒后重试'),
  },
  [ResponseCode.SmsSendFail]: {
    'en-US': 'Failed to send SMS',
    'zh-CN': '短信发送失败',
  },

  // 10100 (s3)
  [ResponseCode.S3DownloadFileFailed]: {
    'en-US': 'Failed to download file from S3',
    'zh-CN': 'S3 文件下载失败',
  },
  [ResponseCode.S3UploadFailed]: {
    'en-US': 'Failed to upload file to S3',
    'zh-CN': 'S3文件上传失败',
  },
  [ResponseCode.InvalidGcsUri]: {
    'en-US': 'Invalid GCS URI format',
    'zh-CN': '无效的 GCS URI 格式',
  },

  // 12000 (user)
  [ResponseCode.UserNotFound]: {
    'en-US': 'User not found',
    'zh-CN': '用户未找到',
  },
  [ResponseCode.UserCreditsInsufficient]: {
    'en-US': 'Insufficient user credits',
    'zh-CN': '用户Credits不足',
  },
  [ResponseCode.UserStorageExceeded]: {
    'en-US': 'User storage exceeded',
    'zh-CN': '用户存储空间超限',
  },
  [ResponseCode.UserStatusError]: {
    'en-US': 'User status error',
    'zh-CN': '用户状态错误',
  },
  [ResponseCode.UserPasswordError]: {
    'en-US': 'Incorrect password',
    'zh-CN': '密码错误',
  },
  [ResponseCode.UserLoginCodeError]: {
    'en-US': 'Incorrect login code',
    'zh-CN': '登录验证码错误',
  },
  [ResponseCode.UserInviteCodeError]: {
    'en-US': 'Invalid invite code',
    'zh-CN': '邀请码无效',
  },
  [ResponseCode.UserAlreadyExists]: {
    'en-US': 'User already exists',
    'zh-CN': '用户已存在',
  },

  [ResponseCode.UserBanned]: {
    'en-US': 'User has been banned',
    'zh-CN': '用户已被封禁',
  },
  [ResponseCode.UserMembershipExpired]: {
    'en-US': 'User membership expired',
    'zh-CN': '用户会员已过期',
  },
  [ResponseCode.GetUserTokenFailed]: {
    'en-US': 'Failed to get user token',
    'zh-CN': '获取用户Token失败',
  },
  [ResponseCode.UserAlreadyHasLibrary]: {
    'en-US': 'User already has a linked restaurant',
    'zh-CN': '用户已关联餐厅',
  },
  [ResponseCode.UserNoLibrary]: {
    'en-US': 'User has no linked restaurant',
    'zh-CN': '用户未关联餐厅',
  },

  // 12100 (balance-record/withdraw)
  [ResponseCode.UserInsufficientBalance]: {
    'en-US': 'Insufficient balance',
    'zh-CN': '余额不足',
  },

  [ResponseCode.WithdrawRecordNotFound]: {
    'en-US': 'Withdraw record not found',
    'zh-CN': '提现记录未找到',
  },
  [ResponseCode.WithdrawRecordStatusError]: {
    'en-US': 'Withdraw record status error',
    'zh-CN': '提现记录状态错误',
  },
  [ResponseCode.WithdrawRecordExists]: {
    'en-US': 'Withdraw record already exists',
    'zh-CN': '提现记录已存在',
  },

  // 12200 (wallet-account)
  [ResponseCode.UserWalletAccountAlreadyExists]: {
    'en-US': 'Wallet account already exists',
    'zh-CN': '钱包账户已存在',
  },
  [ResponseCode.UserWalletAccountLimitExceeded]: {
    'en-US': 'Wallet account limit exceeded',
    'zh-CN': '钱包账户数量超限',
  },

  // 12300 (ai)
  [ResponseCode.InvalidModel]: {
    'en-US': 'Invalid AI model',
    'zh-CN': '无效的 AI 模型',
  },
  [ResponseCode.AiCallFailed]: {
    'en-US': template.compile('AI call failed: {{error}}'),
    'zh-CN': template.compile('AI 调用失败：{{error}}'),
  },
  [ResponseCode.InvalidAiTaskId]: {
    'en-US': 'Invalid AI task ID',
    'zh-CN': '无效的 AI 任务 ID',
  },
  [ResponseCode.AiLogNotFound]: {
    'en-US': 'AI log not found',
    'zh-CN': 'AI 日志未找到',
  },
  [ResponseCode.VideoUploadInvalidInput]: {
    'en-US': 'Invalid video input type',
    'zh-CN': '无效的视频输入类型',
  },
  [ResponseCode.VideoUploadJobIdNotFound]: {
    'en-US': 'Failed to get upload job ID',
    'zh-CN': '获取上传任务 ID 失败',
  },
  [ResponseCode.VideoUploadTaskInfoNotFound]: {
    'en-US': 'Failed to get upload task information',
    'zh-CN': '获取上传任务信息失败',
  },
  [ResponseCode.VideoUploadVidNotFound]: {
    'en-US': 'Failed to get video ID from upload result',
    'zh-CN': '从上传结果中获取视频 ID 失败',
  },
  [ResponseCode.VideoUploadFailed]: {
    'en-US': 'Video upload task failed',
    'zh-CN': '视频上传任务失败',
  },

  // 12400 (notification)
  [ResponseCode.NotificationNotFound]: {
    'en-US': 'Notification not found',
    'zh-CN': '通知未找到',
  },

  // 12500 (app-release)
  [ResponseCode.AppReleaseNotFound]: {
    'en-US': 'App release not found',
    'zh-CN': '应用发布版本未找到',
  },
  [ResponseCode.AppReleaseAlreadyExists]: {
    'en-US': 'App release already exists',
    'zh-CN': '应用发布版本已存在',
  },

  // 12600 (account)
  [ResponseCode.AccountNotFound]: {
    'en-US': 'Account not found',
    'zh-CN': '账号未找到',
  },
  [ResponseCode.AccountGroupNotFound]: {
    'en-US': 'Account group not found',
    'zh-CN': '账号分组未找到',
  },
  [ResponseCode.AccountStatisticsNotFound]: {
    'en-US': 'Account statistics not found',
    'zh-CN': '账号不存在',
  },
  [ResponseCode.AccountGroupCountryCodeInvalid]: {
    'en-US': 'Account group country code invalid',
    'zh-CN': '账号分组国家代码无效',
  },
  [ResponseCode.AccountCreateFailed]: {
    'en-US': 'Account create failed',
    'zh-CN': '账号创建失败',
  },

  // 12700 (media)
  [ResponseCode.MediaNotFound]: {
    'en-US': 'Media not found',
    'zh-CN': '媒体文件未找到',
  },
  [ResponseCode.MediaGroupNotFound]: {
    'en-US': 'Media group not found',
    'zh-CN': '媒体分组未找到',
  },
  [ResponseCode.MediaGroupDefaultNotAllowed]: {
    'en-US': 'Default media group cannot be deleted',
    'zh-CN': '默认媒体组不能删除',
  },

  // 12750 (assets)
  [ResponseCode.AssetNotFound]: {
    'en-US': 'Asset not found',
    'zh-CN': '资源未找到',
  },
  [ResponseCode.AssetUploadFailed]: {
    'en-US': 'Failed to upload asset',
    'zh-CN': '资源上传失败',
  },

  // 12800 (material)
  [ResponseCode.MaterialNotFound]: {
    'en-US': 'Material not found',
    'zh-CN': '素材未找到',
  },
  [ResponseCode.MaterialGroupNotFound]: {
    'en-US': 'Material group not found',
    'zh-CN': '素材分组未找到',
  },
  [ResponseCode.MaterialTaskNotFound]: {
    'en-US': 'Material task not found',
    'zh-CN': '素材任务不存在',
  },
  [ResponseCode.MaterialGroupDefaultNotAllowed]: {
    'en-US': 'Default material group cannot be deleted',
    'zh-CN': '默认素材组不能删除',
  },
  [ResponseCode.MaterialAdaptationNotFound]: {
    'en-US': 'Material adaptation not found',
    'zh-CN': '素材适配内容未找到',
  },
  [ResponseCode.MaterialAdaptationFailed]: {
    'en-US': 'Failed to adapt material',
    'zh-CN': '素材适配失败',
  },
  // 12900 (content/material)
  [ResponseCode.MaterialGroupEmpty]: {
    'en-US': 'Material group cannot be empty',
    'zh-CN': '素材组不能为空',
  },
  [ResponseCode.MaterialGroupTypeError]: {
    'en-US': 'Material group type error',
    'zh-CN': '素材组类型错误',
  },
  [ResponseCode.MediaGroupTypeNotSupported]: {
    'en-US': 'Media group type not supported',
    'zh-CN': '暂不支持该素材类型',
  },
  [ResponseCode.GroupInfoNotFound]: {
    'en-US': 'Group information not found',
    'zh-CN': '组信息不存在',
  },

  // 13000 (manager)
  [ResponseCode.ManagerAlreadyExists]: {
    'en-US': 'Manager already exists',
    'zh-CN': '管理员已存在',
  },
  [ResponseCode.ManagerCreateFailed]: {
    'en-US': 'Failed to create manager',
    'zh-CN': '创建管理员失败',
  },
  [ResponseCode.ManagerNotFound]: {
    'en-US': 'Manager not found',
    'zh-CN': '账号不存在',
  },
  [ResponseCode.ManagerPasswordError]: {
    'en-US': 'Incorrect password',
    'zh-CN': '密码错误',
  },

  // 13100 (feedback)
  [ResponseCode.FeedbackCreateFailed]: {
    'en-US': 'Failed to create feedback',
    'zh-CN': '创建失败',
  },

  // 13200 (admin-operation)
  [ResponseCode.AdminOperationPasswordError]: {
    'en-US': 'Incorrect operation password',
    'zh-CN': '操作密码错误',
  },

  // 14000 (payment)
  [ResponseCode.PaymentInvalidWebhookSignature]: {
    'en-US': 'Invalid webhook signature',
    'zh-CN': 'Webhook 签名无效',
  },
  [ResponseCode.PaymentCheckoutNotFound]: {
    'en-US': 'Checkout not found',
    'zh-CN': '结账会话未找到',
  },
  [ResponseCode.PaymentChargeNotFound]: {
    'en-US': 'Charge not found',
    'zh-CN': '支付记录未找到',
  },
  [ResponseCode.PaymentSubscriptionNotFound]: {
    'en-US': 'Subscription not found',
    'zh-CN': '订阅未找到',
  },
  [ResponseCode.PaymentMissingSubscriptionId]: {
    'en-US': 'Missing subscription ID',
    'zh-CN': '缺少订阅 ID',
  },
  [ResponseCode.PaymentInvalidPaymentIntent]: {
    'en-US': 'Invalid payment intent',
    'zh-CN': '无效的支付意图',
  },
  [ResponseCode.PaymentInvalidMode]: {
    'en-US': 'Invalid payment mode',
    'zh-CN': '无效的支付模式',
  },
  [ResponseCode.PaymentPriceNotFound]: {
    'en-US': 'Price not found',
    'zh-CN': '价格未找到',
  },
  [ResponseCode.PaymentProductCreateFailed]: {
    'en-US': 'Failed to create product',
    'zh-CN': '产品创建失败',
  },
  [ResponseCode.PaymentProductUpdateFailed]: {
    'en-US': 'Failed to update product',
    'zh-CN': '产品更新失败',
  },
  [ResponseCode.PaymentSubscriptionAlreadyExists]: {
    'en-US': 'Subscription already exists',
    'zh-CN': '订阅已存在',
  },
  [ResponseCode.PaymentSubscriptionNotPendingCancel]: {
    'en-US': 'Subscription is not pending cancellation',
    'zh-CN': '订阅未处于待取消状态',
  },
  [ResponseCode.ConnectedAccountNotFound]: {
    'en-US': 'Connected account not found',
    'zh-CN': '商家账户未找到',
  },
  [ResponseCode.ConnectedAccountNotActive]: {
    'en-US': 'Connected account is not active',
    'zh-CN': '商家账户未激活',
  },
  [ResponseCode.ConnectedAccountOnboardingIncomplete]: {
    'en-US': 'Connected account onboarding is incomplete',
    'zh-CN': '商家账户入驻流程未完成',
  },
  [ResponseCode.ConnectedAccountOnboardingComplete]: {
    'en-US': 'Connected account onboarding is complete',
    'zh-CN': '商家账户入驻流程已完成',
  },
  [ResponseCode.TransferNotFound]: {
    'en-US': 'Transfer not found',
    'zh-CN': '转账记录未找到',
  },
  [ResponseCode.TransferFailed]: {
    'en-US': 'Transfer failed',
    'zh-CN': '转账失败',
  },
  [ResponseCode.PaymentMembershipSuspended]: {
    'en-US': 'Membership purchase is temporarily suspended',
    'zh-CN': '会员暂停使用',
  },

  // 14100 (balance/withdraw)
  [ResponseCode.InsufficientBalance]: {
    'en-US': 'Insufficient balance',
    'zh-CN': '余额不足',
  },
  [ResponseCode.InsufficientFrozenBalance]: {
    'en-US': 'Insufficient frozen balance',
    'zh-CN': '冻结余额不足',
  },
  [ResponseCode.UserWalletAccountNotFound]: {
    'en-US': 'Wallet account not found',
    'zh-CN': '钱包账户未找到',
  },
  [ResponseCode.InvalidParameter]: {
    'en-US': 'Invalid parameter',
    'zh-CN': '参数无效',
  },
  [ResponseCode.NoPendingBalanceToWithdraw]: {
    'en-US': 'No available balance to withdraw',
    'zh-CN': '没有可提现的余额',
  },
  [ResponseCode.WithdrawRecordCannotCancel]: {
    'en-US': 'Withdraw record cannot be cancelled',
    'zh-CN': '提现记录无法取消',
  },
  [ResponseCode.InvalidWalletAccountType]: {
    'en-US': 'Invalid wallet account type for this operation',
    'zh-CN': '钱包账户类型不支持此操作',
  },
  [ResponseCode.UserWalletAccountNotVerified]: {
    'en-US': 'Wallet account is not verified',
    'zh-CN': '钱包账户未验证',
  },

  // 14108-14116 (Wise)
  [ResponseCode.WiseRecipientNotFound]: {
    'en-US': 'Wise recipient not found',
    'zh-CN': 'Wise 收款人未找到',
  },
  [ResponseCode.WiseRecipientCreateFailed]: {
    'en-US': 'Failed to create Wise recipient',
    'zh-CN': 'Wise 收款人创建失败',
  },
  [ResponseCode.WiseQuoteCreateFailed]: {
    'en-US': 'Failed to create Wise quote',
    'zh-CN': 'Wise 报价创建失败',
  },
  [ResponseCode.WiseTransferCreateFailed]: {
    'en-US': 'Failed to create Wise transfer',
    'zh-CN': 'Wise 转账创建失败',
  },
  [ResponseCode.WiseTransferFundFailed]: {
    'en-US': 'Failed to fund Wise transfer',
    'zh-CN': 'Wise 转账资金发送失败',
  },
  [ResponseCode.WiseAccountRequirementsFailed]: {
    'en-US': 'Failed to get Wise account requirements',
    'zh-CN': '获取 Wise 账户要求失败',
  },
  [ResponseCode.WiseInvalidBankDetails]: {
    'en-US': 'Invalid bank details for Wise transfer',
    'zh-CN': 'Wise 转账银行信息无效',
  },
  [ResponseCode.WiseTransferNotFound]: {
    'en-US': 'Wise transfer not found',
    'zh-CN': 'Wise 转账记录未找到',
  },
  [ResponseCode.WiseWebhookSignatureInvalid]: {
    'en-US': 'Invalid Wise webhook signature',
    'zh-CN': 'Wise Webhook 签名无效',
  },

  // 14120 (balance-record)
  [ResponseCode.BalanceRecordNotFound]: {
    'en-US': 'Balance record not found',
    'zh-CN': '余额记录未找到',
  },

  // 14200 (refund)
  [ResponseCode.PaymentNoRefundableCheckout]: {
    'en-US': 'No refundable checkout found',
    'zh-CN': '没有可退款的订单',
  },
  [ResponseCode.PaymentRefundAmountExceeded]: {
    'en-US': 'Refund amount exceeds maximum refundable amount',
    'zh-CN': '退款金额超过最大可退款金额',
  },

  // 15000 (channel/publish)
  [ResponseCode.PublishRecordNotFound]: {
    'en-US': 'publish record with flowId {{flowId}} not found.',
    'zh-CN': '发布记录未找到',
  },
  [ResponseCode.PublishTaskAlreadyPublishing]: {
    'en-US': 'Publish task is already publishing',
    'zh-CN': '发布任务正在执行中',
  },
  [ResponseCode.PublishTaskAlreadyCompleted]: {
    'en-US': 'Publish task is already completed',
    'zh-CN': '发布任务已完成',
  },
  [ResponseCode.ChannelAccountNotAuthorized]: {
    'en-US': 'Account not authorized',
    'zh-CN': '账号未授权',
  },
  [ResponseCode.ChannelAuthorizationExpired]: {
    'en-US': 'Authorization expired',
    'zh-CN': '授权已过期',
  },
  [ResponseCode.ChannelAccountInfoFailed]: {
    'en-US': 'Failed to get account information',
    'zh-CN': '账号信息获取失败',
  },
  [ResponseCode.PublishTaskNotFound]: {
    'en-US': 'Publish task not found',
    'zh-CN': '未发现任务',
  },
  [ResponseCode.ChannelWebhookFailed]: {
    'en-US': 'Webhook processing failed',
    'zh-CN': 'Webhook 处理失败',
  },
  [ResponseCode.ChannelCredentialNotFound]: {
    'en-US': template.compile('{{channel}} credential not found for accountId: {{accountId}}'),
    'zh-CN': template.compile('{{channel}} 凭证未找到，账号ID: {{accountId}}'),
  },
  [ResponseCode.ChannelRefreshTokenNotFound]: {
    'en-US': template.compile('{{channel}} refresh token not found for accountId: {{accountId}}'),
    'zh-CN': template.compile('{{channel}} 刷新令牌未找到，账号ID: {{accountId}}'),
  },
  [ResponseCode.ChannelRefreshTokenExpired]: {
    'en-US': template.compile('{{channel}} refresh Token expired for accountId: {{accountId}}, expired at: {{credential.refresh_expires_in}}, please re-authorize'),
    'zh-CN': '刷新令牌已过期',
  },
  [ResponseCode.ChannelRefreshTokenFailed]: {
    'en-US': 'refresh Token failed for accountId: {{accountId}}',
    'zh-CN': '刷新令牌失败',
  },
  [ResponseCode.ChannelAccessTokenFailed]: {
    'en-US': 'Failed to get access token',
    'zh-CN': '获取访问令牌失败',
  },
  [ResponseCode.ChannelPlatformTokenNotFound]: {
    'en-US': 'Platform authorization token not found',
    'zh-CN': '不存在平台授权令牌',
  },
  [ResponseCode.ChannelAuthTaskFailed]: {
    'en-US': 'Failed to create authorization task',
    'zh-CN': '创建授权任务失败',
  },
  [ResponseCode.ChannelNoAccountsFound]: {
    'en-US': 'No accounts found',
    'zh-CN': '未找到账号',
  },
  [ResponseCode.PublishServiceNotFound]: {
    'en-US': 'publish service for {{publishTask.accountType}} not found',
    'zh-CN': '未找到发布服务',
  },
  [ResponseCode.PublishTaskFailed]: {
    'en-US': 'task publish failed, accountType: {{accountType}}',
    'zh-CN': '任务发布失败',
  },
  [ResponseCode.PublishTaskInProgress]: {
    'en-US': 'Task is in progress and cannot be deleted',
    'zh-CN': '任务正在执行中，无法删除',
  },
  [ResponseCode.PublishTaskStatusInvalid]: {
    'en-US': 'Task has been published or is in progress',
    'zh-CN': '任务已发布或正在进行中',
  },
  [ResponseCode.PublishTimeInvalid]: {
    'en-US': 'Publish time cannot be in the past',
    'zh-CN': '发布时间不能小于当前时间',
  },
  [ResponseCode.EngagementTaskInProgress]: {
    'en-US': 'Reply task for this post is already in progress',
    'zh-CN': '该帖子的回复任务已在进行中',
  },
  [ResponseCode.ChannelAccountNotFound]: {
    'en-US': 'Account not found',
    'zh-CN': '账户不存在',
  },
  [ResponseCode.InteractAccountTypeNotSupported]: {
    'en-US': 'Account type not supported for interaction',
    'zh-CN': '暂不支持该账户类型',
  },
  [ResponseCode.InteractRecordNotFound]: {
    'en-US': 'Publish record not found',
    'zh-CN': '未找到发布记录',
  },
  [ResponseCode.DataCubeAccountTypeNotSupported]: {
    'en-US': 'Account type not supported for data cube',
    'zh-CN': '暂不支持该账户类型',
  },
  [ResponseCode.ChannelPublishTaskAlreadyExists]: {
    'en-US': 'publish task with flowId {{flowId}} already exists',
    'zh-CN': '发布任务已存在',
  },
  [ResponseCode.PublishTaskNotPublished]: {
    'en-US': 'Publish task not published',
    'zh-CN': '发布任务未发布',
  },
  [ResponseCode.PublishTaskAlreadyUpdating]: {
    'en-US': 'Publish task is already updating',
    'zh-CN': '发布任务正在更新中',
  },
  [ResponseCode.PlatformNotSupported]: {
    'en-US': 'Platform not supported for update published post',
    'zh-CN': '暂不支持该平台',
  },
  [ResponseCode.PostCategoryNotSupported]: {
    'en-US': 'Post category not supported for update published post',
    'zh-CN': '暂不支持该帖子类型',
  },
  [ResponseCode.PublishTaskAlreadyWaitingForUpdate]: {
    'en-US': 'Publish task is already waiting for update',
    'zh-CN': '发布任务已等待更新',
  },
  [ResponseCode.PublishTaskUpdateFailed]: {
    'en-US': 'Failed to update publish task',
    'zh-CN': '更新发布任务失败',
  },
  [ResponseCode.DeletePostFailed]: {
    'en-US': 'Failed to delete post',
    'zh-CN': '删除作品失败',
  },
  [ResponseCode.PublishTaskInvalid]: {
    'en-US': 'Publish task invalid',
    'zh-CN': '发布任务无效',
  },
  [ResponseCode.InvalidWorkLink]: {
    'en-US': 'Invalid work link',
    'zh-CN': '作品链接无效',
  },
  [ResponseCode.WorkNotBelongToAccount]: {
    'en-US': 'The work does not belong to this account',
    'zh-CN': '该作品不属于此账号',
  },

  // 15100 (short-link)
  [ResponseCode.ShortLinkNotFound]: {
    'en-US': 'Short link not found',
    'zh-CN': '短链接不存在',
  },
  [ResponseCode.ShortLinkExpired]: {
    'en-US': 'Short link has expired',
    'zh-CN': '短链接已过期',
  },

  // 16000 (task)
  [ResponseCode.TaskNotFound]: {
    'en-US': 'Task not found',
    'zh-CN': '任务未找到',
  },
  [ResponseCode.TaskOpportunityNotFound]: {
    'en-US': 'Task opportunity not found',
    'zh-CN': '任务机会未找到',
  },
  [ResponseCode.TaskOpportunityAlreadyExists]: {
    'en-US': 'Task opportunity already exists',
    'zh-CN': '任务机会已存在',
  },
  [ResponseCode.UserTaskNotFound]: {
    'en-US': 'User task not found',
    'zh-CN': '用户任务未找到',
  },
  [ResponseCode.InvalidUserTaskId]: {
    'en-US': 'Invalid user task ID',
    'zh-CN': '无效的用户任务 ID',
  },
  [ResponseCode.TaskOpportunityCannotDelete]: {
    'en-US': 'Task has been accepted or does not exist and cannot be deleted',
    'zh-CN': '任务已被接受或不存在，无法删除',
  },
  [ResponseCode.UserTaskStatusInvalid]: {
    'en-US': 'Task status is invalid',
    'zh-CN': '任务状态无效',
  },
  [ResponseCode.TaskExpired]: {
    'en-US': 'Task expired',
    'zh-CN': '任务已过期',
  },
  [ResponseCode.TaskRecruitsFullDec]: {
    'en-US': 'Task recruits full',
    'zh-CN': '任务招募已满',
  },
  [ResponseCode.TaskAccountNotBelongToUser]: {
    'en-US': 'Account does not belong to user',
    'zh-CN': '账号不属于该用户',
  },
  [ResponseCode.TaskAccountTypeInvalid]: {
    'en-US': 'Task account type is invalid',
    'zh-CN': '任务账号类型无效',
  },
  [ResponseCode.TaskAlreadyTaken]: {
    'en-US': 'This task has already been taken by this account',
    'zh-CN': '该账号已接取此任务',
  },
  [ResponseCode.MaterialConsumed]: {
    'en-US': 'The materials for this task have been consumed',
    'zh-CN': '该任务的素材已被消耗',
  },
  [ResponseCode.TaskMatcherNotFound]: {
    'en-US': 'Task matcher not found',
    'zh-CN': '任务匹配规则未找到',
  },
  [ResponseCode.FailedToSettleUserTasks]: {
    'en-US': 'Failed to settle user tasks',
    'zh-CN': '结算用户任务失败',
  },
  [ResponseCode.UserTaskSettleNotFound]: {
    'en-US': 'User task settle not found',
    'zh-CN': '用户任务结算未找到',
  },
  [ResponseCode.UserTaskPostNotFound]: {
    'en-US': 'User task post not found',
    'zh-CN': '用户任务作品未找到',
  },
  [ResponseCode.PostDataError]: {
    'en-US': 'Post data error',
    'zh-CN': '作品数据错误',
  },
  [ResponseCode.WorkAlreadySubmitted]: {
    'en-US': 'This work has already been submitted',
    'zh-CN': '该作品已被提交过',
  },
  [ResponseCode.WorkDataIdNotFound]: {
    'en-US': 'Work data ID not found',
    'zh-CN': '作品数据ID未找到',
  },
  [ResponseCode.WorkDataNotMatch]: {
    'en-US': 'Work data does not match task requirements',
    'zh-CN': '作品数据不匹配任务要求',
  },
  [ResponseCode.WorkLinkInfoNotFound]: {
    'en-US': 'Work link info not found',
    'zh-CN': '无法解析作品链接信息',
  },
  [ResponseCode.WorkDetailNotFound]: {
    'en-US': 'Work detail not found',
    'zh-CN': '无法获取作品详情',
  },
  [ResponseCode.WorkPublishTimeExpired]: {
    'en-US': 'Work publish time exceeded the limit (must be within 31 days)',
    'zh-CN': '作品发布时间超过限制（必须在31天内）',
  },
  [ResponseCode.TaskPricingNotFound]: {
    'en-US': 'Task pricing configuration not found',
    'zh-CN': '任务定价配置不存在',
  },
  [ResponseCode.AdvertiserInsufficientBalance]: {
    'en-US': 'Advertiser balance is insufficient, please recharge',
    'zh-CN': '广告主余额不足，请充值',
  },
  [ResponseCode.AccountAuthRequired]: {
    'en-US': 'This platform requires account authorization before submission',
    'zh-CN': '该平台需要先授权账号才能提交',
  },
  [ResponseCode.PlatformNotDetected]: {
    'en-US': 'Unable to detect platform from the provided link',
    'zh-CN': '无法从链接中识别平台类型',
  },
  [ResponseCode.UserTaskKeepTimeExpired]: {
    'en-US': 'Task submission window has expired',
    'zh-CN': '任务提交时间窗口已过期',
  },
  [ResponseCode.TaskAlreadyCancelled]: {
    'en-US': 'Task has already been cancelled',
    'zh-CN': '任务已停止',
  },
  [ResponseCode.TaskNotOwnedByUser]: {
    'en-US': 'Task not found',
    'zh-CN': '任务未找到',
  },
  [ResponseCode.LocationScreenshotRequired]: {
    'en-US': 'Location screenshot is required for local tasks',
    'zh-CN': '同城任务需要提交位置截图',
  },
  [ResponseCode.LocationVerifyFailed]: {
    'en-US': 'Location screenshot does not match the task city',
    'zh-CN': '位置截图与任务城市不匹配',
  },
  [ResponseCode.UserTaskDisputeNotFound]: {
    'en-US': 'Dispute record not found',
    'zh-CN': '争议记录未找到',
  },
  [ResponseCode.UserTaskDisputeAlreadyExists]: {
    'en-US': 'A pending dispute already exists for this task',
    'zh-CN': '该任务已存在待处理的争议',
  },
  [ResponseCode.UserTaskDisputeStatusInvalid]: {
    'en-US': 'Dispute status is invalid for this operation',
    'zh-CN': '争议状态不允许此操作',
  },
  [ResponseCode.InstanceCaptureTooFrequent]: {
    'en-US': 'Instance capture too frequent, please try again after 10 minutes',
    'zh-CN': '抓取请求过于频繁，同一任务10分钟内只能提交一次',
  },
  // 16027-16049 (promotion-code)
  [ResponseCode.PromotionCodeNotFound]: {
    'en-US': 'Promotion code not found',
    'zh-CN': '推广码未找到',
  },
  [ResponseCode.PromotionCodeAlreadyExists]: {
    'en-US': 'Promotion code already exists',
    'zh-CN': '推广码已存在',
  },
  [ResponseCode.PromotionCodeTaskNotFound]: {
    'en-US': 'Task associated with promotion code not found',
    'zh-CN': '推广码关联的任务未找到',
  },
  [ResponseCode.PromotionCodeAlreadyLinked]: {
    'en-US': 'Promotion code is already linked to a task and cannot be deleted',
    'zh-CN': '推广码已绑定任务，无法删除',
  },
  [ResponseCode.PromotionCodeDisabled]: {
    'en-US': 'Promotion code is disabled',
    'zh-CN': '推广码已禁用',
  },
  [ResponseCode.PromotionCodeNotLinked]: {
    'en-US': 'Promotion code is not linked to any task',
    'zh-CN': '推广码未绑定任务',
  },
  [ResponseCode.PromotionCodeTaskNotActive]: {
    'en-US': 'The task linked to promotion code is not active',
    'zh-CN': '推广码关联的任务已失效',
  },

  // 16050 (task-material)
  [ResponseCode.TaskMaterialGroupNotFound]: {
    'en-US': 'Task material group not found',
    'zh-CN': '任务未配置草稿箱',
  },
  [ResponseCode.TaskMaterialEmpty]: {
    'en-US': 'No available material in task draft box',
    'zh-CN': '任务草稿箱中没有可用素材',
  },
  [ResponseCode.MaterialGroupPlatformMismatch]: {
    'en-US': 'Material group platform does not match task platforms',
    'zh-CN': '草稿箱平台限制与任务平台不匹配',
  },

  // 18000 (agent)
  [ResponseCode.AgentTaskNotFound]: {
    'en-US': 'Agent task not found',
    'zh-CN': '代理任务未找到',
  },
  [ResponseCode.AgentTaskStatusInvalid]: {
    'en-US': 'Agent task status is invalid',
    'zh-CN': '代理任务状态无效',
  },
  [ResponseCode.GenerateImagesFailed]: {
    'en-US': 'Failed to generate images',
    'zh-CN': '生成图片失败',
  },
  [ResponseCode.GenerateVideosFailed]: {
    'en-US': 'Failed to generate videos',
    'zh-CN': '生成视频失败',
  },
  [ResponseCode.AgentTaskFailed]: {
    'en-US': 'Agent task failed',
    'zh-CN': '代理任务失败',
  },
  [ResponseCode.DailyTaskQuotaExceeded]: {
    'en-US': 'Daily task quota exceeded',
    'zh-CN': '每日代理任务配额已超出',
  },
  [ResponseCode.GenerateContentFailed]: {
    'en-US': 'Failed to generate content',
    'zh-CN': '生成内容失败',
  },
  [ResponseCode.AgentTaskTimeout]: {
    'en-US': 'Agent task timeout: task has been running for too long without updates',
    'zh-CN': '代理任务超时：任务运行时间过长且未更新',
  },
  [ResponseCode.AgentTaskNotRunning]: {
    'en-US': 'Agent task is not running',
    'zh-CN': '代理任务未在运行状态',
  },
  [ResponseCode.AgentSessionRecoveryFailed]: {
    'en-US': 'Failed to recover agent session, please try to create a new conversation',
    'zh-CN': '恢复代理任务会话失败, 请尝试新建会话',
  },

  // 18300 (place-draft)
  [ResponseCode.PlaceDraftNotFound]: {
    'en-US': 'Place draft not found',
    'zh-CN': '地点草稿未找到',
  },

  // 18400 (tools)
  [ResponseCode.QrCodeArtImageNotFound]: {
    'en-US': 'QR code art image not found',
    'zh-CN': '二维码艺术图未找到',
  },

  // 18500 (campaign)
  [ResponseCode.CampaignNotFound]: {
    'en-US': 'Campaign not found',
    'zh-CN': '活动未找到',
  },
  [ResponseCode.CampaignAlreadyClosed]: {
    'en-US': 'Campaign is already closed',
    'zh-CN': '活动已关闭',
  },
  [ResponseCode.CampaignBudgetExceeded]: {
    'en-US': 'Campaign budget exceeded',
    'zh-CN': '活动预算已超出',
  },
  [ResponseCode.CampaignQuestionnaireGenerateFailed]: {
    'en-US': 'Failed to generate questionnaire',
    'zh-CN': '问卷生成失败',
  },
  [ResponseCode.CampaignStatusInvalid]: {
    'en-US': 'Campaign status is invalid for this operation',
    'zh-CN': '活动状态不允许此操作',
  },

  // 18600 (campaign-application)
  [ResponseCode.CampaignApplicationNotFound]: {
    'en-US': 'Application not found',
    'zh-CN': '报名记录未找到',
  },
  [ResponseCode.CampaignApplicationDuplicate]: {
    'en-US': 'You have already applied for this campaign',
    'zh-CN': '您已报名此活动',
  },
  [ResponseCode.CampaignApplicationSlotsFull]: {
    'en-US': 'No available slots',
    'zh-CN': '名额已满',
  },
  [ResponseCode.CampaignApplicationFollowersInsufficient]: {
    'en-US': 'Follower count does not meet the requirement',
    'zh-CN': '粉丝数不满足要求',
  },
  [ResponseCode.CampaignApplicationLotteryNotDrawn]: {
    'en-US': 'Lottery has not been drawn yet',
    'zh-CN': '尚未开奖',
  },
  [ResponseCode.CampaignApplicationVerifyCodeInvalid]: {
    'en-US': 'Invalid verify code',
    'zh-CN': '验证码无效',
  },
  [ResponseCode.CampaignApplicationAlreadyVerified]: {
    'en-US': 'Already verified',
    'zh-CN': '已核销',
  },
  [ResponseCode.CampaignApplicationStatusInvalid]: {
    'en-US': 'Application status is invalid for this operation',
    'zh-CN': '报名状态不允许此操作',
  },
  [ResponseCode.CampaignApplicationContentNotReady]: {
    'en-US': 'Content status does not allow this operation',
    'zh-CN': '内容状态不允许此操作',
  },
  [ResponseCode.CampaignApplicationContentDeadlineExpired]: {
    'en-US': 'Content submission deadline has expired',
    'zh-CN': '提交截止时间已过',
  },
  [ResponseCode.CampaignApplicationContentRetryExceeded]: {
    'en-US': 'Content retry limit exceeded',
    'zh-CN': '重试次数已达上限',
  },
  [ResponseCode.CampaignApplicationVerifyCodeExpired]: {
    'en-US': 'Verify code has expired',
    'zh-CN': '核销码已过期',
  },
}
