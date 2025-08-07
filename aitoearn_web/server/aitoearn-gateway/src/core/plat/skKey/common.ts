export enum SkKeyStatus {
  NORMAL = 1, // 可用
  ABNORMAL = 0, // 不可用
}

export interface SkKey {
  id: string
  key: string
  desc: string
  status: SkKeyStatus
  userId: string
  createAt: Date
  updatedAt: Date
}
