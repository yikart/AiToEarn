export interface GlobalKnowledgeDto {
  category: string
  enabled: boolean
  replyUse: string
  scope: string
  summary: string
  tags: string[]
  title: string
}

export interface CustomerRadarWorkspaceDto {
  automationRun: Record<string, unknown>
  automationTasks?: Record<string, unknown>[]
  customerRecords: Record<string, unknown>[]
  executionLogs: Record<string, unknown>[]
  leads: Record<string, unknown>[]
  liveExecutionEnabled?: boolean
  ownedPostWorkId?: string
  ownedPostXsecToken?: string
  platformCapabilities: Record<string, unknown>[]
  profile: Record<string, unknown>
  replyCandidates: Record<string, unknown>[]
  socialAccounts?: Record<string, unknown>[]
  taskRuns?: Record<string, unknown>[]
}

export interface SystemAiConfigDto {
  anthropicApiKey?: string
  anthropicBaseUrl?: string
  defaultChatModel?: string
  geminiApiKey?: string
  grokApiKey?: string
  openaiApiKey?: string
  openaiBaseUrl?: string
  volcengineApiKey?: string
}

export interface CustomerTenantPlanDto {
  userId: string
  aiMode?: 'global' | 'tenant'
  customerName?: string
  packageName: string
  status: 'active' | 'paused' | 'trial'
  dailyLimit: number
  perRunLimit: number
  maxSeats: number
  expiresAt?: string
  notes?: string
}

export interface CustomerTenantSettingsDto {
  tenants: CustomerTenantPlanDto[]
}

export interface CustomerTenantAiConfigDto {
  anthropicApiKey?: string
  anthropicBaseUrl?: string
  defaultChatModel?: string
  geminiApiKey?: string
  grokApiKey?: string
  mode?: 'global' | 'tenant'
  openaiApiKey?: string
  openaiBaseUrl?: string
  provider?: 'anthropic' | 'gemini' | 'grok' | 'openai' | 'volcengine'
  volcengineApiKey?: string
}

export interface CustomerReplyGenerationDto {
  candidate: Record<string, unknown>
  customer?: Record<string, unknown>
  knowledgeRefs?: Array<Record<string, unknown> | string>
  profile?: Record<string, unknown>
}
