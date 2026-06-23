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
  [ResponseCode.ValidationFailed]: {
    'en-US': 'Validation failed',
    'zh-CN': '参数验证失败',
  },
  [ResponseCode.DevOnlyEndpoint]: {
    'en-US': 'This endpoint is only available in development environment',
    'zh-CN': '该接口仅在开发环境下可用',
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
  [ResponseCode.ConfigEditorUnsupportedFormat]: {
    'en-US': 'Unsupported config file format',
    'zh-CN': '不支持的配置文件格式',
  },
  [ResponseCode.ConfigEditorParseFailed]: {
    'en-US': 'Failed to parse config file',
    'zh-CN': '配置文件解析失败',
  },
  [ResponseCode.ConfigEditorValidationFailed]: {
    'en-US': 'Config validation failed',
    'zh-CN': '配置校验失败',
  },
  [ResponseCode.ConfigEditorReadFailed]: {
    'en-US': 'Failed to read config file',
    'zh-CN': '配置文件读取失败',
  },
  [ResponseCode.ConfigEditorWriteFailed]: {
    'en-US': 'Failed to write config file',
    'zh-CN': '配置文件写入失败',
  },
  [ResponseCode.ConfigEditorConfigPathMissing]: {
    'en-US': 'Config path is missing',
    'zh-CN': '配置文件路径缺失',
  },
  [ResponseCode.ConfigEditorPm2Unavailable]: {
    'en-US': 'PM2 is not available',
    'zh-CN': 'PM2 不可用',
  },
  [ResponseCode.ConfigEditorRestartFailed]: {
    'en-US': 'Failed to restart service with PM2',
    'zh-CN': 'PM2 重启服务失败',
  },

  // 12000 (user)
  [ResponseCode.UserNotFound]: {
    'en-US': 'User not found',
    'zh-CN': '用户未找到',
  },
  [ResponseCode.UserStorageExceeded]: {
    'en-US': 'User storage exceeded',
    'zh-CN': '用户存储空间超限',
  },
  [ResponseCode.UserStatusError]: {
    'en-US': 'User status error',
    'zh-CN': '用户状态错误',
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
  [ResponseCode.DraftGenerationMemoryNotFound]: {
    'en-US': 'Draft generation memory not found',
    'zh-CN': '草稿生成 memory 未找到',
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
  [ResponseCode.AccountRefreshTooFrequent]: {
    'en-US': 'Statistics refresh too frequent, please try again after 10 minutes',
    'zh-CN': '刷新过于频繁，请10分钟后再试',
  },
  [ResponseCode.AccountRefreshNotSupported]: {
    'en-US': 'This platform does not support manual statistics refresh',
    'zh-CN': '该平台暂不支持手动刷新统计数据',
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
  [ResponseCode.AssetTooLarge]: {
    'en-US': 'Asset too large',
    'zh-CN': '资源过大',
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
  [ResponseCode.MaterialGroupDefaultNotAllowed]: {
    'en-US': 'Default material group cannot be deleted',
    'zh-CN': '默认素材组不能删除',
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

  // 13200 (admin-operation)
  [ResponseCode.AdminOperationPasswordError]: {
    'en-US': 'Incorrect operation password',
    'zh-CN': '操作密码错误',
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
    'en-US': 'Account is not authorized. Please re-authorize the account.',
    'zh-CN': '账号未授权，请重新授权账号',
  },
  [ResponseCode.ChannelAuthorizationExpired]: {
    'en-US': 'Authorization expired. Please re-authorize the account.',
    'zh-CN': '授权已过期，请重新授权账号',
  },
  [ResponseCode.ChannelAccountInfoFailed]: {
    'en-US': 'Failed to get account information',
    'zh-CN': '账号信息获取失败',
  },
  [ResponseCode.PublishTaskNotFound]: {
    'en-US': 'Publish task not found',
    'zh-CN': '未发现任务',
  },
  [ResponseCode.ChannelCredentialNotFound]: {
    'en-US': 'Account credential not found. Please re-authorize the account.',
    'zh-CN': '账号授权凭证不存在，请重新授权账号',
  },
  [ResponseCode.ChannelRefreshTokenNotFound]: {
    'en-US': 'Refresh token not found. Please re-authorize the account.',
    'zh-CN': '刷新令牌不存在，请重新授权账号',
  },
  [ResponseCode.ChannelRefreshTokenExpired]: {
    'en-US': 'Refresh token expired. Please re-authorize the account.',
    'zh-CN': '刷新令牌已过期，请重新授权账号',
  },
  [ResponseCode.ChannelRefreshTokenFailed]: {
    'en-US': 'Failed to refresh authorization. Please re-authorize the account.',
    'zh-CN': '刷新授权失败，请重新授权账号',
  },
  [ResponseCode.ChannelAccessTokenFailed]: {
    'en-US': 'Failed to get access token. Please re-authorize the account.',
    'zh-CN': '获取访问令牌失败，请重新授权账号',
  },
  [ResponseCode.ChannelPlatformTokenNotFound]: {
    'en-US': 'Platform authorization token not found. Please re-authorize the account.',
    'zh-CN': '不存在平台授权令牌，请重新授权账号',
  },
  [ResponseCode.ChannelAuthTaskFailed]: {
    'en-US': 'Failed to create authorization task',
    'zh-CN': '创建授权任务失败',
  },
  [ResponseCode.ChannelAuthorizationFailed]: {
    'en-US': 'Authorization permission denied',
    'zh-CN': '授权权限不足',
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
  [ResponseCode.ChannelAccountCreateNotSupported]: {
    'en-US': 'This platform does not support account creation via this endpoint',
    'zh-CN': '该平台暂不支持通过此接口创建账号',
  },
  [ResponseCode.ChannelAccountAlreadyConnectedToAnotherUser]: {
    'en-US': 'This channel account is already connected to another user',
    'zh-CN': '该渠道账号已绑定到其他用户',
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
  [ResponseCode.PublishResourceUnavailable]: {
    'en-US': template.compile('Publish resource is not accessible: {{url}} (status: {{status}})'),
    'zh-CN': template.compile('发布资源不可访问：{{url}}（状态：{{status}}）'),
  },
  [ResponseCode.ChannelAuthSessionInvalid]: {
    'en-US': 'Invalid or expired authorization session',
    'zh-CN': '授权会话无效或已过期',
  },
  [ResponseCode.ChannelAuthPlatformMismatch]: {
    'en-US': 'Authorization platform does not match',
    'zh-CN': '授权平台不匹配',
  },
  [ResponseCode.ChannelAuthSessionCompleted]: {
    'en-US': 'Authorization session has already been completed',
    'zh-CN': '授权会话已完成',
  },
  [ResponseCode.ChannelAuthCsrfInvalid]: {
    'en-US': 'Invalid authorization security token',
    'zh-CN': '授权安全令牌无效',
  },
  [ResponseCode.ChannelAuthSelectableAccountsNotFound]: {
    'en-US': 'No selectable accounts found',
    'zh-CN': '未找到可选择的账号',
  },
  [ResponseCode.ChannelAuthSelectionRequired]: {
    'en-US': 'Select at least one account to continue',
    'zh-CN': '请至少选择一个账号继续',
  },
  [ResponseCode.ChannelAuthSelectedAccountUnavailable]: {
    'en-US': 'Selected account is not available in this authorization session',
    'zh-CN': '所选账号不属于当前授权会话',
  },
  [ResponseCode.ChannelAuthCodeMissing]: {
    'en-US': 'Authorization code is missing',
    'zh-CN': '缺少授权 code',
  },
  [ResponseCode.ChannelAuthRefreshTokenMissing]: {
    'en-US': 'Refresh token is missing',
    'zh-CN': '缺少刷新令牌',
  },
  [ResponseCode.ChannelAuthPlatformUidMissing]: {
    'en-US': 'Platform user ID is missing',
    'zh-CN': '缺少平台用户 ID',
  },
  [ResponseCode.ChannelAuthAccountAccessRevoked]: {
    'en-US': 'Account access has been revoked',
    'zh-CN': '账号访问权限已失效',
  },
  [ResponseCode.ChannelAuthCodeOrStateMissing]: {
    'en-US': 'Authorization code or state is missing',
    'zh-CN': '缺少授权 code 或 state',
  },
  [ResponseCode.ChannelOAuthIdentityAlreadyConnectedToAnotherUser]: {
    'en-US': 'This OAuth identity is already connected to another user',
    'zh-CN': '该 OAuth 身份已绑定到其他用户',
  },
  [ResponseCode.ChannelOAuthUserAlreadyConnectedToAnotherIdentity]: {
    'en-US': 'Current user has already connected another OAuth identity for this platform',
    'zh-CN': '当前用户已绑定该平台的其他 OAuth 身份',
  },
  [ResponseCode.PublishFlowNotFound]: {
    'en-US': 'Publish flow not found',
    'zh-CN': '发布流程未找到',
  },
  [ResponseCode.ChannelPublishValidationFailed]: {
    'en-US': 'Publish content validation failed',
    'zh-CN': '发布内容校验失败',
  },
  [ResponseCode.ChannelPublishDuplicateItem]: {
    'en-US': template.compile('Duplicate publish item for {{platform}} account {{accountId}}'),
    'zh-CN': template.compile('{{platform}} 账号 {{accountId}} 存在重复发布项'),
  },
  [ResponseCode.ChannelPublishMixedRelayAndLocalAccounts]: {
    'en-US': 'Cannot mix relay and local accounts in one publish flow',
    'zh-CN': '同一个发布流程不能混用中继账号和本地账号',
  },
  [ResponseCode.ChannelPublishQueueRemoveFailed]: {
    'en-US': 'Failed to remove publish task from queue',
    'zh-CN': '发布任务移出队列失败',
  },
  [ResponseCode.ChannelPublishPlatformCancelFailed]: {
    'en-US': 'Failed to cancel publish task on platform',
    'zh-CN': '平台侧取消发布任务失败',
  },
  [ResponseCode.ChannelPublishCancelNotSupported]: {
    'en-US': 'This platform does not support canceling scheduled publish tasks',
    'zh-CN': '该平台不支持取消已预约的发布任务',
  },
  [ResponseCode.ChannelPublishQueueFailed]: {
    'en-US': 'Failed to queue publish task',
    'zh-CN': '发布任务入队失败',
  },
  [ResponseCode.ChannelPublishTimeUpdateNotAllowed]: {
    'en-US': 'Publish time cannot be updated for this task status',
    'zh-CN': '当前任务状态不允许修改发布时间',
  },
  [ResponseCode.ChannelPublishNowNotAllowed]: {
    'en-US': 'This task status cannot be published now',
    'zh-CN': '当前任务状态不允许立即发布',
  },
  [ResponseCode.ChannelPublishUpdateNotAllowed]: {
    'en-US': 'This task status cannot be updated',
    'zh-CN': '当前任务状态不允许更新',
  },
  [ResponseCode.ChannelPublishPlatformWorkIdMissing]: {
    'en-US': 'Platform work ID is missing',
    'zh-CN': '缺少平台作品 ID',
  },
  [ResponseCode.ChannelPublishUpdateNotSupported]: {
    'en-US': 'This platform does not support updating published posts',
    'zh-CN': '该平台不支持更新已发布作品',
  },
  [ResponseCode.ChannelPublishPlatformNotSupported]: {
    'en-US': 'This platform does not support publishing',
    'zh-CN': '该平台不支持发布',
  },
  [ResponseCode.ChannelPublishPlatformStatusFailed]: {
    'en-US': template.compile('Platform publish failed with status {{status}}'),
    'zh-CN': template.compile('平台发布失败，状态码：{{status}}'),
  },
  [ResponseCode.ChannelPublishRetryNotAllowed]: {
    'en-US': 'This publish task cannot be retried',
    'zh-CN': '当前发布任务不允许重试',
  },
  [ResponseCode.ChannelWebhookNotSupported]: {
    'en-US': 'This platform does not support webhooks',
    'zh-CN': '该平台不支持 webhook',
  },
  [ResponseCode.ChannelWebhookChallengeNotSupported]: {
    'en-US': 'This platform does not support webhook challenge',
    'zh-CN': '该平台不支持 webhook 校验请求',
  },
  [ResponseCode.ChannelWebhookInvalidSignature]: {
    'en-US': 'Invalid webhook signature',
    'zh-CN': 'Webhook 签名无效',
  },
  [ResponseCode.ChannelWebhookInvalidVerifyToken]: {
    'en-US': 'Invalid webhook verify token',
    'zh-CN': 'Webhook verify token 无效',
  },
  [ResponseCode.ChannelWebhookChallengeCodeMissing]: {
    'en-US': 'Webhook challenge code is missing',
    'zh-CN': '缺少 webhook challenge code',
  },
  [ResponseCode.ChannelWebhookPublishFailed]: {
    'en-US': template.compile('Publish failed by {{platform}} webhook'),
    'zh-CN': template.compile('{{platform}} webhook 回调发布失败'),
  },
  [ResponseCode.ChannelPlatformApiFailed]: {
    'en-US': template.compile('{{platform}} platform API request failed'),
    'zh-CN': template.compile('{{platform}} 平台接口请求失败'),
  },
  [ResponseCode.ChannelPlatformServiceUnavailable]: {
    'en-US': template.compile('{{platform}} platform service is temporarily unavailable, please try again later'),
    'zh-CN': template.compile('{{platform}} 平台方服务异常，请稍后再试'),
  },
  [ResponseCode.ChannelPlatformRateLimited]: {
    'en-US': template.compile('{{platform}} platform API rate limit reached'),
    'zh-CN': template.compile('{{platform}} 平台接口触发频率限制'),
  },
  [ResponseCode.ChannelPlatformResponseInvalid]: {
    'en-US': template.compile('{{platform}} platform API returned an invalid response'),
    'zh-CN': template.compile('{{platform}} 平台接口返回数据无效'),
  },
  [ResponseCode.ChannelPlatformMediaUnsupported]: {
    'en-US': template.compile('{{platform}} does not support this media'),
    'zh-CN': template.compile('{{platform}} 不支持该媒体'),
  },
  [ResponseCode.ChannelPlatformMediaProcessingFailed]: {
    'en-US': template.compile('{{platform}} media processing failed'),
    'zh-CN': template.compile('{{platform}} 媒体处理失败'),
  },
  [ResponseCode.ChannelPlatformMediaProcessingTimeout]: {
    'en-US': template.compile('{{platform}} media processing timed out'),
    'zh-CN': template.compile('{{platform}} 媒体处理超时'),
  },
  [ResponseCode.ChannelPlatformAccountMissing]: {
    'en-US': template.compile('{{platform}} account information is missing'),
    'zh-CN': template.compile('缺少 {{platform}} 账号信息'),
  },
  [ResponseCode.ChannelPlatformPublishOptionMissing]: {
    'en-US': template.compile('{{platform}} publish option is missing'),
    'zh-CN': template.compile('缺少 {{platform}} 发布选项'),
  },
  [ResponseCode.ChannelPlatformPermissionMissing]: {
    'en-US': template.compile('{{platform}} account permission is missing'),
    'zh-CN': template.compile('{{platform}} 账号缺少所需权限'),
  },
  [ResponseCode.ChannelPlatformWorkNotFound]: {
    'en-US': template.compile('{{platform}} work was not found'),
    'zh-CN': template.compile('未找到 {{platform}} 作品'),
  },
  [ResponseCode.ChannelPlatformOperationNotSupported]: {
    'en-US': template.compile('{{platform}} does not support this operation'),
    'zh-CN': template.compile('{{platform}} 不支持该操作'),
  },
  [ResponseCode.ChannelPaginationModeNotSupported]: {
    'en-US': template.compile('{{platform}} does not support this pagination mode'),
    'zh-CN': template.compile('{{platform}} 不支持该分页模式'),
  },
  [ResponseCode.ChannelPaginationLimitExceeded]: {
    'en-US': template.compile('{{platform}} pagination limit exceeds the maximum'),
    'zh-CN': template.compile('{{platform}} 分页数量超过上限'),
  },
  [ResponseCode.ChannelPaginationPageSizeExceeded]: {
    'en-US': template.compile('{{platform}} pagination page size exceeds the maximum'),
    'zh-CN': template.compile('{{platform}} 分页页大小超过上限'),
  },
  [ResponseCode.ChannelPaginationDirectionNotSupported]: {
    'en-US': template.compile('{{platform}} does not support this pagination direction'),
    'zh-CN': template.compile('{{platform}} 不支持该分页方向'),
  },
  [ResponseCode.ChannelPublishPermalinkMissing]: {
    'en-US': 'Published work permalink is missing',
    'zh-CN': '缺少已发布作品链接',
  },
  [ResponseCode.ChannelAccountCreateRequiredFieldMissing]: {
    'en-US': 'Required channel account creation field is missing',
    'zh-CN': '缺少渠道账号创建必填字段',
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

  // 16000 (channel/work)
  [ResponseCode.WorkDetailNotFound]: {
    'en-US': 'Work detail not found',
    'zh-CN': '无法获取作品详情',
  },
  [ResponseCode.AccountAuthRequired]: {
    'en-US': 'This platform requires account authorization before submission',
    'zh-CN': '该平台需要先授权账号才能提交',
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

  // 19000 (api-key / relay)
  [ResponseCode.ApiKeyInvalid]: {
    'en-US': 'Invalid API key',
    'zh-CN': 'API Key 无效',
  },
  [ResponseCode.RelayServerUnavailable]: {
    'en-US': 'Relay server unavailable',
    'zh-CN': '中转服务器不可用',
  },
}
