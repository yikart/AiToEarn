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

  /** AI图片异步生成队列 */
  AiImageAsync = 'ai_image_async',

  /** 互动任务分发队列 */
  EngagementTaskDistribution = 'engagement_task_distribution',

  /** 评论回复任务队列 */
  EngagementReplyToComment = 'engagement_reply_to_comment_task',
}
