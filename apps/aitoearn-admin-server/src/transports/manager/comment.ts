export enum ManagerStatus {
  STOP = 0, // 停用
  OPEN = 1, // 正常
  DELETE = 2, // 删除
}

export interface Manager {
  id: string
  account: string
  password: string
  salt: string
  name: string
  status: ManagerStatus
  avatar?: string
  mail?: string
  createAt: Date
  updatedAt: Date
}
