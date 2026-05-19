import { Injectable, Logger } from '@nestjs/common'
import {
  CustomerRadarWorkspace,
  CustomerRadarWorkspaceRepository,
  GlobalKnowledge,
  GlobalKnowledgeRepository,
  LeanDoc,
  SystemSettingRepository,
  UserRepository,
} from '@yikart/mongodb'
import { CustomerRadarWorkspaceDto, CustomerReplyGenerationDto, CustomerTenantAiConfigDto, CustomerTenantPlanDto, CustomerTenantSettingsDto, GlobalKnowledgeDto, SystemAiConfigDto } from './customer-growth.dto'

function documentId(doc: { _id: unknown, id?: string }) {
  return doc.id || String(doc._id)
}

function formatDate(value?: Date) {
  return value ? value.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
}

const TENANT_SETTINGS_KEY = 'customer-tenants'
const tenantAiConfigKey = (userId: string) => `customer-tenant-ai-config:${userId}`

const defaultTenantPlan: Omit<CustomerTenantPlanDto, 'userId'> = {
  aiMode: 'global',
  customerName: '',
  dailyLimit: 80,
  maxSeats: 1,
  packageName: '增长标准版',
  perRunLimit: 12,
  status: 'trial',
}

const defaultTenantAiConfig: CustomerTenantAiConfigDto = {
  anthropicBaseUrl: 'https://api.anthropic.com',
  defaultChatModel: '',
  mode: 'global',
  openaiBaseUrl: 'https://api.openai.com/v1',
  provider: 'openai',
}

const secretFields: Array<keyof CustomerTenantAiConfigDto> = [
  'anthropicApiKey',
  'geminiApiKey',
  'grokApiKey',
  'openaiApiKey',
  'volcengineApiKey',
]

type AiProvider = NonNullable<CustomerTenantAiConfigDto['provider']>

interface ResolvedAiConfig extends CustomerTenantAiConfigDto {
  source: 'fallback' | 'global' | 'tenant'
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function arrayText(value: unknown) {
  return Array.isArray(value)
    ? value.map(item => String(item).trim()).filter(Boolean).join('、')
    : stringValue(value)
}

function hasUsableSecret(value?: string) {
  return Boolean(value && !value.includes('***'))
}

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
}

@Injectable()
export class CustomerGrowthService {
  private readonly logger = new Logger(CustomerGrowthService.name)

  constructor(
    private readonly globalKnowledgeRepository: GlobalKnowledgeRepository,
    private readonly customerRadarWorkspaceRepository: CustomerRadarWorkspaceRepository,
    private readonly systemSettingRepository: SystemSettingRepository,
    private readonly userRepository: UserRepository,
  ) { }

  private toKnowledgeVo(item: LeanDoc<GlobalKnowledge>) {
    return {
      category: item.category,
      enabled: item.enabled,
      id: documentId(item),
      replyUse: item.replyUse,
      scope: item.scope,
      summary: item.summary,
      tags: item.tags || [],
      title: item.title,
      updatedAt: formatDate(item.updatedAt),
    }
  }

  async listKnowledge(userId: string) {
    const items = await this.globalKnowledgeRepository.listByUserId(userId)
    return items.map(item => this.toKnowledgeVo(item))
  }

  async createKnowledge(userId: string, data: GlobalKnowledgeDto) {
    const created = await this.globalKnowledgeRepository.createForUser(userId, data)
    return this.toKnowledgeVo(created)
  }

  async updateKnowledge(userId: string, id: string, data: Partial<GlobalKnowledgeDto>) {
    const updated = await this.globalKnowledgeRepository.updateForUser(userId, id, data)
    return updated ? this.toKnowledgeVo(updated) : null
  }

  async deleteKnowledge(userId: string, id: string) {
    return { success: await this.globalKnowledgeRepository.deleteForUser(userId, id) }
  }

  private toRadarWorkspaceVo(item: LeanDoc<CustomerRadarWorkspace> | null) {
    if (!item)
      return null

    return {
      automationRun: item.automationRun,
      automationTasks: item.automationTasks || [],
      customerRecords: item.customerRecords,
      executionLogs: item.executionLogs,
      id: documentId(item),
      leads: item.leads,
      liveExecutionEnabled: Boolean(item.liveExecutionEnabled),
      ownedPostWorkId: item.ownedPostWorkId || '',
      ownedPostXsecToken: item.ownedPostXsecToken || '',
      platformCapabilities: item.platformCapabilities,
      profile: item.profile,
      replyCandidates: item.replyCandidates,
      socialAccounts: item.socialAccounts || [],
      taskRuns: item.taskRuns || [],
      updatedAt: item.updatedAt,
    }
  }

  async getCustomerRadarWorkspace(userId: string) {
    const workspace = await this.customerRadarWorkspaceRepository.getByUserId(userId)
    return this.toRadarWorkspaceVo(workspace)
  }

  async saveCustomerRadarWorkspace(userId: string, data: CustomerRadarWorkspaceDto) {
    const saved = await this.customerRadarWorkspaceRepository.upsertForUser(userId, {
      automationRun: data.automationRun,
      automationTasks: data.automationTasks || [],
      customerRecords: data.customerRecords,
      executionLogs: data.executionLogs,
      leads: data.leads,
      liveExecutionEnabled: Boolean(data.liveExecutionEnabled),
      ownedPostWorkId: data.ownedPostWorkId || '',
      ownedPostXsecToken: data.ownedPostXsecToken || '',
      platformCapabilities: data.platformCapabilities,
      profile: data.profile,
      replyCandidates: data.replyCandidates,
      socialAccounts: data.socialAccounts || [],
      taskRuns: data.taskRuns || [],
    })
    return this.toRadarWorkspaceVo(saved)
  }

  private normalizeTenantPlan(data: Partial<CustomerTenantPlanDto> & { userId: string }): CustomerTenantPlanDto {
    return {
      ...defaultTenantPlan,
      ...data,
      aiMode: data.aiMode || defaultTenantPlan.aiMode,
      customerName: data.customerName || defaultTenantPlan.customerName,
      dailyLimit: Math.max(1, Number(data.dailyLimit || defaultTenantPlan.dailyLimit)),
      maxSeats: Math.max(1, Number(data.maxSeats || defaultTenantPlan.maxSeats)),
      perRunLimit: Math.max(1, Number(data.perRunLimit || defaultTenantPlan.perRunLimit)),
      status: data.status || defaultTenantPlan.status,
      userId: data.userId,
    }
  }

  private normalizeTenantAiConfig(data?: Partial<CustomerTenantAiConfigDto>): CustomerTenantAiConfigDto {
    return {
      ...defaultTenantAiConfig,
      ...(data || {}),
      mode: data?.mode || defaultTenantAiConfig.mode,
      provider: data?.provider || defaultTenantAiConfig.provider,
    }
  }

  private maskTenantAiConfig(config: CustomerTenantAiConfigDto) {
    const masked: Record<string, unknown> = { ...config }
    for (const field of secretFields) {
      if (config[field])
        masked[field] = '********'
    }
    return masked
  }

  private async getTenantPlanMap() {
    const setting = await this.systemSettingRepository.getByKey(TENANT_SETTINGS_KEY)
    const tenants = Array.isArray(setting?.value?.['tenants'])
      ? setting.value['tenants'] as CustomerTenantPlanDto[]
      : []

    return new Map(tenants.map(item => [item.userId, this.normalizeTenantPlan(item)]))
  }

  async getCustomerTenantContext(user: { id: string, mail?: string, name?: string }) {
    const planMap = await this.getTenantPlanMap()
    const plan = planMap.get(user.id) || this.normalizeTenantPlan({
      customerName: user.name || user.mail || '当前客户',
      userId: user.id,
    })

    return {
      ...plan,
      aiMode: plan.aiMode || 'global',
      customerName: plan.customerName || user.name || user.mail || '当前客户',
      mail: user.mail || '',
      tenantId: `tenant-${user.id}`,
    }
  }

  async listCustomerTenants() {
    const [users, workspaces, planMap] = await Promise.all([
      this.userRepository.list({ isDelete: false }),
      this.customerRadarWorkspaceRepository.listAllWorkspaces(),
      this.getTenantPlanMap(),
    ])

    const workspaceByUserId = new Map(workspaces.map(item => [item.userId, item]))

    return users.map((user) => {
      const userId = user.id
      const workspace = workspaceByUserId.get(userId)
      const plan = planMap.get(userId) || this.normalizeTenantPlan({
        customerName: user.name || user.mail || '未命名客户',
        userId,
      })

      return {
        ...plan,
        aiMode: plan.aiMode || 'global',
        customerName: plan.customerName || user.name || user.mail || '未命名客户',
        lastActiveAt: workspace?.updatedAt || user.updatedAt || user.createdAt,
        mail: user.mail || '',
        metrics: {
          customers: workspace?.customerRecords?.length || 0,
          leads: workspace?.leads?.length || 0,
          tasks: workspace?.automationTasks?.length || 0,
        },
        tenantId: `tenant-${userId}`,
        userId,
      }
    })
  }

  async saveCustomerTenants(userId: string, data: CustomerTenantSettingsDto) {
    const tenants = (data.tenants || [])
      .filter(item => item.userId)
      .map(item => this.normalizeTenantPlan(item))

    const saved = await this.systemSettingRepository.upsertByKey(TENANT_SETTINGS_KEY, { tenants }, userId)
    return saved?.value || { tenants }
  }

  async getCustomerTenantAiConfig(userId: string) {
    const setting = await this.systemSettingRepository.getByKey(tenantAiConfigKey(userId))
    const config = this.normalizeTenantAiConfig(setting?.value as Partial<CustomerTenantAiConfigDto> | undefined)
    return this.maskTenantAiConfig(config)
  }

  async saveCustomerTenantAiConfig(userId: string, data: CustomerTenantAiConfigDto) {
    const existingSetting = await this.systemSettingRepository.getByKey(tenantAiConfigKey(userId))
    const existing = this.normalizeTenantAiConfig(existingSetting?.value as Partial<CustomerTenantAiConfigDto> | undefined)
    const next = this.normalizeTenantAiConfig({ ...existing, ...data })

    for (const field of secretFields) {
      if (!data[field] || String(data[field]).includes('***'))
        (next as Record<string, unknown>)[field] = existing[field]
    }

    const saved = await this.systemSettingRepository.upsertByKey(tenantAiConfigKey(userId), next as Record<string, unknown>, userId)
    const savedConfig = this.normalizeTenantAiConfig(saved?.value as Partial<CustomerTenantAiConfigDto> | undefined)
    return this.maskTenantAiConfig(savedConfig)
  }

  private async getRawTenantAiConfig(userId: string) {
    const setting = await this.systemSettingRepository.getByKey(tenantAiConfigKey(userId))
    return this.normalizeTenantAiConfig(setting?.value as Partial<CustomerTenantAiConfigDto> | undefined)
  }

  private providerKey(config: CustomerTenantAiConfigDto, provider: AiProvider) {
    const keyMap: Record<AiProvider, keyof CustomerTenantAiConfigDto> = {
      anthropic: 'anthropicApiKey',
      gemini: 'geminiApiKey',
      grok: 'grokApiKey',
      openai: 'openaiApiKey',
      volcengine: 'volcengineApiKey',
    }
    return stringValue(config[keyMap[provider]])
  }

  private detectConfiguredProvider(config: CustomerTenantAiConfigDto): AiProvider | null {
    const preferred = config.provider || 'openai'
    if (hasUsableSecret(this.providerKey(config, preferred)))
      return preferred

    const providers: AiProvider[] = ['openai', 'anthropic', 'gemini', 'grok', 'volcengine']
    return providers.find(provider => hasUsableSecret(this.providerKey(config, provider))) || null
  }

  private async resolveReplyAiConfig(userId: string): Promise<ResolvedAiConfig> {
    const [tenantConfig, systemConfig, planMap] = await Promise.all([
      this.getRawTenantAiConfig(userId),
      this.getSystemAiConfig(),
      this.getTenantPlanMap(),
    ])
    const tenantPlan = planMap.get(userId)
    const useTenantKey = tenantPlan?.aiMode === 'tenant' || tenantConfig.mode === 'tenant'
    const normalizedSystem = this.normalizeTenantAiConfig(systemConfig as Partial<CustomerTenantAiConfigDto>)

    if (useTenantKey) {
      const provider = this.detectConfiguredProvider(tenantConfig)
      if (provider)
        return { ...tenantConfig, provider, source: 'tenant' }
    }

    const globalProvider = this.detectConfiguredProvider(normalizedSystem)
    if (globalProvider)
      return { ...normalizedSystem, provider: globalProvider, source: 'global' }

    return { ...tenantConfig, source: 'fallback' }
  }

  private modelForProvider(config: CustomerTenantAiConfigDto, provider: AiProvider) {
    if (config.defaultChatModel)
      return config.defaultChatModel

    const defaultModels: Record<AiProvider, string> = {
      anthropic: 'claude-3-5-haiku-latest',
      gemini: 'gemini-1.5-flash',
      grok: 'grok-2-latest',
      openai: 'gpt-4o-mini',
      volcengine: 'doubao-1-5-lite-32k-250115',
    }
    return defaultModels[provider]
  }

  private buildReplyPrompt(data: CustomerReplyGenerationDto) {
    const candidate = data.candidate || {}
    const customer = data.customer || {}
    const profile = data.profile || {}
    const knowledgeRefs = (data.knowledgeRefs || []).map((item) => {
      if (typeof item === 'string')
        return item
      return [
        stringValue(item['title']),
        stringValue(item['summary']),
        stringValue(item['replyUse']),
      ].filter(Boolean).join('：')
    }).filter(Boolean)

    const sourceType = stringValue(candidate['sourceType']) === 'owned_post_comments'
      ? '自己发布笔记下的评论'
      : '通过关键词搜索到的其他笔记或评论'

    return [
      '你是巨鲸网络的 AI 增长顾问，负责为小红书/抖音等平台生成自然、不油腻、低打扰的中文回复。',
      '回复目标：先理解对方问题，再给一个具体可执行的小建议，最后轻轻留下进一步交流的空间。',
      '硬性要求：只输出一条可直接发布的回复；不要编号；不要自称机器人；不要承诺平台违规能力；不要强卖；不要超过 120 个中文字符。',
      '',
      `评论来源：${sourceType}`,
      `平台：${stringValue(candidate['platform']) || '未知平台'}`,
      `作者：${stringValue(candidate['author']) || stringValue(customer['name']) || '未知客户'}`,
      `内容标题：${stringValue(candidate['sourceTitle']) || '无标题'}`,
      `客户评论：${stringValue(candidate['commentContent']) || stringValue(candidate['signalText'])}`,
      `客户记忆：${stringValue(candidate['customerMemory']) || arrayText(customer['memory']) || '暂无'}`,
      `客户资料：${[
        stringValue(customer['name']),
        stringValue(customer['company']),
        stringValue(customer['role']),
        stringValue(customer['city']),
        arrayText(customer['tags']),
      ].filter(Boolean).join(' / ') || '暂无'}`,
      `业务画像：${[
        stringValue(profile['industry']),
        stringValue(profile['region']),
        arrayText(profile['keywords']),
        arrayText(profile['painPoints']),
      ].filter(Boolean).join(' / ') || '暂无'}`,
      `知识库：${knowledgeRefs.join('\n') || arrayText(candidate['knowledgeRefs']) || '暂无'}`,
      '',
      '请生成候选回复：',
    ].join('\n')
  }

  private fallbackReply(data: CustomerReplyGenerationDto) {
    const comment = stringValue(data.candidate?.['commentContent'])
    const sourceType = stringValue(data.candidate?.['sourceType'])
    const need = comment.includes('投流') || comment.includes('广告')
      ? '先别急着加预算，可以先把评论里的高意向问题和同城关键词整理出来'
      : sourceType === 'owned_post_comments'
        ? '你这个问题可以先做一次账号和评论区诊断'
        : '可以先从搜索词和评论区需求倒推一版获客动作'

    return `${need}，再筛出真正有需求的人低频触达。我们正在做 AI 获客流程，可以先帮你看下卡点。`
  }

  private async generateWithOpenAiCompatible(config: ResolvedAiConfig, provider: AiProvider, prompt: string) {
    const baseUrls: Record<AiProvider, string> = {
      anthropic: '',
      gemini: '',
      grok: 'https://api.x.ai/v1',
      openai: config.openaiBaseUrl || 'https://api.openai.com/v1',
      volcengine: 'https://ark.cn-beijing.volces.com/api/v3',
    }
    const apiKey = this.providerKey(config, provider)
    const response = await fetch(`${baseUrls[provider].replace(/\/$/, '')}/chat/completions`, {
      body: JSON.stringify({
        max_tokens: 180,
        messages: [
          { role: 'system', content: '你只输出一条中文社交平台回复。' },
          { role: 'user', content: prompt },
        ],
        model: this.modelForProvider(config, provider),
        temperature: 0.65,
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    if (!response.ok)
      throw new Error(`OpenAI compatible provider failed: ${response.status}`)

    const json = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>
    }
    return stringValue(json.choices?.[0]?.message?.content)
  }

  private async generateWithAnthropic(config: ResolvedAiConfig, prompt: string) {
    const response = await fetch(`${(config.anthropicBaseUrl || 'https://api.anthropic.com').replace(/\/$/, '')}/v1/messages`, {
      body: JSON.stringify({
        max_tokens: 180,
        messages: [{ role: 'user', content: prompt }],
        model: this.modelForProvider(config, 'anthropic'),
        system: '你只输出一条中文社交平台回复。',
        temperature: 0.65,
      }),
      headers: {
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
        'x-api-key': this.providerKey(config, 'anthropic'),
      },
      method: 'POST',
    })

    if (!response.ok)
      throw new Error(`Anthropic provider failed: ${response.status}`)

    const json = await response.json() as {
      content?: Array<{ text?: string, type?: string }>
    }
    return stringValue(json.content?.find(item => item.type === 'text' || item.text)?.text)
  }

  private async generateWithGemini(config: ResolvedAiConfig, prompt: string) {
    const model = this.modelForProvider(config, 'gemini')
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(this.providerKey(config, 'gemini'))}`
    const response = await fetch(url, {
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 180,
          temperature: 0.65,
        },
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })

    if (!response.ok)
      throw new Error(`Gemini provider failed: ${response.status}`)

    const json = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    return stringValue(json.candidates?.[0]?.content?.parts?.map(part => part.text || '').join(''))
  }

  private async generateReplyText(config: ResolvedAiConfig, prompt: string) {
    const provider = config.provider || 'openai'
    if (provider === 'anthropic')
      return this.generateWithAnthropic(config, prompt)
    if (provider === 'gemini')
      return this.generateWithGemini(config, prompt)
    return this.generateWithOpenAiCompatible(config, provider, prompt)
  }

  async generateReplyCandidate(userId: string, data: CustomerReplyGenerationDto) {
    const config = await this.resolveReplyAiConfig(userId)
    const prompt = this.buildReplyPrompt(data)

    if (config.source === 'fallback') {
      return {
        model: 'local-fallback',
        replyContent: truncateText(this.fallbackReply(data), 160),
        source: config.source,
      }
    }

    try {
      const replyContent = await this.generateReplyText(config, prompt)
      if (!replyContent)
        throw new Error('Empty AI reply')

      return {
        model: this.modelForProvider(config, config.provider || 'openai'),
        replyContent: truncateText(replyContent.replace(/^["“”']+|["“”']+$/g, '').trim(), 160),
        source: config.source,
      }
    }
    catch (error) {
      this.logger.warn(`Customer reply generation fallback: ${error instanceof Error ? error.message : String(error)}`)
      return {
        model: 'local-fallback',
        replyContent: truncateText(this.fallbackReply(data), 160),
        source: 'fallback',
        warning: 'AI provider unavailable, used local fallback reply.',
      }
    }
  }

  async getSystemAiConfig() {
    const setting = await this.systemSettingRepository.getByKey('ai-config')
    return setting?.value || {}
  }

  async saveSystemAiConfig(userId: string, data: SystemAiConfigDto) {
    const saved = await this.systemSettingRepository.upsertByKey('ai-config', { ...data }, userId)
    return saved?.value || {}
  }
}
