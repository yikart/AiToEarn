export interface AccountGroup {
  id: string
  userId: string
  isDefault: boolean
  ip?: string
  location?: string
  proxyIp?: string
  name: string
  rank: number
  createAt: Date
  updatedAt: Date
}
