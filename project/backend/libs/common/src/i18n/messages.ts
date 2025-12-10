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

  // 10100 (s3)
  [ResponseCode.S3DownloadFileFailed]: {
    'en-US': 'Failed to download file from S3',
    'zh-CN': 'S3 文件下载失败',
  },
  [ResponseCode.S3UploadFailed]: {
    'en-US': 'Failed to upload file to S3',
    'zh-CN': 'S3文件上传失败',
  },

  // 12000 (user)
  [ResponseCode.UserNotFound]: {
    'en-US': 'User not found',
    'zh-CN': '用户未找到',
  },
  [ResponseCode.UserPointsInsufficient]: {
    'en-US': 'Insufficient user points',
    'zh-CN': '用户积分不足',
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

  // 12400 (notification)
  [ResponseCode.NotificationNotFound]: {
    'en-US': 'Notification not found',
    'zh-CN': '通知未找到',
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

  // 12700 (media)
  [ResponseCode.MediaNotFound]: {
    'en-US': 'Media not found',
    'zh-CN': '媒体文件未找到',
  },
  [ResponseCode.MediaGroupNotFound]: {
    'en-US': 'Media group not found',
    'zh-CN': '媒体分组未找到',
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
  [ResponseCode.ChannelSkKeyRequired]: {
    'en-US': 'skKey is required',
    'zh-CN': '缺少 skKey 参数',
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
  [ResponseCode.SkKeyAccountNotFound]: {
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
  [ResponseCode.ApiKeyNotFound]: {
    'en-US': 'API key not found',
    'zh-CN': 'API 密钥未找到',
  },
}
