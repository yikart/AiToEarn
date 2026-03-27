import template from 'art-template'
import { ResponseCode } from '../enums'

export type Locale = 'en-US' | 'zh-CN' | 'ja-JP'

// 消息可以是字符串或预编译的模板函数
type MessageValue = string | ((data: unknown) => string
)
export const messages: Record<ResponseCode, Record<Locale, MessageValue>> = {
  [ResponseCode.Success]: {
    'en-US': 'Success',
    'zh-CN': '请求成功',
    'ja-JP': '成功しました',
  },

  // 10000 (common)
  [ResponseCode.MailSendFail]: {
    'en-US': 'Failed to send email',
    'zh-CN': '邮件发送失败',
    'ja-JP': 'メールの送信に失敗しました',
  },
  [ResponseCode.ValidationFailed]: {
    'en-US': 'Validation failed',
    'zh-CN': '参数验证失败',
    'ja-JP': 'バリデーションに失敗しました',
  },
  [ResponseCode.TooManyRequests]: {
    'en-US': template.compile('Too many requests, please try again after {{ttl}} seconds'),
    'zh-CN': template.compile('请求过于频繁，请在{{ttl}}秒后重试'),
    'ja-JP': template.compile('リクエストが多すぎます。{{ttl}}秒後にお試しください'),
  },
  [ResponseCode.SmsSendFail]: {
    'en-US': 'Failed to send SMS',
    'zh-CN': '短信发送失败',
    'ja-JP': 'SMSの送信に失敗しました',
  },

  // 10100 (s3)
  [ResponseCode.S3DownloadFileFailed]: {
    'en-US': 'Failed to download file from S3',
    'zh-CN': 'S3 文件下载失败',
    'ja-JP': 'S3からのファイルダウンロードに失敗しました',
  },

  // 12000 (user)
  [ResponseCode.UserNotFound]: {
    'en-US': 'User not found',
    'zh-CN': '用户未找到',
    'ja-JP': 'ユーザーが見つかりません',
  },
  [ResponseCode.UserCreditsInsufficient]: {
    'en-US': 'Insufficient user credits',
    'zh-CN': '用户Credits不足',
    'ja-JP': 'クレジットが不足しています',
  },
  [ResponseCode.UserStatusError]: {
    'en-US': 'User status error',
    'zh-CN': '用户状态错误',
    'ja-JP': 'ユーザーステータスエラー',
  },
  [ResponseCode.UserLoginCodeError]: {
    'en-US': 'Incorrect login code',
    'zh-CN': '登录验证码错误',
    'ja-JP': 'ログインコードが正しくありません',
  },

  // 12300 (ai)
  [ResponseCode.InvalidModel]: {
    'en-US': 'Invalid AI model',
    'zh-CN': '无效的 AI 模型',
    'ja-JP': '無効なAIモデルです',
  },
  [ResponseCode.AiCallFailed]: {
    'en-US': template.compile('AI call failed: {{error}}'),
    'zh-CN': template.compile('AI 调用失败：{{error}}'),
    'ja-JP': template.compile('AI呼び出しに失敗しました：{{error}}'),
  },
  [ResponseCode.InvalidAiTaskId]: {
    'en-US': 'Invalid AI task ID',
    'zh-CN': '无效的 AI 任务 ID',
    'ja-JP': '無効なAIタスクIDです',
  },
  [ResponseCode.AiLogNotFound]: {
    'en-US': 'AI log not found',
    'zh-CN': 'AI 日志未找到',
    'ja-JP': 'AIログが見つかりません',
  },
  [ResponseCode.VideoUploadVidNotFound]: {
    'en-US': 'Failed to get video ID from upload result',
    'zh-CN': '从上传结果中获取视频 ID 失败',
    'ja-JP': 'アップロード結果から動画IDを取得できませんでした',
  },
  [ResponseCode.VideoUploadFailed]: {
    'en-US': 'Video upload task failed',
    'zh-CN': '视频上传任务失败',
    'ja-JP': '動画アップロードタスクに失敗しました',
  },

  // 12400 (notification)
  [ResponseCode.NotificationNotFound]: {
    'en-US': 'Notification not found',
    'zh-CN': '通知未找到',
    'ja-JP': '通知が見つかりません',
  },

  // 12600 (account)
  [ResponseCode.AccountNotFound]: {
    'en-US': 'Account not found',
    'zh-CN': '账号未找到',
    'ja-JP': 'アカウントが見つかりません',
  },
  [ResponseCode.AccountGroupNotFound]: {
    'en-US': 'Account group not found',
    'zh-CN': '账号分组未找到',
    'ja-JP': 'アカウントグループが見つかりません',
  },
  [ResponseCode.AccountCreateFailed]: {
    'en-US': 'Account create failed',
    'zh-CN': '账号创建失败',
    'ja-JP': 'アカウントの作成に失敗しました',
  },

  // 12700 (media)
  [ResponseCode.MediaNotFound]: {
    'en-US': 'Media not found',
    'zh-CN': '媒体文件未找到',
    'ja-JP': 'メディアファイルが見つかりません',
  },
  [ResponseCode.MediaGroupNotFound]: {
    'en-US': 'Media group not found',
    'zh-CN': '媒体分组未找到',
    'ja-JP': 'メディアグループが見つかりません',
  },
  [ResponseCode.MediaGroupDefaultNotAllowed]: {
    'en-US': 'Default media group cannot be deleted',
    'zh-CN': '默认媒体组不能删除',
    'ja-JP': 'デフォルトメディアグループは削除できません',
  },

  // 12750 (assets)
  [ResponseCode.AssetNotFound]: {
    'en-US': 'Asset not found',
    'zh-CN': '资源未找到',
    'ja-JP': 'アセットが見つかりません',
  },
  [ResponseCode.AssetUploadFailed]: {
    'en-US': 'Failed to upload asset',
    'zh-CN': '资源上传失败',
    'ja-JP': 'アセットのアップロードに失敗しました',
  },

  // 12800 (material)
  [ResponseCode.MaterialNotFound]: {
    'en-US': 'Material not found',
    'zh-CN': '素材未找到',
    'ja-JP': '素材が見つかりません',
  },
  [ResponseCode.MaterialGroupNotFound]: {
    'en-US': 'Material group not found',
    'zh-CN': '素材分组未找到',
    'ja-JP': '素材グループが見つかりません',
  },
  [ResponseCode.MaterialGroupDefaultNotAllowed]: {
    'en-US': 'Default material group cannot be deleted',
    'zh-CN': '默认素材组不能删除',
    'ja-JP': 'デフォルト素材グループは削除できません',
  },
  [ResponseCode.MaterialAdaptationNotFound]: {
    'en-US': 'Material adaptation not found',
    'zh-CN': '素材适配内容未找到',
    'ja-JP': '素材適合内容が見つかりません',
  },
  [ResponseCode.MaterialAdaptationFailed]: {
    'en-US': 'Failed to adapt material',
    'zh-CN': '素材适配失败',
    'ja-JP': '素材の適合に失敗しました',
  },

  // 15000 (channel/publish)
  [ResponseCode.PublishRecordNotFound]: {
    'en-US': 'publish record with flowId {{flowId}} not found.',
    'zh-CN': '发布记录未找到',
    'ja-JP': '公開記録が見つかりません',
  },
  [ResponseCode.ChannelAuthorizationExpired]: {
    'en-US': 'Authorization expired',
    'zh-CN': '授权已过期',
    'ja-JP': '認証の有効期限が切れています',
  },
  [ResponseCode.ChannelAccountInfoFailed]: {
    'en-US': 'Failed to get account information',
    'zh-CN': '账号信息获取失败',
    'ja-JP': 'アカウント情報の取得に失敗しました',
  },
  [ResponseCode.PublishTaskNotFound]: {
    'en-US': 'Publish task not found',
    'zh-CN': '未发现任务',
    'ja-JP': 'タスクが見つかりません',
  },
  [ResponseCode.ChannelWebhookFailed]: {
    'en-US': 'Webhook processing failed',
    'zh-CN': 'Webhook 处理失败',
    'ja-JP': 'Webhook処理に失敗しました',
  },
  [ResponseCode.ChannelRefreshTokenFailed]: {
    'en-US': 'refresh Token failed for accountId: {{accountId}}',
    'zh-CN': '刷新令牌失败',
    'ja-JP': 'トークンの更新に失敗しました',
  },
  [ResponseCode.ChannelAccessTokenFailed]: {
    'en-US': 'Failed to get access token',
    'zh-CN': '获取访问令牌失败',
    'ja-JP': 'アクセストークンの取得に失敗しました',
  },
  [ResponseCode.ChannelPlatformTokenNotFound]: {
    'en-US': 'Platform authorization token not found',
    'zh-CN': '不存在平台授权令牌',
    'ja-JP': 'プラットフォーム認証トークンが見つかりません',
  },
  [ResponseCode.ChannelAuthTaskFailed]: {
    'en-US': 'Failed to create authorization task',
    'zh-CN': '创建授权任务失败',
    'ja-JP': '認証タスクの作成に失敗しました',
  },
  [ResponseCode.PublishTaskFailed]: {
    'en-US': 'task publish failed, accountType: {{accountType}}',
    'zh-CN': '任务发布失败',
    'ja-JP': 'タスクの公開に失敗しました',
  },
  [ResponseCode.PublishTaskInProgress]: {
    'en-US': 'Task is in progress and cannot be deleted',
    'zh-CN': '任务正在执行中，无法删除',
    'ja-JP': 'タスクが実行中のため削除できません',
  },
  [ResponseCode.PublishTaskStatusInvalid]: {
    'en-US': 'Task has been published or is in progress',
    'zh-CN': '任务已发布或正在进行中',
    'ja-JP': 'タスクは公開済みまたは実行中です',
  },
  [ResponseCode.EngagementTaskInProgress]: {
    'en-US': 'Reply task for this post is already in progress',
    'zh-CN': '该帖子的回复任务已在进行中',
    'ja-JP': 'この投稿の返信タスクは既に進行中です',
  },
  [ResponseCode.ChannelAccountNotFound]: {
    'en-US': 'Account not found',
    'zh-CN': '账户不存在',
    'ja-JP': 'アカウントが見つかりません',
  },
  [ResponseCode.InteractAccountTypeNotSupported]: {
    'en-US': 'Account type not supported for interaction',
    'zh-CN': '暂不支持该账户类型',
    'ja-JP': 'このアカウントタイプはサポートされていません',
  },
  [ResponseCode.InteractRecordNotFound]: {
    'en-US': 'Publish record not found',
    'zh-CN': '未找到发布记录',
    'ja-JP': '公開記録が見つかりません',
  },
  [ResponseCode.DataCubeAccountTypeNotSupported]: {
    'en-US': 'Account type not supported for data cube',
    'zh-CN': '暂不支持该账户类型',
    'ja-JP': 'このアカウントタイプはサポートされていません',
  },
  [ResponseCode.ChannelPublishTaskAlreadyExists]: {
    'en-US': 'publish task with flowId {{flowId}} already exists',
    'zh-CN': '发布任务已存在',
    'ja-JP': '公開タスクは既に存在します',
  },
  [ResponseCode.PublishTaskNotPublished]: {
    'en-US': 'Publish task not published',
    'zh-CN': '发布任务未发布',
    'ja-JP': '公開タスクは公開されていません',
  },
  [ResponseCode.PostCategoryNotSupported]: {
    'en-US': 'Post category not supported for update published post',
    'zh-CN': '暂不支持该帖子类型',
    'ja-JP': 'この投稿タイプはサポートされていません',
  },
  [ResponseCode.PlatformNotSupported]: {
    'en-US': 'Platform not supported for update published post',
    'zh-CN': '暂不支持该平台',
    'ja-JP': 'このプラットフォームはサポートされていません',
  },
  [ResponseCode.PublishTaskUpdateFailed]: {
    'en-US': 'Failed to update publish task',
    'zh-CN': '更新发布任务失败',
    'ja-JP': '公開タスクの更新に失敗しました',
  },
  [ResponseCode.DeletePostFailed]: {
    'en-US': 'Failed to delete post',
    'zh-CN': '删除作品失败',
    'ja-JP': '投稿の削除に失敗しました',
  },
  [ResponseCode.PublishTaskInvalid]: {
    'en-US': 'Publish task invalid',
    'zh-CN': '发布任务无效',
    'ja-JP': '公開タスクが無効です',
  },
  [ResponseCode.InvalidWorkLink]: {
    'en-US': 'Invalid work link',
    'zh-CN': '作品链接无效',
    'ja-JP': '作品リンクが無効です',
  },
  [ResponseCode.WorkNotBelongToAccount]: {
    'en-US': 'The work does not belong to this account',
    'zh-CN': '该作品不属于此账号',
    'ja-JP': 'この作品はこのアカウントに属していません',
  },

  // 15100 (short-link)
  [ResponseCode.ShortLinkNotFound]: {
    'en-US': 'Short link not found',
    'zh-CN': '短链接不存在',
    'ja-JP': '短縮リンクが見つかりません',
  },

  // 16000 (task)
  [ResponseCode.WorkDetailNotFound]: {
    'en-US': 'Work detail not found',
    'zh-CN': '无法获取作品详情',
    'ja-JP': '作品の詳細を取得できません',
  },
  [ResponseCode.AccountAuthRequired]: {
    'en-US': 'This platform requires account authorization before submission',
    'zh-CN': '该平台需要先授权账号才能提交',
    'ja-JP': 'このプラットフォームは送信前にアカウント認証が必要です',
  },

  // 16050 (task-material)
  [ResponseCode.MaterialGroupPlatformMismatch]: {
    'en-US': 'Material group platform does not match task platforms',
    'zh-CN': '草稿箱平台限制与任务平台不匹配',
    'ja-JP': '下書きボックスのプラットフォーム制限がタスクプラットフォームと一致しません',
  },

  // 18100 (agent)
  [ResponseCode.AgentTaskNotFound]: {
    'en-US': 'Agent task not found',
    'zh-CN': '代理任务未找到',
    'ja-JP': 'エージェントタスクが見つかりません',
  },
  [ResponseCode.AgentTaskStatusInvalid]: {
    'en-US': 'Agent task status is invalid',
    'zh-CN': '代理任务状态无效',
    'ja-JP': 'エージェントタスクのステータスが無効です',
  },
  [ResponseCode.AgentTaskFailed]: {
    'en-US': 'Agent task failed',
    'zh-CN': '代理任务失败',
    'ja-JP': 'エージェントタスクに失敗しました',
  },
  [ResponseCode.AgentTaskTimeout]: {
    'en-US': 'Agent task timeout: task has been running for too long without updates',
    'zh-CN': '代理任务超时：任务运行时间过长且未更新',
    'ja-JP': 'エージェントタスクがタイムアウトしました：タスクが長時間実行されており更新がありません',
  },
  [ResponseCode.AgentTaskNotRunning]: {
    'en-US': 'Agent task is not running',
    'zh-CN': '代理任务未在运行状态',
    'ja-JP': 'エージェントタスクは実行中ではありません',
  },
  [ResponseCode.AgentSessionRecoveryFailed]: {
    'en-US': 'Failed to recover agent session, please try to create a new conversation',
    'zh-CN': '恢复代理任务会话失败, 请尝试新建会话',
    'ja-JP': 'エージェントセッションの復元に失敗しました。新しい会話を作成してください',
  },

  // 18400 (tools)
  [ResponseCode.QrCodeArtImageNotFound]: {
    'en-US': 'QR code art image not found',
    'zh-CN': '二维码艺术图未找到',
    'ja-JP': 'QRコードアート画像が見つかりません',
  },

  // 19000 (api-key / relay)
  [ResponseCode.ApiKeyInvalid]: {
    'en-US': 'Invalid API key',
    'zh-CN': 'API Key 无效',
    'ja-JP': 'API Keyが無効です',
  },
  [ResponseCode.RelayServerUnavailable]: {
    'en-US': 'Relay server unavailable',
    'zh-CN': '中转服务器不可用',
    'ja-JP': 'リレーサーバーが利用できません',
  },
}
