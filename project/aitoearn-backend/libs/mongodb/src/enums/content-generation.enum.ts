export enum ContentGenerationTaskStatus {
  Running = 'running',
  Completed = 'completed',
  RequiresAction = 'requires_action', // 需要用户操作（如绑定频道、更新授权等）
  Error = 'error',
  Aborted = 'aborted',
}
