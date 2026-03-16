/**
 * 队列名称枚举
 * 统一管理所有队列的名称
 */
export enum QueueName {
  /** 素材生成队列 */
  MaterialGenerate = 'bull_material_generate',

  /** 发布任务队列 */
  PostPublish = 'post_publish',

  /** 发布媒体任务队列（Meta平台） */
  PostMediaTask = 'post_media_task',

  /** 任务自动审核队列 */
  TaskAudit = 'bull_aotu_task_audit',

  /** AI图片异步生成队列 */
  AiImageAsync = 'ai_image_async',

  /** 互动任务分发队列 */
  EngagementTaskDistribution = 'engagement_task_distribution',

  /** 评论回复任务队列 */
  EngagementReplyToComment = 'engagement_reply_to_comment_task',

  /** dump social media avatar queue */
  DumpSocialMediaAvatar = 'dump_social_media_avatar',

  /** 更新发布任务队列 */
  UpdatePublishedPost = 'update_published_post',

  /** 用户创建时推送任务队列 */
  TaskUserCreatePush = 'task_user_create_push',

  /** 用户画像上报队列 */
  TaskUserPortraitReport = 'task_user_portrait_report',

  /** 频道账号画像上报队列 */
  TaskAccountPortraitReport = 'task_account_portrait_report',

  /** 支付 Webhook 处理队列 */
  PaymentWebhookProcess = 'payment_webhook_process',

  /** Credits 购买处理队列 */
  CreditsPurchase = 'credits_purchase',

  /** Credits 退款处理队列 */
  CreditsRefund = 'credits_refund',

  /** 内容生成队列 */
  ContentGenerationTask = 'content_generation_task',

  /** 通知队列 */
  Notification = 'bull_notification',

  /** DraftGeneration 生成队列 */
  DraftGeneration = 'place_draft_generation',

  /** 用户任务异步验证队列（作品详情获取 + AI 检测） */
  UserTaskAiVerify = 'user_task_ai_verify',
}
