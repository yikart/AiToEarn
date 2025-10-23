export interface AppConfigs {
  id: string
  appId: string
  key: string
  value: any
  description?: string
  enabled: boolean
  metadata?: Record<string, any>
  createAt: Date
  updatedAt: Date
}
