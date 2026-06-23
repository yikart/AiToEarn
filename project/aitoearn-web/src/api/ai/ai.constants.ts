/**
 * AgentTaskStatus 枚举。
 */
export enum AgentTaskStatus {
  // 前端 UI 展示用的状态（SSE 流式推送时使用，不存储到数据库）
  Thinking = 'THINKING', // 思考中
  Waiting = 'WAITING', // 等待
  GeneratingContent = 'GENERATING_CONTENT', // 内容生成中
  GeneratingImage = 'GENERATING_IMAGE', // 图片生成中
  GeneratingVideo = 'GENERATING_VIDEO', // 视频生成中
  GeneratingText = 'GENERATING_TEXT', // 文本生成中

  // 与后端数据库一致的状态（@yikart/mongodb ContentGenerationTaskStatus）
  Running = 'running', // 运行中
  Completed = 'completed', // 完成
  RequiresAction = 'requires_action', // 需要用户操作（如绑定频道等）
  Error = 'error', // 错误
  Aborted = 'aborted', // 中止
}

/**
 * MediaType 枚举。
 */
export enum MediaType {
  Video = 'VIDEO',
  Image = 'IMAGE',
}
