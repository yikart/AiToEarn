export interface GetKwaiAuthStatusRes {
  taskId: string
  transpond?: string
  accountAddPath?: string
  data?: {
    userId: string
  }
  status: -1 | 0 | 1
  error?: string
}
