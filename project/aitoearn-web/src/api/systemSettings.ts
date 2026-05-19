import http from '@/utils/request'

export interface SystemAiConfig {
  anthropicApiKey?: string
  anthropicBaseUrl?: string
  defaultChatModel?: string
  geminiApiKey?: string
  grokApiKey?: string
  openaiApiKey?: string
  openaiBaseUrl?: string
  volcengineApiKey?: string
}

export interface CustomerTenantPlan {
  aiMode?: 'global' | 'tenant'
  customerName: string
  dailyLimit: number
  expiresAt?: string
  failureCount?: number
  lastActiveAt?: string
  mail: string
  maxSeats: number
  metrics?: {
    customers: number
    leads: number
    tasks: number
  }
  notes?: string
  packageName: string
  perRunLimit: number
  status: 'active' | 'paused' | 'trial'
  tenantId: string
  userId: string
}

export const systemSettingsApi = {
  getAiConfig() {
    return http.get<SystemAiConfig>('system/ai-config', undefined, true)
  },
  saveAiConfig(data: SystemAiConfig) {
    return http.post<SystemAiConfig>('system/ai-config', data)
  },
  getCustomerTenants() {
    return http.get<CustomerTenantPlan[]>('system/customer-tenants', undefined, true)
  },
  saveCustomerTenants(tenants: CustomerTenantPlan[]) {
    return http.post<{ tenants: CustomerTenantPlan[] }>('system/customer-tenants', { tenants })
  },
}
