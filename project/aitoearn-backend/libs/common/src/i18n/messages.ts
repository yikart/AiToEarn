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
  [ResponseCode.SmsSendFail]: {
    'en-US': 'Failed to send SMS',
    'zh-CN': '短信发送失败',
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
  [ResponseCode.UserPasswordError]: {
    'en-US': 'Incorrect password',
    'zh-CN': '密码错误',
  },
  [ResponseCode.UserLoginCodeError]: {
    'en-US': 'Incorrect login code',
    'zh-CN': '登录验证码错误',
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
  [ResponseCode.StatusPageIncidentNotFound]: {
    'en-US': 'Status page incident not found',
    'zh-CN': '状态页事件未找到',
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

  // 15100 (short-link)
  [ResponseCode.ShortLinkNotFound]: {
    'en-US': 'Short link not found',
    'zh-CN': '短链接不存在',
  },
  [ResponseCode.ShortLinkExpired]: {
    'en-US': 'Short link has expired',
    'zh-CN': '短链接已过期',
  },

  // 16000 (work validation)
  [ResponseCode.WorkDataIdNotFound]: {
    'en-US': 'Work data ID not found',
    'zh-CN': '作品数据ID未找到',
  },
  [ResponseCode.WorkLinkInfoNotFound]: {
    'en-US': 'Work link info not found',
    'zh-CN': '无法解析作品链接信息',
  },
  [ResponseCode.WorkDetailNotFound]: {
    'en-US': 'Work detail not found',
    'zh-CN': '无法获取作品详情',
  },
  [ResponseCode.AccountAuthRequired]: {
    'en-US': 'This platform requires account authorization',
    'zh-CN': '该平台需要先授权账号',
  },
  [ResponseCode.WorkAlreadyDeleted]: {
    'en-US': 'The work has been deleted and cannot be captured',
    'zh-CN': '作品已删除，无法抓取数据',
  },
  [ResponseCode.MaterialGroupPlatformMismatch]: {
    'en-US': 'Material group platform does not match selected platforms',
    'zh-CN': '草稿箱平台限制与所选平台不匹配',
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
  [ResponseCode.AgentAnalysisNotFound]: {
    'en-US': 'Agent analysis record not found',
    'zh-CN': '代理分析记录未找到',
  },
  [ResponseCode.AgentWeekSummaryNotFound]: {
    'en-US': 'Agent week summary not found',
    'zh-CN': '代理周总结未找到',
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
