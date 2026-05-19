import http from '@/utils/request'
import type { GlobalKnowledgeItem } from './globalKnowledge'

export type CustomerRadarPlatform = 'douyin' | 'xhs' | 'wxSph' | 'bilibili'

export type CustomerRadarCommentSource = 'keyword_discovery' | 'owned_post_comments'

export type CustomerLeadIntent = 'high' | 'medium' | 'low'

export type CustomerLeadStatus
  = | 'new'
    | 'pending_approval'
    | 'approved'
    | 'contacted'
    | 'rejected'

export interface CustomerRadarProfile {
  industry: string
  region: string
  keywords: string[]
  painPoints: string[]
  excludedWords: string[]
  platforms: CustomerRadarPlatform[]
  commentSources: CustomerRadarCommentSource[]
  dailyLimit: number
  requireApproval: boolean
}

export interface CustomerLead {
  id: string
  customerId: string
  platform: CustomerRadarPlatform
  author: string
  avatarText: string
  sourceTitle: string
  sourceUrl: string
  signalText: string
  demandSummary: string
  intent: CustomerLeadIntent
  score: number
  status: CustomerLeadStatus
  suggestedReply: string
  nextAction: string
  createdAt: string
  tags: string[]
}

export interface CustomerInteraction {
  id: string
  at: string
  channel: CustomerRadarPlatform | 'wechat' | 'phone' | 'offline'
  type: 'comment' | 'dm' | 'note' | 'reply' | 'call'
  summary: string
  aiReply?: string
}

export interface CustomerRecord {
  id: string
  name: string
  company: string
  role: string
  platform: CustomerRadarPlatform
  city: string
  stage: 'new' | 'warming' | 'qualified' | 'contacted' | 'converted' | 'invalid'
  valueLevel: 'high' | 'medium' | 'low'
  owner: string
  lastTouchAt: string
  nextFollowUpAt?: string
  followUpNote?: string
  source: string
  tags: string[]
  memory: string[]
  interactions: CustomerInteraction[]
}

export type CustomerRadarAutomationStatus = 'idle' | 'scanning' | 'awaiting_approval' | 'publishing' | 'paused'

export type CustomerReplyCandidateStatus = 'draft' | 'approved' | 'published' | 'rejected'

export interface CustomerRadarAutomationRun {
  id: string
  name: string
  status: CustomerRadarAutomationStatus
  scannedCount: number
  collectedCount: number
  replyDraftCount: number
  publishedCount: number
  riskLevel: 'low' | 'medium' | 'high'
  mode: 'manual_approval' | 'full_auto'
  updatedAt: string
}

export interface CustomerRadarExecutionLog {
  id: string
  at: string
  level: 'info' | 'success' | 'warning' | 'error'
  title: string
  detail: string
}

export interface CustomerRadarPlatformCapability {
  platform: CustomerRadarPlatform
  available: boolean
  canScanComments: boolean
  canPublishComment: boolean
  canSendDirectMessage: boolean
  note: string
}

export type CustomerRadarTaskStatus = 'draft' | 'ready' | 'running' | 'paused' | 'completed' | 'failed'

export type CustomerRadarTaskType = 'keyword_discovery' | 'owned_post_reply' | 'hybrid'

export type CustomerRadarTaskCadence = 'manual' | 'hourly' | 'daily'

export interface CustomerRadarTask {
  id: string
  name: string
  type: CustomerRadarTaskType
  status: CustomerRadarTaskStatus
  cadence: CustomerRadarTaskCadence
  cooldownSeconds: number
  platforms: CustomerRadarPlatform[]
  commentSources: CustomerRadarCommentSource[]
  keywords: string[]
  dailyLimit: number
  dailyUsed: number
  failureCount: number
  maxFailures: number
  mode: CustomerRadarAutomationRun['mode']
  ownedPostWorkId?: string
  perRunLimit: number
  pluginRequired: boolean
  createdAt: string
  updatedAt: string
  nextRunAt: string
  lastLog: string
  runs?: CustomerRadarTaskRun[]
  stats: {
    scanned: number
    collected: number
    replies: number
    published: number
  }
}

export interface CustomerRadarTaskRun {
  id: string
  taskId: string
  taskName: string
  trigger: 'manual' | 'scheduled'
  status: 'completed' | 'paused' | 'failed'
  startedAt: string
  completedAt: string
  keyword: string
  commentSources: CustomerRadarCommentSource[]
  scanned: number
  collected: number
  candidates: number
  published: number
  revisited?: number
  skipped?: number
  leadIds: string[]
  candidateIds: string[]
  summary: string
}

export type CustomerRadarSocialLoginStatus = 'unknown' | 'logged_in' | 'not_logged_in' | 'expired'

export interface CustomerRadarSocialAccount {
  id: string
  platform: CustomerRadarPlatform
  nickname: string
  loginStatus: CustomerRadarSocialLoginStatus
  pluginConnected: boolean
  lastCheckedAt: string
  note: string
}

export interface CustomerReplyCandidate {
  id: string
  customerId: string
  leadId: string
  platform: CustomerRadarPlatform
  sourceType: CustomerRadarCommentSource
  workId?: string
  commentId?: string
  author: string
  sourceTitle: string
  commentContent: string
  customerMemory: string
  knowledgeRefs: string[]
  replyContent: string
  riskNote: string
  status: CustomerReplyCandidateStatus
}

export interface CustomerRadarScanRequest {
  profile: CustomerRadarProfile
}

export interface CustomerRadarScanResponse {
  leads: CustomerLead[]
}

export interface CustomerReplyGenerationRequest {
  candidate: CustomerReplyCandidate
  customer?: CustomerRecord
  knowledgeRefs?: GlobalKnowledgeItem[]
  profile?: CustomerRadarProfile
}

export interface CustomerReplyGenerationResponse {
  model: string
  replyContent: string
  source: 'fallback' | 'global' | 'tenant'
  warning?: string
}

export interface CustomerRadarWorkspace {
  automationRun: CustomerRadarAutomationRun
  automationTasks?: CustomerRadarTask[]
  customerRecords: CustomerRecord[]
  executionLogs: CustomerRadarExecutionLog[]
  leads: CustomerLead[]
  ownedPostWorkId?: string
  ownedPostXsecToken?: string
  platformCapabilities: CustomerRadarPlatformCapability[]
  profile: CustomerRadarProfile
  replyCandidates: CustomerReplyCandidate[]
  socialAccounts?: CustomerRadarSocialAccount[]
  taskRuns?: CustomerRadarTaskRun[]
  liveExecutionEnabled?: boolean
}

export interface CustomerRadarTenantContext {
  aiMode?: 'global' | 'tenant'
  customerName: string
  dailyLimit: number
  expiresAt?: string
  mail: string
  maxSeats: number
  packageName: string
  perRunLimit: number
  status: 'active' | 'paused' | 'trial'
  tenantId: string
  userId: string
}

export interface CustomerRadarTenantAiConfig {
  anthropicApiKey?: string
  anthropicBaseUrl?: string
  defaultChatModel?: string
  geminiApiKey?: string
  grokApiKey?: string
  mode: 'global' | 'tenant'
  openaiApiKey?: string
  openaiBaseUrl?: string
  provider: 'anthropic' | 'gemini' | 'grok' | 'openai' | 'volcengine'
  volcengineApiKey?: string
}

export const customerRadarApi = {
  getTenantContext() {
    return http.get<CustomerRadarTenantContext>('customer-radar/tenant-context', undefined, true)
  },
  getWorkspace() {
    return http.get<CustomerRadarWorkspace | null>('customer-radar/workspace', undefined, true)
  },
  getTenantAiConfig() {
    return http.get<CustomerRadarTenantAiConfig>('customer-radar/tenant-ai-config', undefined, true)
  },
  saveTenantAiConfig(data: CustomerRadarTenantAiConfig) {
    return http.post<CustomerRadarTenantAiConfig>('customer-radar/tenant-ai-config', data, true)
  },
  saveWorkspace(data: CustomerRadarWorkspace) {
    return http.post<CustomerRadarWorkspace>('customer-radar/workspace', data, true)
  },
  scan(data: CustomerRadarScanRequest) {
    return http.post<CustomerRadarScanResponse>('customer-radar/scan', data)
  },
  approveLead(leadId: string) {
    return http.post<{ success: boolean }>('customer-radar/leads/approve', { leadId })
  },
  rejectLead(leadId: string) {
    return http.post<{ success: boolean }>('customer-radar/leads/reject', { leadId })
  },
  getCustomers() {
    return http.get<CustomerRecord[]>('customer-radar/customers')
  },
  getKnowledgeBase() {
    return http.get<GlobalKnowledgeItem[]>('knowledge-base')
  },
  createAutomationRun(data: { profile: CustomerRadarProfile }) {
    return http.post<CustomerRadarAutomationRun>('customer-radar/automation-runs', data)
  },
  approveReply(candidateId: string) {
    return http.post<{ success: boolean }>('customer-radar/reply-candidates/approve', { candidateId })
  },
  publishReply(candidateId: string) {
    return http.post<{ success: boolean }>('customer-radar/reply-candidates/publish', { candidateId })
  },
  generateReplyCandidate(data: CustomerReplyGenerationRequest) {
    return http.post<CustomerReplyGenerationResponse>('customer-radar/reply-candidates/generate', data, true)
  },
}
