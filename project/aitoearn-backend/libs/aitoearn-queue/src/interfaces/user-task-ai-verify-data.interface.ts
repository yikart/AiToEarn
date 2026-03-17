/**
 * 用户任务异步验证数据（作品详情获取 + AI 检测）
 */
export interface UserTaskAiVerifyData {
  /** 用户任务ID */
  userTaskId: string
  /** 平台类型，用于获取作品详情 */
  accountType?: string
  /** 账号 ID，用于 OAuth 授权获取详情 */
  accountId?: string
  /** 作品链接 */
  workLink: string
  /** 作品 dataId */
  dataId: string
}
