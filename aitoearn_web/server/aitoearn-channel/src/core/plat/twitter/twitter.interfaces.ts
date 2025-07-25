export interface TwitterOAuthTaskInfo {
  state: string
  codeVerifier: string
  userId: string
  status: 0 | 1
  accountId?: string
  taskId: string
}
