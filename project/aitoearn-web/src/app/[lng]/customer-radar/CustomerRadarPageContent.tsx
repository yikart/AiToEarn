'use client'

import type {
  CustomerInteraction,
  CustomerLead,
  CustomerLeadIntent,
  CustomerLeadStatus,
  CustomerRadarCommentSource,
  CustomerRadarExecutionLog,
  CustomerRecord,
  CustomerRadarAutomationRun,
  CustomerRadarPlatform,
  CustomerRadarPlatformCapability,
  CustomerRadarProfile,
  CustomerRadarSocialAccount,
  CustomerRadarSocialLoginStatus,
  CustomerRadarTask,
  CustomerRadarTaskRun,
  CustomerRadarTaskStatus,
  CustomerRadarTenantAiConfig,
  CustomerRadarTenantContext,
  CustomerReplyCandidate,
  CustomerReplyCandidateStatus,
} from '@/api/customerRadar'
import { customerRadarApi } from '@/api/customerRadar'
import type { GlobalKnowledgeItem } from '@/api/globalKnowledge'
import { ensurePluginBridge } from '@/store/plugin/bridge'
import type { CommentItem } from '@/store/plugin/plats/types'
import {
  getCustomerRadarPlatformCapabilities,
  scanKeywordDiscovery,
  type KeywordDiscoverySignal,
  probeCustomerRadarExecutor,
  publishCustomerRadarReply,
  scanOwnedPostComments,
} from '@/services/customerRadarExecutor'
import {
  BookOpenText,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  ClipboardCheck,
  ListChecks,
  Database,
  Download,
  Eye,
  FileText,
  History,
  KeyRound,
  MessageSquareText,
  PauseCircle,
  PlugZap,
  PlusCircle,
  PlayCircle,
  Radar,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  StopCircle,
  Target,
  UserCheck,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

const platformLabels: Record<CustomerRadarPlatform, string> = {
  bilibili: 'B站',
  douyin: '抖音',
  wxSph: '视频号',
  xhs: '小红书',
}

const platformLoginUrls: Record<CustomerRadarPlatform, string> = {
  bilibili: 'https://www.bilibili.com/',
  douyin: 'https://www.douyin.com/',
  wxSph: 'https://channels.weixin.qq.com/',
  xhs: 'https://www.xiaohongshu.com/',
}

const commentSourceLabels: Record<CustomerRadarCommentSource, string> = {
  keyword_discovery: '搜索别人笔记/评论',
  owned_post_comments: '自己笔记评论',
}

const defaultProfile: CustomerRadarProfile = {
  industry: '本地生活 / 门店服务',
  region: '同城 10km',
  keywords: ['探店', '装修', '开业引流', '到店客流', '小红书运营'],
  painPoints: ['没人咨询', '账号发了没流量', '不知道怎么拍视频'],
  excludedWords: ['招聘', '加盟广告', '兼职'],
  platforms: ['xhs', 'douyin'],
  commentSources: ['keyword_discovery', 'owned_post_comments'],
  dailyLimit: 80,
  requireApproval: true,
}

const defaultTenantAiConfig: CustomerRadarTenantAiConfig = {
  anthropicBaseUrl: 'https://api.anthropic.com',
  defaultChatModel: '',
  mode: 'global',
  openaiBaseUrl: 'https://api.openai.com/v1',
  provider: 'openai',
}

const seedLeads: Omit<CustomerLead, 'id' | 'createdAt' | 'status'>[] = [
  {
    customerId: 'customer-ning',
    platform: 'xhs',
    author: '新店主理人阿宁',
    avatarText: '宁',
    sourceTitle: '新店开业一个月，小红书到底怎么做才有人来？',
    sourceUrl: 'https://www.xiaohongshu.com/',
    signalText: '评论里问了好几家代运营，但都说先拍内容。我现在最缺的是能不能稳定带来咨询。',
    demandSummary: '新门店缺少稳定咨询，希望有人帮她把内容和获客闭环一起做。',
    intent: 'high',
    score: 92,
    suggestedReply: '你这个阶段先别急着堆内容，可以先把“同城搜索词 + 到店理由 + 私信承接”三件事跑通。最近几篇内容和评论放一起看，通常能先判断账号卡在哪一步。',
    nextAction: '人工确认后评论，再引导私信做账号诊断。',
    tags: ['开业引流', '同城门店', '高意向'],
  },
  {
    customerId: 'customer-cheng',
    platform: 'douyin',
    author: '咖啡店小程',
    avatarText: '程',
    sourceTitle: '为什么每天发短视频还是没人到店？',
    sourceUrl: 'https://www.douyin.com/',
    signalText: '拍了很多店里环境，但播放量一直几百，感觉完全不知道客户想看什么。',
    demandSummary: '有持续内容动作但缺少选题和转化路径，适合切入内容诊断。',
    intent: 'high',
    score: 88,
    suggestedReply: '你现在的问题可能不是“拍得不够多”，而是每条视频没有承接到顾客的真实搜索需求。可以先从同城关键词和评论区需求倒推 10 个选题。',
    nextAction: '先点赞收藏，人工确认后评论，后续私信给出 3 条选题建议。',
    tags: ['内容低效', '咖啡店', '选题诊断'],
  },
  {
    customerId: 'customer-ya',
    platform: 'xhs',
    author: '皮肤管理小雅',
    avatarText: '雅',
    sourceTitle: '医美小店怎么做私域？',
    sourceUrl: 'https://www.xiaohongshu.com/',
    signalText: '想把老客户带到微信，但小红书来的咨询不稳定，也不知道哪些评论值得回。',
    demandSummary: '关注私域承接和评论筛选，适合推荐客户雷达 + 人工确认触达。',
    intent: 'medium',
    score: 76,
    suggestedReply: '可以先把评论分成“价格/效果/地址/项目对比”四类，高意向评论优先人工回复。这样比所有评论都回更稳，也不容易显得营销。',
    nextAction: '加入线索池，等待同类需求超过 5 条后集中跟进。',
    tags: ['私域承接', '评论筛选'],
  },
  {
    customerId: 'customer-zhou',
    platform: 'douyin',
    author: '健身工作室老周',
    avatarText: '周',
    sourceTitle: '私教馆怎么找到附近真正想减脂的人？',
    sourceUrl: 'https://www.douyin.com/',
    signalText: '投了几次同城广告，咨询不少但成交很低，想知道能不能提前筛出更精准的人。',
    demandSummary: '需要更精准的同城客户筛选和触达节奏，适合推荐线索评分。',
    intent: 'high',
    score: 86,
    suggestedReply: '你这个可以先把评论和私信里的“目标、预算、时间、距离”四个信号抽出来，高分线索再人工跟进，比直接广撒广告更省。',
    nextAction: '人工确认后评论，提供一版同城健身客户筛选模板。',
    tags: ['同城获客', '线索评分', '健身'],
  },
  {
    customerId: 'customer-qiao',
    platform: 'xhs',
    author: '家政品牌小乔',
    avatarText: '乔',
    sourceTitle: '家政服务怎么让客户主动来问？',
    sourceUrl: 'https://www.xiaohongshu.com/',
    signalText: '我们做保洁和收纳，客户都要信任感，但内容发出去没人互动，不知道该从哪里改。',
    demandSummary: '服务型商家有信任背书和咨询转化需求，适合用案例内容 + 评论筛选切入。',
    intent: 'medium',
    score: 74,
    suggestedReply: '家政类内容可以少讲“我们多专业”，多展示“客户家里变化前后 + 服务边界 + 避坑提醒”。再看评论里谁在问价格、区域和服务细节。',
    nextAction: '进入观察名单，匹配家政案例后再触达。',
    tags: ['服务信任', '案例内容'],
  },
  {
    customerId: 'customer-startup',
    platform: 'bilibili',
    author: '本地创业记录',
    avatarText: '创',
    sourceTitle: '小团队做本地获客工具还有机会吗？',
    sourceUrl: 'https://www.bilibili.com/',
    signalText: '我们会做产品，但缺销售线索，不想每天人工刷平台找客户。',
    demandSummary: '明确表达需要自动找线索，和客户雷达价值高度匹配。',
    intent: 'high',
    score: 95,
    suggestedReply: '这个方向可以先做“半自动”：先筛出更像真实需求的人，再人工确认触达。这样既能省时间，也能避免平台风控和乱发消息。',
    nextAction: '人工确认后回复，并引导交流自动获客流程。',
    tags: ['工具团队', '自动找线索', '强匹配'],
  },
  {
    customerId: 'customer-lin',
    platform: 'wxSph',
    author: '餐饮老板老林',
    avatarText: '林',
    sourceTitle: '今年餐饮店真的太难了',
    sourceUrl: 'https://channels.weixin.qq.com/',
    signalText: '团购越来越卷，短视频也要做，但店里没人懂运营。',
    demandSummary: '有经营压力和运营外包需求，但还没有明确询价。',
    intent: 'medium',
    score: 68,
    suggestedReply: '餐饮店不用一开始做复杂矩阵，先把 3 类内容跑起来：招牌菜、顾客场景、到店理由。再用评论和私信判断哪些内容真能带咨询。',
    nextAction: '进入观察名单，后续匹配餐饮案例再触达。',
    tags: ['餐饮', '运营缺口'],
  },
]

const customerRecords: CustomerRecord[] = [
  {
    id: 'customer-ning',
    name: '新店主理人阿宁',
    company: '同城生活方式门店',
    role: '主理人',
    platform: 'xhs',
    city: '杭州',
    stage: 'qualified',
    valueLevel: 'high',
    owner: '巨鲸增长顾问',
    lastTouchAt: '2026-05-18 13:12',
    source: '小红书开业引流评论',
    tags: ['开业引流', '同城门店', '缺稳定咨询'],
    memory: [
      '刚开业一个月，最关心稳定咨询和到店转化。',
      '已经问过几家代运营，对“只拍内容”方案不够信任。',
      '适合先给账号诊断和同城关键词建议，避免直接报价。',
    ],
    interactions: [
      {
        id: 'interaction-ning-1',
        at: '2026-05-18 12:48',
        channel: 'xhs',
        type: 'comment',
        summary: '在开业笔记评论区表达想找到稳定咨询来源。',
        aiReply: '你这个阶段先别急着堆内容，可以先把“同城搜索词 + 到店理由 + 私信承接”三件事跑通。',
      },
      {
        id: 'interaction-ning-2',
        at: '2026-05-18 13:12',
        channel: 'xhs',
        type: 'note',
        summary: '客户对“账号诊断”比“代运营套餐”更容易接受。',
      },
    ],
  },
  {
    id: 'customer-cheng',
    name: '咖啡店小程',
    company: '社区咖啡店',
    role: '店长',
    platform: 'douyin',
    city: '苏州',
    stage: 'warming',
    valueLevel: 'high',
    owner: '巨鲸增长顾问',
    lastTouchAt: '2026-05-18 11:36',
    source: '抖音短视频内容低效话题',
    tags: ['咖啡店', '短视频低效', '选题诊断'],
    memory: [
      '持续发视频但播放量低，愿意尝试选题优化。',
      '核心焦虑是“不知道客户想看什么”，不是缺拍摄工具。',
      '回复时要先给具体选题方向，再介绍 AI 内容诊断。',
    ],
    interactions: [
      {
        id: 'interaction-cheng-1',
        at: '2026-05-18 11:36',
        channel: 'douyin',
        type: 'reply',
        summary: 'AI 生成过 3 条同城咖啡店选题建议。',
        aiReply: '先从“上班族顺路买咖啡”“附近适合办公”“新品试喝反馈”这三类需求倒推内容。',
      },
    ],
  },
  {
    id: 'customer-ya',
    name: '皮肤管理小雅',
    company: '皮肤管理工作室',
    role: '运营负责人',
    platform: 'xhs',
    city: '宁波',
    stage: 'new',
    valueLevel: 'medium',
    owner: '未分配',
    lastTouchAt: '2026-05-17 19:20',
    source: '小红书私域承接提问',
    tags: ['私域承接', '评论筛选'],
    memory: [
      '关注小红书咨询如何进入微信私域。',
      '对评论筛选和高意向识别有兴趣。',
      '不宜承诺平台私信自动化，先强调人工确认和低打扰。',
    ],
    interactions: [
      {
        id: 'interaction-ya-1',
        at: '2026-05-17 19:20',
        channel: 'xhs',
        type: 'comment',
        summary: '询问哪些评论值得优先回复。',
        aiReply: '可以先把评论分成“价格、效果、地址、项目对比”四类，高意向评论优先人工回复。',
      },
    ],
  },
]

const knowledgeBase: GlobalKnowledgeItem[] = [
  {
    id: 'kb-offer-radar',
    title: '客户雷达核心价值',
    category: 'offer',
    scope: 'global',
    summary: 'AI 帮企业从社媒内容、评论和互动信号里发现潜在客户，并按意向分排序。',
    replyUse: '当客户提到没人咨询、找不到客户、内容没有转化时，用它解释“先筛选高意向，再人工触达”的方案。',
    updatedAt: '2026-05-18',
    enabled: true,
    tags: ['主动获客', '线索评分'],
  },
  {
    id: 'kb-boundary-platform',
    title: '平台触达边界',
    category: 'boundary',
    scope: 'global',
    summary: '系统不鼓励全自动乱评乱私信，关键动作进入人工确认队列，降低封号和打扰风险。',
    replyUse: '当客户担心风控、封号、营销感太强时，强调人工确认、低频、低打扰。',
    updatedAt: '2026-05-18',
    enabled: true,
    tags: ['风控', '人工确认'],
  },
  {
    id: 'kb-case-local-store',
    title: '本地门店获客案例话术',
    category: 'case',
    scope: 'global',
    summary: '门店先跑通同城搜索词、到店理由、私信承接，再扩大内容数量。',
    replyUse: '面对餐饮、咖啡、医美、家政、健身等本地门店时，先给具体诊断方向。',
    updatedAt: '2026-05-18',
    enabled: true,
    tags: ['本地生活', '门店'],
  },
  {
    id: 'kb-tone-consultant',
    title: '回复语气规则',
    category: 'tone',
    scope: 'global',
    summary: '先给有帮助的判断，再轻柔提出可以继续诊断，不上来硬卖。',
    replyUse: '所有 AI 回复都遵循“理解问题 -> 给一个可执行建议 -> 邀请进一步交流”。',
    updatedAt: '2026-05-18',
    enabled: true,
    tags: ['语气', '回复规范'],
  },
]

const platformOptions: CustomerRadarPlatform[] = ['xhs', 'douyin', 'wxSph', 'bilibili']

const commentSourceOptions: CustomerRadarCommentSource[] = ['keyword_discovery', 'owned_post_comments']

interface PluginDiagnosticResult {
  checkedAt: string
  hasPlugin: boolean
  permission?: {
    granted?: boolean
    origins?: string[]
    permissions?: string[]
  }
  platforms: {
    error?: string
    nickname?: string
    platform: 'xhs' | 'douyin'
    ready: boolean
    uid?: string
  }[]
  version?: {
    name?: string
    version?: string
  }
}

const initialAutomationRun: CustomerRadarAutomationRun = {
  id: 'radar-run-local-demo',
  name: '本地生活获客扫描',
  status: 'idle',
  scannedCount: 0,
  collectedCount: 0,
  replyDraftCount: 0,
  publishedCount: 0,
  riskLevel: 'low',
  mode: 'manual_approval',
  updatedAt: '未开始',
}

const seedReplyCandidates: CustomerReplyCandidate[] = [
  {
    id: 'reply-candidate-ning',
    customerId: 'customer-ning',
    leadId: '',
    platform: 'xhs',
    sourceType: 'keyword_discovery',
    author: '新店主理人阿宁',
    sourceTitle: '新店开业一个月，小红书到底怎么做才有人来？',
    commentContent: '评论里问了好几家代运营，但都说先拍内容。我现在最缺的是能不能稳定带来咨询。',
    customerMemory: '客户刚开业一个月，对只拍内容不信任，适合先给诊断方向。',
    knowledgeRefs: ['客户雷达核心价值', '平台触达边界', '本地门店获客案例话术'],
    replyContent: '你这个阶段先别急着堆内容，可以先把“同城搜索词 + 到店理由 + 私信承接”三件事跑通。最近几篇内容和评论放一起看，通常能先判断账号卡在哪一步。',
    riskNote: '低风险：先给建议，不承诺结果，不直接索要联系方式。',
    status: 'draft',
  },
  {
    id: 'reply-candidate-cheng',
    customerId: 'customer-cheng',
    leadId: '',
    platform: 'douyin',
    sourceType: 'owned_post_comments',
    author: '咖啡店小程',
    sourceTitle: '为什么每天发短视频还是没人到店？',
    commentContent: '拍了很多店里环境，但播放量一直几百，感觉完全不知道客户想看什么。',
    customerMemory: '客户持续发视频但播放低，核心问题是选题和转化路径。',
    knowledgeRefs: ['回复语气规则', '本地门店获客案例话术'],
    replyContent: '你现在可能不是拍得不够多，而是每条视频没有承接到顾客真实需求。可以先从同城搜索词和评论问题倒推 10 个选题，再看哪些能带来咨询。',
    riskNote: '中风险：抖音评论列表尚未接入真实抓取，发布前需要人工确认作品和账号状态。',
    status: 'draft',
  },
]

function splitText(value: string) {
  return value
    .split(/[,\n，]/)
    .map(item => item.trim())
    .filter(Boolean)
}

function joinText(value: string[]) {
  return value.join('，')
}

function parseXhsNoteInput(value: string) {
  const trimmed = value.trim()
  if (!trimmed)
    return { noteId: '', xsecToken: '' }

  try {
    const url = new URL(trimmed)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const noteId = pathParts.find(part => /^[a-z0-9]{20,32}$/i.test(part))
      || url.searchParams.get('note_id')
      || url.searchParams.get('noteId')
      || trimmed
    return {
      noteId,
      xsecToken: url.searchParams.get('xsec_token') || url.searchParams.get('xsecToken') || '',
    }
  }
  catch {
    return { noteId: trimmed, xsecToken: '' }
  }
}

function statusLabel(status: CustomerLeadStatus) {
  const map: Record<CustomerLeadStatus, string> = {
    approved: '已批准',
    contacted: '已触达',
    new: '新线索',
    pending_approval: '待确认',
    rejected: '已忽略',
  }
  return map[status]
}

function intentLabel(intent: CustomerLeadIntent) {
  const map: Record<CustomerLeadIntent, string> = {
    high: '高意向',
    low: '低意向',
    medium: '中意向',
  }
  return map[intent]
}

function stageLabel(stage: CustomerRecord['stage']) {
  const map: Record<CustomerRecord['stage'], string> = {
    contacted: '已触达',
    converted: '已转化',
    invalid: '无效线索',
    new: '新客户',
    qualified: '已确认需求',
    warming: '培育中',
  }
  return map[stage]
}

function valueLabel(valueLevel: CustomerRecord['valueLevel']) {
  const map: Record<CustomerRecord['valueLevel'], string> = {
    high: '高价值',
    low: '低价值',
    medium: '中价值',
  }
  return map[valueLevel]
}

function interactionTypeLabel(type: CustomerInteraction['type']) {
  const map: Record<CustomerInteraction['type'], string> = {
    call: '电话',
    comment: '评论',
    dm: '私信',
    note: '备注',
    reply: '回复',
  }
  return map[type]
}

function knowledgeCategoryLabel(category: GlobalKnowledgeItem['category']) {
  const map: Record<GlobalKnowledgeItem['category'], string> = {
    boundary: '边界',
    case: '案例',
    faq: 'FAQ',
    offer: '方案',
    tone: '语气',
  }
  return map[category]
}

function automationStatusLabel(status: CustomerRadarAutomationRun['status']) {
  const map: Record<CustomerRadarAutomationRun['status'], string> = {
    awaiting_approval: '待确认',
    idle: '未开始',
    paused: '已暂停',
    publishing: '发布中',
    scanning: '扫描中',
  }
  return map[status]
}

function automationModeLabel(mode: CustomerRadarAutomationRun['mode']) {
  const map: Record<CustomerRadarAutomationRun['mode'], string> = {
    full_auto: '全自动发布',
    manual_approval: '人工确认后发布',
  }
  return map[mode]
}

function logLevelLabel(level: CustomerRadarExecutionLog['level']) {
  const map: Record<CustomerRadarExecutionLog['level'], string> = {
    error: '异常',
    info: '信息',
    success: '成功',
    warning: '注意',
  }
  return map[level]
}

function replyStatusLabel(status: CustomerReplyCandidateStatus) {
  const map: Record<CustomerReplyCandidateStatus, string> = {
    approved: '已批准',
    draft: '待确认',
    published: '已发布',
    rejected: '已忽略',
  }
  return map[status]
}

function taskStatusLabel(status: CustomerRadarTaskStatus) {
  const map: Record<CustomerRadarTaskStatus, string> = {
    completed: '已完成',
    draft: '草稿',
    failed: '失败',
    paused: '已停止',
    ready: '待运行',
    running: '运行中',
  }
  return map[status]
}

function taskCadenceLabel(cadence: CustomerRadarTask['cadence']) {
  const map: Record<CustomerRadarTask['cadence'], string> = {
    daily: '每天一次',
    hourly: '每小时',
    manual: '手动运行',
  }
  return map[cadence]
}

function socialLoginStatusLabel(status: CustomerRadarSocialLoginStatus) {
  const map: Record<CustomerRadarSocialLoginStatus, string> = {
    expired: '登录过期',
    logged_in: '已登录',
    not_logged_in: '未登录',
    unknown: '未检测',
  }
  return map[status]
}

const stageClassName: Record<CustomerRecord['stage'], string> = {
  contacted: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  converted: 'border-blue-200 bg-blue-50 text-blue-700',
  invalid: 'border-slate-200 bg-slate-100 text-slate-500',
  new: 'border-slate-200 bg-slate-50 text-slate-600',
  qualified: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  warming: 'border-amber-200 bg-amber-50 text-amber-700',
}

const valueClassName: Record<CustomerRecord['valueLevel'], string> = {
  high: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  low: 'border-slate-200 bg-slate-50 text-slate-600',
  medium: 'border-cyan-200 bg-cyan-50 text-cyan-700',
}

const intentClassName: Record<CustomerLeadIntent, string> = {
  high: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  low: 'border-slate-200 bg-slate-50 text-slate-600',
  medium: 'border-cyan-200 bg-cyan-50 text-cyan-700',
}

const statusClassName: Record<CustomerLeadStatus, string> = {
  approved: 'border-blue-200 bg-blue-50 text-blue-700',
  contacted: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  new: 'border-slate-200 bg-slate-50 text-slate-700',
  pending_approval: 'border-amber-200 bg-amber-50 text-amber-700',
  rejected: 'border-slate-200 bg-slate-50 text-slate-500',
}

type CustomerFollowUpAction = 'followed' | 'revisit' | 'invalid'
type CustomerStageFilter = 'all' | 'revisit' | CustomerRecord['stage']

const customerStageFilterOptions: { label: string, value: CustomerStageFilter }[] = [
  { label: '全部', value: 'all' },
  { label: '二次触达', value: 'revisit' },
  { label: '新客户', value: 'new' },
  { label: '已确认', value: 'qualified' },
  { label: '已触达', value: 'contacted' },
  { label: '无效', value: 'invalid' },
]

const automationStatusClassName: Record<CustomerRadarAutomationRun['status'], string> = {
  awaiting_approval: 'border-amber-200 bg-amber-50 text-amber-700',
  idle: 'border-slate-200 bg-slate-50 text-slate-600',
  paused: 'border-slate-200 bg-slate-50 text-slate-600',
  publishing: 'border-blue-200 bg-blue-50 text-blue-700',
  scanning: 'border-cyan-200 bg-cyan-50 text-cyan-700',
}

const replyStatusClassName: Record<CustomerReplyCandidateStatus, string> = {
  approved: 'border-blue-200 bg-blue-50 text-blue-700',
  draft: 'border-amber-200 bg-amber-50 text-amber-700',
  published: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rejected: 'border-slate-200 bg-slate-50 text-slate-500',
}

const taskStatusClassName: Record<CustomerRadarTaskStatus, string> = {
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  draft: 'border-slate-200 bg-slate-50 text-slate-600',
  failed: 'border-rose-200 bg-rose-50 text-rose-700',
  paused: 'border-slate-200 bg-slate-50 text-slate-600',
  ready: 'border-blue-200 bg-blue-50 text-blue-700',
  running: 'border-cyan-200 bg-cyan-50 text-cyan-700',
}

const socialLoginStatusClassName: Record<CustomerRadarSocialLoginStatus, string> = {
  expired: 'border-amber-200 bg-amber-50 text-amber-700',
  logged_in: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  not_logged_in: 'border-rose-200 bg-rose-50 text-rose-700',
  unknown: 'border-slate-200 bg-slate-50 text-slate-600',
}

const logLevelClassName: Record<CustomerRadarExecutionLog['level'], string> = {
  error: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
}

function createTaskLimitPolicy(profile: CustomerRadarProfile) {
  return {
    cadence: 'manual' as const,
    cooldownSeconds: profile.requireApproval ? 20 : 45,
    dailyLimit: Math.max(10, profile.dailyLimit),
    dailyUsed: 0,
    failureCount: 0,
    maxFailures: 3,
    perRunLimit: Math.min(12, Math.max(3, Math.ceil(profile.dailyLimit / 6))),
  }
}

function createLeads(profile: CustomerRadarProfile): CustomerLead[] {
  const selected = seedLeads.filter(item => profile.platforms.includes(item.platform))
  const source = selected.length ? selected : seedLeads
  const now = Date.now()

  return source.map((item, index) => ({
    ...item,
    id: `lead-${now}-${index}`,
    createdAt: new Date(now - index * 1000 * 60 * 18).toISOString(),
    status: profile.requireApproval ? 'pending_approval' : 'new',
  }))
}

function nowText() {
  return new Date().toLocaleString('zh-CN', { hour12: false })
}

function getNextRunAtForCadence(cadence: CustomerRadarTask['cadence']) {
  if (cadence === 'manual')
    return '手动运行'

  const intervalMinutes = cadence === 'hourly' ? 60 : 24 * 60
  const next = new Date(Date.now() + intervalMinutes * 60 * 1000)
  return next.toLocaleString('zh-CN', { hour12: false })
}

function parseTaskRunTime(value: string) {
  const timestamp = Date.parse(value.replace(/\//g, '-'))
  return Number.isNaN(timestamp) ? null : timestamp
}

function toLocalDateTimeInput(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function getDefaultFollowUpAt() {
  const next = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
  next.setMinutes(0, 0, 0)
  return toLocalDateTimeInput(next)
}

function parseFollowUpTime(value?: string) {
  if (!value)
    return null

  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? null : timestamp
}

function followUpTimeLabel(value?: string) {
  const timestamp = parseFollowUpTime(value)
  if (!timestamp)
    return '未安排'

  return new Date(timestamp).toLocaleString('zh-CN', { hour12: false })
}

function followUpDueState(customer: CustomerRecord) {
  const timestamp = parseFollowUpTime(customer.nextFollowUpAt)
  if (!timestamp)
    return { className: 'border-slate-200 bg-slate-50 text-slate-500', label: '未排期' }

  const now = Date.now()
  if (timestamp <= now)
    return { className: 'border-rose-200 bg-rose-50 text-rose-700', label: '已到期' }

  if (timestamp - now <= 24 * 60 * 60 * 1000)
    return { className: 'border-amber-200 bg-amber-50 text-amber-700', label: '24h 内' }

  return { className: 'border-cyan-200 bg-cyan-50 text-cyan-700', label: '已排期' }
}

function createSocialAccounts(profile: CustomerRadarProfile): CustomerRadarSocialAccount[] {
  return profile.platforms.map(platform => ({
    id: `social-${platform}`,
    lastCheckedAt: '未检测',
    loginStatus: 'unknown',
    nickname: `${platformLabels[platform]}账号`,
    note: '等待浏览器插件检测平台登录态。',
    platform,
    pluginConnected: false,
  }))
}

function createAutomationTask(profile: CustomerRadarProfile, mode: CustomerRadarAutomationRun['mode'], ownedPostWorkId?: string, cadence: CustomerRadarTask['cadence'] = 'manual'): CustomerRadarTask {
  const sourceSet = new Set(profile.commentSources || defaultProfile.commentSources)
  const hasKeywordDiscovery = sourceSet.has('keyword_discovery')
  const hasOwnedPost = sourceSet.has('owned_post_comments')
  const type: CustomerRadarTask['type'] = hasKeywordDiscovery && hasOwnedPost
    ? 'hybrid'
    : hasOwnedPost ? 'owned_post_reply' : 'keyword_discovery'
  const createdAt = nowText()
  const limitPolicy = createTaskLimitPolicy(profile)

  return {
    cadence,
    commentSources: profile.commentSources || defaultProfile.commentSources,
    cooldownSeconds: limitPolicy.cooldownSeconds,
    createdAt,
    dailyLimit: limitPolicy.dailyLimit,
    dailyUsed: limitPolicy.dailyUsed,
    failureCount: limitPolicy.failureCount,
    id: `customer-radar-task-${Date.now()}`,
    keywords: profile.keywords,
    lastLog: '任务已创建，等待运行。',
    maxFailures: limitPolicy.maxFailures,
    mode,
    name: `${profile.industry}自动获客`,
    nextRunAt: getNextRunAtForCadence(cadence),
    ownedPostWorkId: hasOwnedPost ? ownedPostWorkId || '' : '',
    perRunLimit: limitPolicy.perRunLimit,
    platforms: profile.platforms,
    pluginRequired: true,
    stats: {
      collected: 0,
      published: 0,
      replies: 0,
      scanned: 0,
    },
    status: 'ready',
    type,
    updatedAt: createdAt,
  }
}

function normalizeProfile(profile?: CustomerRadarProfile) {
  if (!profile)
    return defaultProfile

  return {
    ...profile,
    commentSources: profile.commentSources?.length
      ? profile.commentSources
      : defaultProfile.commentSources,
  }
}

function normalizeSocialAccounts(accounts: CustomerRadarSocialAccount[] | undefined, profile: CustomerRadarProfile) {
  const defaults = createSocialAccounts(profile)
  if (!accounts?.length)
    return defaults

  const existing = new Map(accounts.map(item => [item.platform, item]))
  return defaults.map(item => existing.get(item.platform) || item)
}

function sanitizeOutboundCopy(content: string) {
  return content
    .replace(/我们在做 AI 主动获客工具，可以先帮你判断哪些评论更像真实客户需求。/g, '先把最近几篇内容和评论整理一下，通常能看出卡在哪一步。')
    .replace(/我这边刚好在做 AI 门店获客流程，可以先帮你看下账号卡点。/g, '最近几篇内容和评论放一起看，通常能先判断账号卡在哪一步。')
    .replace(/我们在做 AI 主动获客，会先帮你筛出高意向客户，再人工确认触达，整体会比乱发评论稳一点。/g, '把最近几篇内容、评论和咨询入口放一起看，通常能先判断是选题不准、承接不顺，还是回复节奏没跟上。')
}

function normalizeLeads(leads?: CustomerLead[]) {
  return leads?.map((lead) => {
    const normalizedLead = {
      ...lead,
      suggestedReply: sanitizeOutboundCopy(lead.suggestedReply),
    }

    if (lead.customerId)
      return normalizedLead

    const matched = seedLeads.find(item => item.author === lead.author || item.sourceTitle === lead.sourceTitle)

    return {
      ...normalizedLead,
      customerId: matched?.customerId || 'customer-ning',
    }
  })
}

function normalizeReplyCandidates(candidates?: CustomerReplyCandidate[], leads?: CustomerLead[]) {
  return candidates?.map((candidate) => {
    const normalizedCandidate = {
      ...candidate,
      replyContent: sanitizeOutboundCopy(candidate.replyContent),
    }

    if (candidate.leadId)
      return normalizedCandidate

    const matchedLead = leads?.find(lead => lead.customerId === candidate.customerId)

    return {
      ...normalizedCandidate,
      leadId: matchedLead?.id || '',
      sourceType: candidate.sourceType || 'keyword_discovery',
    }
  })
}

function normalizeAutomationTasks(tasks: CustomerRadarTask[] | undefined, profile: CustomerRadarProfile) {
  const policy = createTaskLimitPolicy(profile)
  return tasks?.map(task => ({
    ...task,
    cadence: task.cadence || policy.cadence,
    cooldownSeconds: task.cooldownSeconds ?? policy.cooldownSeconds,
    dailyLimit: task.dailyLimit || policy.dailyLimit,
    dailyUsed: task.dailyUsed || 0,
    failureCount: task.failureCount || 0,
    maxFailures: task.maxFailures || policy.maxFailures,
    perRunLimit: task.perRunLimit || policy.perRunLimit,
    runs: normalizeTaskRuns(task.runs),
  })) || []
}

function normalizeTaskRuns(runs?: CustomerRadarTaskRun[]) {
  return runs?.map(run => ({
    ...run,
    candidateIds: run.candidateIds || [],
    commentSources: run.commentSources || [],
    leadIds: run.leadIds || [],
    revisited: run.revisited || 0,
    skipped: run.skipped || 0,
    status: run.status || 'completed',
    trigger: run.trigger || 'manual',
  })) || []
}

function csvCell(value?: number | string) {
  const text = String(value ?? '').replace(/\r?\n/g, ' ')
  return `"${text.replace(/"/g, '""')}"`
}

function safeFileName(value: string) {
  return value
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

function downloadTextFile(filename: string, content: string, type = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function exportTaskRunCsv(task: CustomerRadarTask, run: CustomerRadarTaskRun, leads: CustomerLead[], candidates: CustomerReplyCandidate[]) {
  const candidatesByCustomerId = new Map(candidates.map(candidate => [candidate.customerId, candidate]))
  const leadRows = leads.map((lead) => {
    const candidate = candidatesByCustomerId.get(lead.customerId)
    return [
      run.completedAt,
      task.name,
      run.trigger === 'scheduled' ? '自动触发' : '手动运行',
      platformLabels[lead.platform],
      lead.author,
      intentLabel(lead.intent),
      candidate ? replyStatusLabel(candidate.status) : '',
      lead.sourceTitle,
      lead.sourceUrl,
      lead.signalText,
      candidate?.replyContent || lead.suggestedReply,
      candidate?.riskNote || lead.nextAction,
    ]
  })
  const leadCustomerIds = new Set(leads.map(lead => lead.customerId))
  const candidateOnlyRows = candidates
    .filter(candidate => !leadCustomerIds.has(candidate.customerId))
    .map(candidate => [
      run.completedAt,
      task.name,
      run.trigger === 'scheduled' ? '自动触发' : '手动运行',
      platformLabels[candidate.platform],
      candidate.author,
      '',
      replyStatusLabel(candidate.status),
      candidate.sourceTitle,
      candidate.workId || '',
      candidate.commentContent,
      candidate.replyContent,
      candidate.riskNote,
    ])
  const headers = ['批次时间', '任务名称', '触发方式', '平台', '客户/作者', '意向', '候选状态', '来源标题', '来源链接/作品ID', '客户信号', '候选回复', '处理建议/风险备注']
  const csv = [
    headers,
    ...leadRows,
    ...candidateOnlyRows,
  ].map(row => row.map(csvCell).join(',')).join('\n')
  const filename = `${safeFileName(task.name)}-${safeFileName(run.completedAt)}-批次复盘.csv`
  downloadTextFile(filename, `\uFEFF${csv}`)
}

export function CustomerRadarPageContent() {
  const remoteLoadedRef = useRef(false)
  const autoRunningTaskIdsRef = useRef<Set<string>>(new Set())
  const [profile, setProfile] = useState<CustomerRadarProfile>(defaultProfile)
  const [keywordText, setKeywordText] = useState(joinText(defaultProfile.keywords))
  const [painPointText, setPainPointText] = useState(joinText(defaultProfile.painPoints))
  const [excludedText, setExcludedText] = useState(joinText(defaultProfile.excludedWords))
  const [leads, setLeads] = useState<CustomerLead[]>(createLeads(defaultProfile))
  const [customerRecordsState, setCustomerRecordsState] = useState<CustomerRecord[]>(customerRecords)
  const [automationRun, setAutomationRun] = useState<CustomerRadarAutomationRun>(initialAutomationRun)
  const [replyCandidates, setReplyCandidates] = useState<CustomerReplyCandidate[]>(
    seedReplyCandidates,
  )
  const [executionLogs, setExecutionLogs] = useState<CustomerRadarExecutionLog[]>([])
  const [platformCapabilities, setPlatformCapabilities] = useState<CustomerRadarPlatformCapability[]>(
    getCustomerRadarPlatformCapabilities(defaultProfile.platforms),
  )
  const [automationTasks, setAutomationTasks] = useState<CustomerRadarTask[]>([])
  const [taskRuns, setTaskRuns] = useState<CustomerRadarTaskRun[]>([])
  const [socialAccounts, setSocialAccounts] = useState<CustomerRadarSocialAccount[]>(createSocialAccounts(defaultProfile))
  const [isScanning, setIsScanning] = useState(false)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(leads[0]?.id || null)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(leads[0]?.customerId || null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedTaskRunId, setSelectedTaskRunId] = useState<string | null>(null)
  const [customerQuery, setCustomerQuery] = useState('')
  const [customerStageFilter, setCustomerStageFilter] = useState<CustomerStageFilter>('all')
  const [keywordDiscoveryTerm, setKeywordDiscoveryTerm] = useState(defaultProfile.keywords[0] || '')
  const [isKeywordDiscovering, setIsKeywordDiscovering] = useState(false)
  const [tenantContext, setTenantContext] = useState<CustomerRadarTenantContext | null>(null)
  const [tenantAiConfig, setTenantAiConfig] = useState<CustomerRadarTenantAiConfig>(defaultTenantAiConfig)
  const [isSavingTenantAiConfig, setIsSavingTenantAiConfig] = useState(false)
  const [generatingReplyId, setGeneratingReplyId] = useState<string | null>(null)
  const [ownedPostWorkId, setOwnedPostWorkId] = useState('')
  const [ownedPostXsecToken, setOwnedPostXsecToken] = useState('')
  const [isFetchingOwnedComments, setIsFetchingOwnedComments] = useState(false)
  const [pluginDiagnostic, setPluginDiagnostic] = useState<PluginDiagnosticResult | null>(null)
  const [isPluginDiagnosticRunning, setIsPluginDiagnosticRunning] = useState(false)
  const [liveExecutionEnabled, setLiveExecutionEnabled] = useState(false)
  const [taskCadence, setTaskCadence] = useState<CustomerRadarTask['cadence']>('manual')

  const selectedLead = leads.find(item => item.id === selectedLeadId) || leads[0]
  const selectedCustomer = customerRecordsState.find(item => item.id === selectedCustomerId)
    || customerRecordsState.find(item => item.id === selectedLead?.customerId)
    || customerRecordsState[0]
  const selectedTask = automationTasks.find(item => item.id === selectedTaskId) || automationTasks[0]
  const pendingCount = leads.filter(item => item.status === 'pending_approval').length
  const contactedCount = leads.filter(item => item.status === 'contacted').length
  const highIntentCount = leads.filter(item => item.intent === 'high').length
  const replyPendingCount = replyCandidates.filter(item => item.status === 'draft').length
  const replyPublishedCount = replyCandidates.filter(item => item.status === 'published').length
  const followUpCustomers = useMemo(() => customerRecordsState
    .filter(customer => customer.stage === 'warming' || customer.stage === 'qualified')
    .sort((left, right) => {
      const leftFollowUp = parseFollowUpTime(left.nextFollowUpAt)
      const rightFollowUp = parseFollowUpTime(right.nextFollowUpAt)
      if (leftFollowUp && rightFollowUp)
        return leftFollowUp - rightFollowUp
      if (leftFollowUp)
        return -1
      if (rightFollowUp)
        return 1

      return (parseTaskRunTime(right.lastTouchAt) || 0) - (parseTaskRunTime(left.lastTouchAt) || 0)
    }), [customerRecordsState])
  const dueFollowUpCount = followUpCustomers.filter((customer) => {
    const followUpAt = parseFollowUpTime(customer.nextFollowUpAt)
    return followUpAt ? followUpAt <= Date.now() : false
  }).length
  const customerStageCounts = useMemo(() => customerRecordsState.reduce<Record<CustomerStageFilter, number>>((counts, customer) => {
    counts.all += 1
    counts[customer.stage] += 1
    if (customer.stage === 'warming' || customer.stage === 'qualified')
      counts.revisit += 1

    return counts
  }, {
    all: 0,
    contacted: 0,
    converted: 0,
    invalid: 0,
    new: 0,
    qualified: 0,
    revisit: 0,
    warming: 0,
  }), [customerRecordsState])
  const averageScore = Math.round(
    leads.reduce((sum, item) => sum + item.score, 0) / Math.max(leads.length, 1),
  )
  const filteredCustomers = useMemo(() => {
    const keyword = customerQuery.trim().toLowerCase()

    return customerRecordsState.filter((customer) => {
      if (customerStageFilter === 'revisit' && customer.stage !== 'warming' && customer.stage !== 'qualified')
        return false
      if (customerStageFilter !== 'all' && customerStageFilter !== 'revisit' && customer.stage !== customerStageFilter)
        return false
      if (!keyword)
        return true

      const haystack = [
        customer.name,
        customer.company,
        customer.role,
        customer.city,
        customer.source,
        ...customer.tags,
        ...customer.memory,
      ].join(' ').toLowerCase()

      return haystack.includes(keyword)
    })
  }, [customerQuery, customerRecordsState, customerStageFilter])
  const relevantKnowledge = useMemo(() => {
    const hasLocalStore = selectedCustomer?.tags.some(tag => ['同城门店', '咖啡店', '私域承接'].includes(tag))
    const ids = new Set([
      'kb-offer-radar',
      'kb-boundary-platform',
      hasLocalStore ? 'kb-case-local-store' : 'kb-tone-consultant',
      'kb-tone-consultant',
    ])

    return knowledgeBase.filter(item => ids.has(item.id)).slice(0, 4)
  }, [selectedCustomer])
  const pluginConnected = platformCapabilities.some(item => item.available)
  const accountReady = socialAccounts.some(item => item.loginStatus === 'logged_in')
  const knowledgeReady = relevantKnowledge.some(item => item.enabled)
  const readySteps = [
    pluginConnected,
    accountReady,
    knowledgeReady,
    automationTasks.some(item => ['ready', 'running', 'completed'].includes(item.status)),
  ].filter(Boolean).length
  const selectedTaskRuns = useMemo(() => {
    if (!selectedTask)
      return []

    const runs = [
      ...(selectedTask.runs || []),
      ...taskRuns.filter(run => run.taskId === selectedTask.id),
    ]
    const seen = new Set<string>()
    return runs
      .filter((run) => {
        if (seen.has(run.id))
          return false
        seen.add(run.id)
        return true
      })
      .slice(0, 8)
  }, [selectedTask, taskRuns])
  const selectedTaskRun = selectedTaskRuns.find(run => run.id === selectedTaskRunId) || selectedTaskRuns[0]
  const selectedTaskLeads = useMemo(() => {
    if (!selectedTask)
      return []

    if (selectedTaskRun)
      return leads.filter(lead => selectedTaskRun.leadIds.includes(lead.id)).slice(0, 6)

    const taskKeywords = new Set(selectedTask.keywords)
    return leads
      .filter((lead) => {
        if (!selectedTask.platforms.includes(lead.platform))
          return false

        const isKeywordLead = lead.tags.includes('关键词获客')
        if (isKeywordLead)
          return selectedTask.commentSources.includes('keyword_discovery')
            && lead.tags.some(tag => taskKeywords.has(tag))

        return selectedTask.commentSources.includes('owned_post_comments')
      })
      .slice(0, 6)
  }, [leads, selectedTask, selectedTaskRun])
  const selectedTaskCandidates = useMemo(() => {
    if (!selectedTask)
      return []

    if (selectedTaskRun)
      return replyCandidates.filter(candidate => selectedTaskRun.candidateIds.includes(candidate.id)).slice(0, 6)

    return replyCandidates
      .filter(candidate => selectedTask.platforms.includes(candidate.platform) && selectedTask.commentSources.includes(candidate.sourceType))
      .slice(0, 6)
  }, [replyCandidates, selectedTask, selectedTaskRun])
  const selectedTaskLogs = useMemo(() => {
    if (!selectedTask)
      return []

    return executionLogs
      .filter(log => log.detail.includes(selectedTask.name) || /任务|关键词|自己笔记|候选回复|扫描/.test(`${log.title} ${log.detail}`))
      .slice(0, 6)
  }, [executionLogs, selectedTask])

  useEffect(() => {
    if (!filteredCustomers.length)
      return
    if (!selectedCustomerId || !filteredCustomers.some(customer => customer.id === selectedCustomerId))
      setSelectedCustomerId(filteredCustomers[0].id)
  }, [filteredCustomers, selectedCustomerId])

  useEffect(() => {
    let cancelled = false

    async function loadRemoteWorkspace() {
      const [res, tenantRes, tenantAiRes] = await Promise.all([
        customerRadarApi.getWorkspace(),
        customerRadarApi.getTenantContext(),
        customerRadarApi.getTenantAiConfig(),
      ])
      if (cancelled)
        return

      if (tenantRes?.code === 0 && tenantRes.data) {
        setTenantContext(tenantRes.data)
        setProfile(current => ({
          ...current,
          dailyLimit: tenantRes.data.dailyLimit || current.dailyLimit,
        }))
      }
      if (tenantAiRes?.code === 0 && tenantAiRes.data)
        setTenantAiConfig({ ...defaultTenantAiConfig, ...tenantAiRes.data })

      if (res?.code === 0 && res.data) {
        const remote = res.data
        const remoteLeads = (normalizeLeads(remote.leads) || []).filter(item => !isNoisyKeywordLead(item))
        const remoteCustomerRecords = (remote.customerRecords || customerRecords).filter(item => !isNoisyKeywordCustomerRecord(item))
        const remoteReplyCandidates = (normalizeReplyCandidates(remote.replyCandidates, remoteLeads) || seedReplyCandidates)
          .filter(item => !isNoisyKeywordReplyCandidate(item))
        const remoteExecutionLogs = (remote.executionLogs || []).filter(item => !isNoisyKeywordExecutionLog(item))
        const remoteProfile = normalizeProfile(remote.profile)
        const tenantAwareProfile = tenantRes?.code === 0 && tenantRes.data
          ? { ...remoteProfile, dailyLimit: tenantRes.data.dailyLimit || remoteProfile.dailyLimit }
          : remoteProfile
        setProfile(tenantAwareProfile)
        setKeywordText(joinText(remote.profile?.keywords || defaultProfile.keywords))
        setKeywordDiscoveryTerm(remote.profile?.keywords?.[0] || defaultProfile.keywords[0] || '')
        setPainPointText(joinText(remote.profile?.painPoints || defaultProfile.painPoints))
        setExcludedText(joinText(remote.profile?.excludedWords || defaultProfile.excludedWords))
        setLeads(remoteLeads)
        setCustomerRecordsState(remoteCustomerRecords)
        setAutomationRun(remote.automationRun || initialAutomationRun)
        setReplyCandidates(remoteReplyCandidates)
        setExecutionLogs(remoteExecutionLogs)
        setPlatformCapabilities(remote.platformCapabilities || getCustomerRadarPlatformCapabilities(remote.profile?.platforms || defaultProfile.platforms))
        setAutomationTasks(normalizeAutomationTasks(remote.automationTasks, remoteProfile))
        setTaskRuns(normalizeTaskRuns(remote.taskRuns))
        setSocialAccounts(normalizeSocialAccounts(remote.socialAccounts, tenantAwareProfile))
        setOwnedPostWorkId(remote.ownedPostWorkId || '')
        setOwnedPostXsecToken(remote.ownedPostXsecToken || '')
        setLiveExecutionEnabled(Boolean(remote.liveExecutionEnabled))
        setSelectedLeadId(remoteLeads[0]?.id || null)
        setSelectedCustomerId(remoteLeads[0]?.customerId || null)
        setSelectedTaskId(remote.automationTasks?.[0]?.id || null)
        setSelectedTaskRunId(remote.taskRuns?.[0]?.id || remote.automationTasks?.[0]?.runs?.[0]?.id || null)
      }

      remoteLoadedRef.current = true
    }

    void loadRemoteWorkspace()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!remoteLoadedRef.current)
      return

    const saveTimer = window.setTimeout(() => {
      void customerRadarApi.saveWorkspace({
        automationRun,
        automationTasks,
        customerRecords: customerRecordsState,
        executionLogs,
        leads,
        liveExecutionEnabled,
        ownedPostWorkId,
        ownedPostXsecToken,
        platformCapabilities,
        profile,
        replyCandidates,
        socialAccounts,
        taskRuns,
      })
    }, 700)

    return () => window.clearTimeout(saveTimer)
  }, [automationRun, automationTasks, customerRecordsState, executionLogs, leads, liveExecutionEnabled, ownedPostWorkId, ownedPostXsecToken, platformCapabilities, profile, replyCandidates, socialAccounts, taskRuns])

  useEffect(() => {
    setSocialAccounts(current => normalizeSocialAccounts(current, profile))
  }, [profile.platforms])

  useEffect(() => {
    if (!remoteLoadedRef.current)
      return

    const timer = window.setInterval(() => {
      const now = Date.now()
      const dueTask = automationTasks.find((task) => {
        if (task.cadence === 'manual' || task.status === 'running' || task.status === 'paused')
          return false
        if (autoRunningTaskIdsRef.current.has(task.id))
          return false

        const nextRunAt = parseTaskRunTime(task.nextRunAt)
        return nextRunAt !== null && nextRunAt <= now
      })

      if (!dueTask)
        return

      autoRunningTaskIdsRef.current.add(dueTask.id)
      void handleRunAutomationTask(dueTask.id, { automated: true }).finally(() => {
        autoRunningTaskIdsRef.current.delete(dueTask.id)
      })
    }, 30 * 1000)

    return () => window.clearInterval(timer)
  }, [automationTasks])

  function syncProfile() {
    const nextProfile: CustomerRadarProfile = {
      ...profile,
      excludedWords: splitText(excludedText),
      keywords: splitText(keywordText),
      painPoints: splitText(painPointText),
    }
    setProfile(nextProfile)
    return nextProfile
  }

  function getTaskRunAllowance(task: CustomerRadarTask) {
    const remainingToday = Math.max(task.dailyLimit - task.dailyUsed, 0)
    const allowedCount = Math.min(task.perRunLimit, remainingToday)

    if (task.failureCount >= task.maxFailures) {
      return {
        allowed: false,
        count: 0,
        reason: `连续失败 ${task.failureCount} 次，已达到自动暂停阈值。`,
      }
    }

    if (remainingToday <= 0) {
      return {
        allowed: false,
        count: 0,
        reason: `今日额度已用完：${task.dailyUsed}/${task.dailyLimit}。`,
      }
    }

    return {
      allowed: true,
      count: Math.max(1, allowedCount),
      reason: '',
    }
  }

  function getNextRunText(task: CustomerRadarTask) {
    return getNextRunAtForCadence(task.cadence)
  }

  function waitForCooldown(seconds: number) {
    const bounded = Math.min(Math.max(seconds, 0), 2)
    return new Promise(resolve => window.setTimeout(resolve, bounded * 1000))
  }

  function handleScan() {
    const nextProfile = syncProfile()
    setIsScanning(true)
    window.setTimeout(() => {
      const nextLeads = createLeads(nextProfile)
      setLeads(nextLeads)
      setSelectedLeadId(nextLeads[0]?.id || null)
      setSelectedCustomerId(nextLeads[0]?.customerId || null)
      setIsScanning(false)
      toast.success(`已发现 ${nextLeads.length} 条客户信号`)
    }, 900)
  }

  function createReplyDrafts(nextLeads: CustomerLead[], nextProfile: CustomerRadarProfile, mode: CustomerRadarAutomationRun['mode']) {
    const enabledSources = new Set(nextProfile.commentSources?.length ? nextProfile.commentSources : defaultProfile.commentSources)

    return seedReplyCandidates.filter(candidate => enabledSources.has(candidate.sourceType)).map((candidate, index) => {
      const matchedLead = nextLeads.find(lead => lead.customerId === candidate.customerId)

      return {
        ...candidate,
        id: `reply-candidate-${Date.now()}-${index}`,
        leadId: matchedLead?.id || '',
        status: mode === 'full_auto' ? 'approved' as const : 'draft' as const,
      }
    })
  }

  function createOwnedPostCandidates(comments: CommentItem[], workId: string, mode: CustomerRadarAutomationRun['mode']) {
    return comments.map((comment, index): CustomerReplyCandidate => {
      const author = comment.user.nickname || `评论用户${index + 1}`
      const customerId = `owned-xhs-${comment.user.id || comment.id}`

      return {
        id: `owned-reply-${comment.id}-${Date.now()}`,
        author,
        commentContent: comment.content,
        commentId: comment.id,
        customerId,
        customerMemory: `来自自己发布笔记评论，用户关心：${comment.content}`,
        knowledgeRefs: ['回复语气规则', '客户雷达核心价值', '平台触达边界'],
        leadId: workId,
        platform: 'xhs',
        replyContent: `可以的，你这个问题适合先做一次账号和评论区诊断。我们会先看你现在的内容、评论问题和客户画像，再给你一版低打扰的获客建议。`,
        riskNote: '自己笔记评论：用户已经主动咨询，回复风险较低；全自动模式下也会写入日志和客户记忆。',
        sourceTitle: `自己的小红书笔记 ${workId}`,
        sourceType: 'owned_post_comments',
        status: mode === 'full_auto' ? 'approved' : 'draft',
        workId,
      }
    })
  }

  function upsertOwnedPostCustomers(comments: CommentItem[], workId: string) {
    setCustomerRecordsState((items) => {
      const nextItems = [...items]

      for (const comment of comments) {
        const customerId = `owned-xhs-${comment.user.id || comment.id}`
        const existingIndex = nextItems.findIndex(item => item.id === customerId)
        const record: CustomerRecord = {
          city: comment.ipLocation || '未知',
          company: '小红书评论用户',
          id: customerId,
          interactions: [
            {
              id: `interaction-owned-${comment.id}-${Date.now()}`,
              at: new Date().toLocaleString('zh-CN', { hour12: false }),
              channel: 'xhs',
              summary: `在自己的笔记 ${workId} 下留言：${comment.content}`,
              type: 'comment',
            },
          ],
          lastTouchAt: new Date().toLocaleString('zh-CN', { hour12: false }),
          memory: [
            `来自自己发布笔记评论，原始评论是：${comment.content}`,
            '已主动在我方内容下咨询，优先级高于冷启动主动触达。',
          ],
          name: comment.user.nickname || '小红书评论用户',
          owner: '巨鲸增长顾问',
          platform: 'xhs',
          role: '潜在客户',
          source: `自己的小红书笔记 ${workId}`,
          stage: 'qualified',
          tags: ['自己笔记评论', '主动咨询'],
          valueLevel: 'high',
        }

        if (existingIndex >= 0) {
          nextItems[existingIndex] = {
            ...nextItems[existingIndex],
            interactions: [...record.interactions, ...nextItems[existingIndex].interactions],
            lastTouchAt: record.lastTouchAt,
            memory: Array.from(new Set([...record.memory, ...nextItems[existingIndex].memory])),
            stage: 'qualified',
          }
        }
        else {
          nextItems.unshift(record)
        }
      }

      return nextItems
    })
  }

  function keywordSignalCustomerId(signal: KeywordDiscoverySignal, index: number) {
    const raw = signal.authorId || signal.workId || `${signal.platform}-${signal.author}-${signal.sourceTitle || index}`
    return `keyword-${signal.platform}-${raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80)}`
  }

  function classifyKeywordDiscoverySignals(signals: KeywordDiscoverySignal[]) {
    const activeSignals: KeywordDiscoverySignal[] = []
    const revisitedSignals: KeywordDiscoverySignal[] = []
    const skippedSignals: KeywordDiscoverySignal[] = []

    signals.forEach((signal, index) => {
      const customerId = keywordSignalCustomerId(signal, index)
      const existingCustomer = customerRecordsState.find(customer => customer.id === customerId)

      if (!existingCustomer) {
        activeSignals.push(signal)
        return
      }

      if (existingCustomer.stage === 'invalid' || existingCustomer.stage === 'contacted' || existingCustomer.stage === 'converted') {
        skippedSignals.push(signal)
        return
      }

      if (existingCustomer.stage === 'warming' || existingCustomer.stage === 'qualified') {
        revisitedSignals.push(signal)
        return
      }

      activeSignals.push(signal)
    })

    return { activeSignals, revisitedSignals, skippedSignals }
  }

  function scoreKeywordSignal(signal: KeywordDiscoverySignal, nextProfile: CustomerRadarProfile) {
    const text = `${signal.sourceTitle} ${signal.commentContent}`
    const painHit = nextProfile.painPoints.some(word => word && text.includes(word))
    const keywordHit = nextProfile.keywords.some(word => word && text.includes(word))
    const actionHit = /咨询|怎么|如何|没人|没流量|获客|引流|客户|转化|报价|收费/.test(text)
    return Math.min(96, 62 + (painHit ? 16 : 0) + (keywordHit ? 10 : 0) + (actionHit ? 12 : 0))
  }

  function createKeywordDiscoveryLeads(signals: KeywordDiscoverySignal[], nextProfile: CustomerRadarProfile): CustomerLead[] {
    const now = Date.now()
    return signals.map((signal, index) => {
      const score = scoreKeywordSignal(signal, nextProfile)
      const customerId = keywordSignalCustomerId(signal, index)
      const intent: CustomerLeadIntent = score >= 84 ? 'high' : score >= 72 ? 'medium' : 'low'

      return {
        author: signal.author,
        avatarText: signal.author.slice(0, 1) || '客',
        createdAt: new Date(now - index * 1000 * 60 * 8).toISOString(),
        customerId,
        demandSummary: `围绕“${signal.keyword}”出现潜在需求：${signal.commentContent}`,
        id: `keyword-lead-${now}-${index}`,
        intent,
        nextAction: automationRun.mode === 'full_auto'
          ? '全自动模式会低频发布一条有帮助的评论，并写入客户记忆。'
          : '先进入人工确认队列，确认语气和平台页面后再评论。',
        platform: signal.platform,
        score,
        signalText: signal.commentContent,
        sourceTitle: signal.sourceTitle,
        sourceUrl: signal.sourceUrl || platformLoginUrls[signal.platform],
        status: nextProfile.requireApproval ? 'pending_approval' : 'new',
        suggestedReply: `你这个情况可以先从“同城用户会搜什么、内容有没有承接到咨询、评论里哪些人真的有需求”三步拆开看。先把最近几篇内容和评论整理一下，通常能看出卡在哪一步。`,
        tags: ['关键词获客', signal.keyword, intent === 'high' ? '高意向' : '待培育'],
      }
    })
  }

  function createKeywordDiscoveryCandidates(signals: KeywordDiscoverySignal[], nextLeads: CustomerLead[], mode: CustomerRadarAutomationRun['mode']): CustomerReplyCandidate[] {
    return signals.map((signal, index) => {
      const customerId = keywordSignalCustomerId(signal, index)
      const lead = nextLeads.find(item => item.customerId === customerId)

      return {
        author: signal.author,
        commentContent: signal.commentContent,
        customerId,
        customerMemory: `来自关键词“${signal.keyword}”搜索发现，用户表达：${signal.commentContent}`,
        id: `keyword-reply-${Date.now()}-${index}`,
        knowledgeRefs: ['客户雷达核心价值', '平台触达边界', '回复语气规则'],
        leadId: lead?.id || '',
        platform: signal.platform,
        replyContent: `你这个情况可以先别急着投流，先看同城搜索词和评论里有没有真实需求。把最近几篇内容、评论和咨询入口放一起看，通常能先判断是选题不准、承接不顺，还是回复节奏没跟上。`,
        riskNote: '关键词获客：属于陌生内容评论，建议低频、人工确认优先；全自动模式也应控制每日上限。',
        sourceTitle: signal.sourceTitle,
        sourceType: 'keyword_discovery',
        status: mode === 'full_auto' ? 'approved' : 'draft',
        workId: signal.workId,
      }
    })
  }

  function isNoisyKeywordText(text: string) {
    return /相关搜索|登录后查看搜索结果|手机号登录|获取验证码|扫码登录|沪ICP备|营业执照/.test(text)
  }

  function isNoisyKeywordLead(item: CustomerLead) {
    return item.tags.includes('关键词获客')
      && isNoisyKeywordText(`${item.author} ${item.sourceTitle} ${item.signalText} ${item.demandSummary}`)
  }

  function isNoisyKeywordReplyCandidate(item: CustomerReplyCandidate) {
    return item.sourceType === 'keyword_discovery'
      && isNoisyKeywordText(`${item.author} ${item.sourceTitle} ${item.commentContent} ${item.customerMemory}`)
  }

  function isNoisyKeywordCustomerRecord(item: CustomerRecord) {
    if (!item.tags.includes('关键词获客'))
      return false

    const interactionText = item.interactions.map(interaction => interaction.summary).join(' ')
    return isNoisyKeywordText(`${item.name} ${item.source} ${item.memory.join(' ')} ${interactionText}`)
  }

  function isNoisyKeywordExecutionLog(item: CustomerRadarExecutionLog) {
    return isNoisyKeywordText(`${item.title} ${item.detail}`)
  }

  function upsertKeywordDiscoveryCustomers(signals: KeywordDiscoverySignal[], revisitedSignals: KeywordDiscoverySignal[] = []) {
    setCustomerRecordsState((items) => {
      const nextItems = items.filter(item => !isNoisyKeywordCustomerRecord(item))

      signals.forEach((signal, index) => {
        const customerId = keywordSignalCustomerId(signal, index)
        const existingIndex = nextItems.findIndex(item => item.id === customerId)
        const record: CustomerRecord = {
          city: profile.region || '未知',
          company: '社媒潜在线索',
          id: customerId,
          interactions: [
            {
              id: `interaction-keyword-${Date.now()}-${index}`,
              at: nowText(),
              channel: signal.platform,
              summary: `关键词“${signal.keyword}”发现信号：${signal.commentContent}`,
              type: 'comment',
            },
          ],
          lastTouchAt: nowText(),
          memory: [
            `来自关键词“${signal.keyword}”搜索发现。`,
            `原始信号：${signal.commentContent}`,
            '陌生线索，首次回复必须先提供判断和建议，避免硬销售。',
          ],
          name: signal.author || '社媒潜在线索',
          owner: '巨鲸增长顾问',
          platform: signal.platform,
          role: '潜在客户',
          source: signal.sourceTitle,
          stage: 'new',
          tags: ['关键词获客', signal.keyword],
          valueLevel: 'medium',
        }

        if (existingIndex >= 0) {
          nextItems[existingIndex] = {
            ...nextItems[existingIndex],
            interactions: [...record.interactions, ...nextItems[existingIndex].interactions],
            lastTouchAt: record.lastTouchAt,
            memory: Array.from(new Set([...record.memory, ...nextItems[existingIndex].memory])),
          }
        }
        else {
          nextItems.unshift(record)
        }
      })

      revisitedSignals.forEach((signal, index) => {
        const customerId = keywordSignalCustomerId(signal, index)
        const existingIndex = nextItems.findIndex(item => item.id === customerId)
        if (existingIndex < 0)
          return

        const interaction: CustomerInteraction = {
          id: `interaction-keyword-repeat-${Date.now()}-${index}`,
          at: nowText(),
          channel: signal.platform,
          summary: `关键词“${signal.keyword}”再次发现该客户：${signal.commentContent}`,
          type: 'note',
        }
        const memory = `后续批次再次出现关键词“${signal.keyword}”相关信号，适合按二次触达节奏处理。`

        nextItems[existingIndex] = {
          ...nextItems[existingIndex],
          interactions: [interaction, ...nextItems[existingIndex].interactions],
          lastTouchAt: interaction.at,
          memory: nextItems[existingIndex].memory.includes(memory)
            ? nextItems[existingIndex].memory
            : [memory, ...nextItems[existingIndex].memory],
        }
      })

      return nextItems
    })
  }

  async function runKeywordDiscovery(nextProfile: CustomerRadarProfile, options?: { limit?: number }) {
    const keyword = keywordDiscoveryTerm.trim() || nextProfile.keywords[0] || ''
    if (keyword && keyword !== keywordDiscoveryTerm)
      setKeywordDiscoveryTerm(keyword)

    const result = await scanKeywordDiscovery({
      count: options?.limit || Math.min(Math.max(nextProfile.dailyLimit, 1), 12),
      excludedWords: nextProfile.excludedWords,
      keyword,
      platform: 'xhs',
    })
    setExecutionLogs(current => [result.log, ...current.filter(item => !isNoisyKeywordExecutionLog(item))])

    if (!result.success)
      return {
        candidates: [] as CustomerReplyCandidate[],
        leads: [] as CustomerLead[],
        revisitedSignals: [] as KeywordDiscoverySignal[],
        signals: result.signals,
        skippedSignals: [] as KeywordDiscoverySignal[],
      }

    const classified = classifyKeywordDiscoverySignals(result.signals)
    const nextLeads = createKeywordDiscoveryLeads(classified.activeSignals, nextProfile)
    const nextCandidates = createKeywordDiscoveryCandidates(classified.activeSignals, nextLeads, automationRun.mode)
    upsertKeywordDiscoveryCustomers(classified.activeSignals, classified.revisitedSignals)
    if (classified.revisitedSignals.length || classified.skippedSignals.length) {
      setExecutionLogs(current => [
        {
          id: `customer-radar-dedupe-${Date.now()}`,
          at: nowText(),
          detail: `本轮关键词搜索已降噪：${classified.revisitedSignals.length} 条归入二次触达记忆，${classified.skippedSignals.length} 条已跟进/无效线索跳过。`,
          level: 'info',
          title: '重复线索已降噪',
        },
        ...current,
      ])
    }
    setLeads(current => [...nextLeads, ...current.filter(item => !isNoisyKeywordLead(item) && !nextLeads.some(next => next.customerId === item.customerId))])
    setReplyCandidates(current => [...nextCandidates, ...current.filter(item => !isNoisyKeywordReplyCandidate(item) && !nextCandidates.some(next => next.customerId === item.customerId && next.sourceType === item.sourceType))])
    setSelectedLeadId(nextLeads[0]?.id || selectedLeadId)
    setSelectedCustomerId(nextLeads[0]?.customerId || selectedCustomerId)

    return {
      candidates: nextCandidates,
      leads: nextLeads,
      revisitedSignals: classified.revisitedSignals,
      signals: result.signals,
      skippedSignals: classified.skippedSignals,
    }
  }

  async function handleRunKeywordDiscovery() {
    const nextProfile = syncProfile()
    setIsKeywordDiscovering(true)
    setAutomationRun(current => ({
      ...current,
      status: 'scanning',
      updatedAt: `正在搜索关键词：${keywordDiscoveryTerm || nextProfile.keywords[0] || '未设置'}`,
    }))

    const result = await runKeywordDiscovery(nextProfile)
    setAutomationRun(current => ({
      ...current,
      collectedCount: current.collectedCount + result.leads.length,
      replyDraftCount: current.replyDraftCount + result.candidates.length,
      scannedCount: current.scannedCount + Math.max(result.signals.length, result.leads.length),
      status: current.mode === 'full_auto' && result.candidates.length ? 'publishing' : 'awaiting_approval',
      updatedAt: result.leads.length ? '关键词获客已生成线索和候选回复' : '关键词获客暂无新线索',
    }))

  if (automationRun.mode === 'full_auto' && result.candidates.length) {
      let successCount = 0
      let skippedCount = 0
      for (const candidate of result.candidates) {
        await waitForCooldown(createTaskLimitPolicy(nextProfile).cooldownSeconds)
        const outcome = await publishReplyCandidate(candidate, { silent: true })
        if (outcome === 'published')
          successCount += 1
        if (outcome === 'skipped')
          skippedCount += 1
      }
      setExecutionLogs(current => [
        {
          id: `customer-radar-log-${Date.now()}`,
          at: nowText(),
          detail: liveExecutionEnabled
            ? `关键词获客全自动发布 ${successCount}/${result.candidates.length} 条候选回复。`
            : `关键词获客安全演练 ${skippedCount}/${result.candidates.length} 条候选回复，未向平台发送评论。`,
          level: successCount + skippedCount === result.candidates.length ? 'success' : 'warning',
          title: liveExecutionEnabled
            ? (successCount === result.candidates.length ? '关键词获客发布完成' : '关键词获客部分发布失败')
            : (skippedCount === result.candidates.length ? '关键词获客演练完成' : '关键词获客演练部分失败'),
        },
        ...current,
      ])
    }

    setIsKeywordDiscovering(false)
    toast[result.leads.length ? 'success' : 'warning'](
      result.leads.length ? `已发现 ${result.leads.length} 条关键词线索` : '本轮关键词未发现可用线索',
    )
  }

  async function handleStartAutomationRun() {
    const nextProfile = syncProfile()
    const inspection = await probeCustomerRadarExecutor(nextProfile)
    setPlatformCapabilities(inspection.capabilities)
    setSocialAccounts(inspection.socialAccounts)
    setExecutionLogs(current => [...inspection.logs, ...current])
    setIsScanning(true)
    setAutomationRun(current => ({
      ...current,
      status: 'scanning',
      updatedAt: '正在扫描评论区',
    }))
    const enabledSources = new Set(nextProfile.commentSources?.length ? nextProfile.commentSources : defaultProfile.commentSources)
    const keywordResult = enabledSources.has('keyword_discovery')
      ? await runKeywordDiscovery(nextProfile)
      : { candidates: [] as CustomerReplyCandidate[], leads: [] as CustomerLead[], signals: [] as KeywordDiscoverySignal[] }

    window.setTimeout(() => {
      const nextLeads = keywordResult.leads.length ? keywordResult.leads : createLeads(nextProfile)
      const nextReplyCandidates = keywordResult.candidates.length
        ? keywordResult.candidates
        : createReplyDrafts(nextLeads, nextProfile, automationRun.mode)

      setLeads(nextLeads)
      setReplyCandidates(nextReplyCandidates)
      setSelectedLeadId(nextLeads[0]?.id || null)
      setSelectedCustomerId(nextLeads[0]?.customerId || null)
      setAutomationRun(current => ({
        ...current,
        status: current.mode === 'full_auto' ? 'publishing' : 'awaiting_approval',
        scannedCount: keywordResult.signals.length || 28,
        collectedCount: nextLeads.length,
        replyDraftCount: nextReplyCandidates.length,
        publishedCount: 0,
        updatedAt: current.mode === 'full_auto' ? '正在全自动发布回复' : '刚刚完成扫描',
      }))
      setExecutionLogs(current => [
        {
          id: `customer-radar-log-${Date.now()}`,
          at: new Date().toLocaleString('zh-CN', { hour12: false }),
          detail: `${keywordResult.signals.length ? '关键词搜索别人笔记/评论' : '演示扫描'}完成，扫描评论 ${keywordResult.signals.length || 28} 条，收集客户 ${nextLeads.length} 个，生成候选回复 ${nextReplyCandidates.length} 条。`,
          level: 'success',
          title: '扫描任务完成',
        },
        ...current,
      ])
      if (automationRun.mode === 'full_auto') {
        window.setTimeout(() => {
          void (async () => {
            let successCount = 0
            let skippedCount = 0
            for (const candidate of nextReplyCandidates) {
              await waitForCooldown(createTaskLimitPolicy(nextProfile).cooldownSeconds)
              const outcome = await publishReplyCandidate(candidate, { silent: true })
              if (outcome === 'published')
                successCount += 1
              if (outcome === 'skipped')
                skippedCount += 1
            }
            setExecutionLogs(current => [
              {
                id: `customer-radar-log-${Date.now()}`,
                at: new Date().toLocaleString('zh-CN', { hour12: false }),
                detail: liveExecutionEnabled
                  ? `全自动模式已发布 ${successCount}/${nextReplyCandidates.length} 条候选回复，并回写客户记忆。`
                  : `安全演练已处理 ${skippedCount}/${nextReplyCandidates.length} 条候选回复，未向平台发送评论。`,
                level: successCount + skippedCount === nextReplyCandidates.length ? 'success' : 'warning',
                title: liveExecutionEnabled
                  ? (successCount === nextReplyCandidates.length ? '全自动发布完成' : '全自动发布部分失败')
                  : (skippedCount === nextReplyCandidates.length ? '安全演练完成' : '安全演练部分失败'),
              },
              ...current,
            ])
            setAutomationRun(current => ({
              ...current,
              status: 'awaiting_approval',
              updatedAt: liveExecutionEnabled
                ? (successCount === nextReplyCandidates.length ? '全自动发布完成' : '全自动发布部分失败')
                : (skippedCount === nextReplyCandidates.length ? '安全演练完成，未真实发布' : '安全演练部分失败'),
            }))
          })()
        }, 500)
      }
      setIsScanning(false)
      toast.success('已完成扫描、客户信息收集和候选回复生成')
    }, 1100)
  }

  function handlePauseAutomationRun() {
    setAutomationRun(current => ({
      ...current,
      status: 'paused',
      updatedAt: '已暂停',
    }))
    setExecutionLogs(current => [
      {
        id: `customer-radar-log-${Date.now()}`,
        at: new Date().toLocaleString('zh-CN', { hour12: false }),
        detail: '用户手动暂停任务，后续不会继续生成或发布回复。',
        level: 'warning',
        title: '任务已暂停',
      },
      ...current,
    ])
    toast.info('自动获客任务已暂停')
  }

  async function handleInspectExecutor() {
    const inspection = await probeCustomerRadarExecutor(syncProfile())
    setPlatformCapabilities(inspection.capabilities)
    setSocialAccounts(inspection.socialAccounts)
    setExecutionLogs(current => [...inspection.logs, ...current])
    toast.success('已检测插件和平台执行能力')
  }

  async function handlePluginDiagnostic() {
    setIsPluginDiagnosticRunning(true)
    const checkedAt = nowText()
    const plugin = ensurePluginBridge()

    if (!plugin) {
      const result: PluginDiagnosticResult = {
        checkedAt,
        hasPlugin: false,
        platforms: [
          { error: '未检测到浏览器插件对象', platform: 'xhs', ready: false },
          { error: '未检测到浏览器插件对象', platform: 'douyin', ready: false },
        ],
      }
      setPluginDiagnostic(result)
      setExecutionLogs(current => [
        {
          id: `customer-radar-plugin-${Date.now()}`,
          at: checkedAt,
          detail: '当前浏览器没有注入 window.AIToEarnPlugin。请确认已安装并启用巨鲸网络智能获客助手。',
          level: 'warning',
          title: '插件未检测到',
        },
        ...current,
      ])
      setIsPluginDiagnosticRunning(false)
      toast.warning('未检测到巨鲸浏览器插件')
      return
    }

    const result: PluginDiagnosticResult = {
      checkedAt,
      hasPlugin: true,
      platforms: [],
    }

    try {
      result.version = await plugin.getVersion?.()
    }
    catch {
      result.version = { name: '未知插件', version: '未知' }
    }

    try {
      result.permission = await plugin.checkPermission?.()
    }
    catch {
      result.permission = { granted: false, origins: [], permissions: [] }
    }

    for (const platform of ['xhs', 'douyin'] as const) {
      try {
        const account = await (plugin as any).login(platform)
        result.platforms.push({
          nickname: account?.nickname || account?.account || `${platformLabels[platform]}账号`,
          platform,
          ready: true,
          uid: account?.uid,
        })
      }
      catch (error) {
        result.platforms.push({
          error: error instanceof Error ? error.message : '登录态检测失败',
          platform,
          ready: false,
        })
      }
    }

    setPluginDiagnostic(result)
    setPlatformCapabilities(current => current.map(capability => result.platforms.some(item => item.platform === capability.platform && item.ready)
      ? {
          ...capability,
          available: true,
          canPublishComment: true,
          canScanComments: true,
          note: '巨鲸插件已检测到登录态，可进入真实执行链路测试。',
        }
      : capability))
    setSocialAccounts(current => current.map(account => {
      const detected = result.platforms.find(item => item.platform === account.platform)
      if (!detected)
        return account

      return {
        ...account,
        lastCheckedAt: checkedAt,
        loginStatus: detected.ready ? 'logged_in' : 'not_logged_in',
        nickname: detected.nickname || account.nickname,
        note: detected.ready ? '插件已检测到平台登录态。' : detected.error || '未检测到平台登录态。',
        pluginConnected: result.hasPlugin,
      }
    }))
    setExecutionLogs(current => [
      {
        id: `customer-radar-plugin-${Date.now()}`,
        at: checkedAt,
        detail: `插件：${result.version?.name || '未知'} ${result.version?.version || ''}；权限：${result.permission?.granted ? '已授权' : '未授权'}；小红书：${result.platforms.find(item => item.platform === 'xhs')?.ready ? '已登录' : '未登录'}；抖音：${result.platforms.find(item => item.platform === 'douyin')?.ready ? '已登录' : '未登录'}。`,
        level: result.platforms.some(item => item.ready) ? 'success' : 'warning',
        title: '插件诊断完成',
      },
      ...current,
    ])
    setIsPluginDiagnosticRunning(false)
    toast.success('插件诊断完成')
  }

  function handleCreateAutomationTask() {
    const nextProfile = syncProfile()
    const task = {
      ...createAutomationTask(nextProfile, automationRun.mode, ownedPostWorkId.trim(), taskCadence),
      dailyLimit: tenantContext?.dailyLimit || nextProfile.dailyLimit,
      perRunLimit: tenantContext?.perRunLimit || createTaskLimitPolicy(nextProfile).perRunLimit,
    }
    setAutomationTasks(current => [task, ...current])
    setSelectedTaskId(task.id)
    setSelectedTaskRunId(null)
    setExecutionLogs(current => [
      {
        id: `customer-radar-log-${Date.now()}`,
        at: nowText(),
        detail: `已创建任务“${task.name}”，覆盖 ${task.platforms.map(platform => platformLabels[platform]).join('、')}，频率为${taskCadenceLabel(task.cadence)}，回复模式为${automationModeLabel(task.mode)}。每日上限 ${task.dailyLimit}，单轮上限 ${task.perRunLimit}，动作间隔 ${task.cooldownSeconds} 秒，失败 ${task.maxFailures} 次自动暂停。`,
        level: 'success',
        title: '自动获客任务已创建',
      },
      ...current,
    ])
    toast.success('已创建自动获客任务')
  }

  async function handleRunAutomationTask(taskId: string, options?: { automated?: boolean }) {
    const task = automationTasks.find(item => item.id === taskId)
    if (!task)
      return
    setSelectedTaskId(taskId)
    const startedAt = nowText()
    const allowance = getTaskRunAllowance(task)
    if (!allowance.allowed) {
      setAutomationTasks(items => items.map(item => item.id === taskId
        ? {
            ...item,
            lastLog: allowance.reason,
            status: 'paused',
            updatedAt: nowText(),
          }
        : item))
      setExecutionLogs(current => [
        {
          id: `customer-radar-log-${Date.now()}`,
          at: nowText(),
          detail: allowance.reason,
          level: 'warning',
          title: '任务已被限频暂停',
        },
        ...current,
      ])
      toast.warning('任务已被限频策略暂停')
      return
    }

    setAutomationTasks(items => items.map(item => item.id === taskId
      ? {
          ...item,
          lastLog: `任务正在运行：本轮最多处理 ${allowance.count} 条，动作间隔 ${item.cooldownSeconds} 秒。`,
          status: 'running',
          updatedAt: nowText(),
        }
      : item))

    setExecutionLogs(current => [
      {
        id: `customer-radar-log-${Date.now()}`,
        at: startedAt,
        detail: `${options?.automated ? '到达计划时间，' : ''}任务“${task.name}”已开始运行。本轮上限 ${allowance.count}，今日已用 ${task.dailyUsed}/${task.dailyLimit}，失败阈值 ${task.failureCount}/${task.maxFailures}。`,
        level: 'info',
        title: options?.automated ? '任务自动触发' : '任务启动',
      },
      ...current,
    ])

    const nextProfile = syncProfile()
    const producedCandidates: CustomerReplyCandidate[] = []
    const producedLeadIds: string[] = []
    let collected = 0
    let published = 0
    let revisited = 0
    let scanned = 0
    let skipped = 0
    let failed = 0

    if (task.commentSources.includes('keyword_discovery')) {
      const result = await runKeywordDiscovery(nextProfile, { limit: allowance.count })
      producedCandidates.push(...result.candidates)
      producedLeadIds.push(...result.leads.map(lead => lead.id))
      collected += result.leads.length
      revisited += result.revisitedSignals.length
      scanned += Math.max(result.signals.length, result.leads.length)
      skipped += result.skippedSignals.length
      if (!result.leads.length && !result.revisitedSignals.length && !result.skippedSignals.length)
        failed += 1
    }

    const remainingAllowance = Math.max(allowance.count - scanned, 0)
    if (task.commentSources.includes('owned_post_comments') && task.ownedPostWorkId && remainingAllowance > 0) {
      const result = await scanOwnedPostComments({
        count: remainingAllowance,
        platform: 'xhs',
        workId: task.ownedPostWorkId,
        xsecToken: ownedPostXsecToken.trim() || undefined,
      })
      setExecutionLogs(current => [result.log, ...current])
      if (result.success) {
        const candidates = createOwnedPostCandidates(result.comments, task.ownedPostWorkId, task.mode)
        producedCandidates.push(...candidates)
        upsertOwnedPostCustomers(result.comments, task.ownedPostWorkId)
        setReplyCandidates(current => [...candidates, ...current])
        collected += result.comments.length
        scanned += result.comments.length
      }
      else {
        failed += 1
      }
    }

    if (task.mode === 'full_auto' && producedCandidates.length) {
      for (const candidate of producedCandidates) {
        await waitForCooldown(task.cooldownSeconds)
        const outcome = await publishReplyCandidate(candidate, { silent: true })
        if (outcome === 'published')
          published += 1
        else if (outcome === 'failed')
          failed += 1
      }
    }

    const used = Math.min(task.dailyLimit, task.dailyUsed + Math.max(scanned, collected) + published)
    const nextFailureCount = failed ? task.failureCount + 1 : 0
    const shouldPause = nextFailureCount >= task.maxFailures
    const completedAt = nowText()
    const taskRun: CustomerRadarTaskRun = {
      candidateIds: producedCandidates.map(candidate => candidate.id),
      candidates: producedCandidates.length,
      collected,
      commentSources: task.commentSources,
      completedAt,
      id: `customer-radar-run-${Date.now()}`,
      keyword: nextProfile.keywords[0] || keywordDiscoveryTerm || '',
      leadIds: producedLeadIds,
      published,
      revisited,
      scanned,
      skipped,
      startedAt,
      status: shouldPause ? 'paused' : failed ? 'failed' : 'completed',
      summary: shouldPause
        ? `连续失败达到 ${nextFailureCount}/${task.maxFailures}，任务已自动暂停。`
        : `本轮扫描 ${scanned}，客户 ${collected}，候选回复 ${producedCandidates.length}，跳过 ${skipped}，二次触达记忆 ${revisited}，发布 ${published}。`,
      taskId,
      taskName: task.name,
      trigger: options?.automated ? 'scheduled' : 'manual',
    }

    setAutomationTasks(items => items.map(item => item.id === taskId
      ? {
          ...item,
          dailyUsed: used,
          failureCount: nextFailureCount,
          lastLog: shouldPause
            ? `连续失败达到 ${nextFailureCount}/${item.maxFailures}，任务已自动暂停。`
            : `任务完成：扫描 ${scanned} 条，客户 ${collected} 个，候选回复 ${producedCandidates.length} 条，跳过 ${skipped} 条，二次触达记忆 ${revisited} 条，发布 ${published} 条。`,
          nextRunAt: shouldPause ? '已暂停，需人工恢复' : getNextRunText(item),
          runs: [taskRun, ...(item.runs || [])].slice(0, 30),
          stats: {
            collected: item.stats.collected + collected,
            published: item.stats.published + published,
            replies: item.stats.replies + producedCandidates.length,
            scanned: item.stats.scanned + scanned,
          },
          status: shouldPause ? 'paused' : 'completed',
          updatedAt: completedAt,
        }
      : item))
    setTaskRuns(current => [taskRun, ...current].slice(0, 80))
    setSelectedTaskRunId(taskRun.id)

    setAutomationRun(current => ({
      ...current,
      collectedCount: current.collectedCount + collected,
      publishedCount: current.publishedCount + published,
      replyDraftCount: current.replyDraftCount + producedCandidates.length,
      scannedCount: current.scannedCount + scanned,
      status: 'awaiting_approval',
      updatedAt: shouldPause ? '任务因连续失败自动暂停' : '任务已按限频策略完成',
    }))

    setExecutionLogs(current => [
      {
        id: `customer-radar-log-${Date.now()}`,
        at: completedAt,
        detail: shouldPause
          ? `任务“${task.name}”连续失败达到 ${nextFailureCount}/${task.maxFailures}，已自动暂停。`
          : `任务“${task.name}”按限频策略完成：本轮扫描 ${scanned}，客户入库 ${collected}，候选回复 ${producedCandidates.length}，跳过 ${skipped}，二次触达记忆 ${revisited}，发布 ${published}，今日额度 ${used}/${task.dailyLimit}。`,
        level: shouldPause ? 'warning' : 'success',
        title: shouldPause ? '任务自动暂停' : '任务完成',
      },
      ...current,
    ])
    toast[shouldPause ? 'warning' : 'success'](shouldPause ? '任务已自动暂停' : '任务已按限频策略完成')
  }

  function handleStopAutomationTask(taskId: string) {
    setAutomationTasks(items => items.map(item => item.id === taskId
      ? {
          ...item,
          lastLog: '任务已手动停止，不会继续执行下一步动作。',
          status: 'paused',
          updatedAt: nowText(),
        }
      : item))
    handlePauseAutomationRun()
  }

  async function handleFetchOwnedPostComments() {
    setIsFetchingOwnedComments(true)
    const workId = ownedPostWorkId.trim() || 'demo-owned-note'
    if (!ownedPostWorkId.trim())
      setOwnedPostWorkId(workId)

    const result = await scanOwnedPostComments({
      count: 20,
      platform: 'xhs',
      workId,
      xsecToken: ownedPostXsecToken.trim() || undefined,
    })
    setExecutionLogs(current => [result.log, ...current])

    if (!result.success) {
      setIsFetchingOwnedComments(false)
      toast.error('抓取自己笔记评论失败，请查看日志')
      return
    }

    const nextCandidates = createOwnedPostCandidates(result.comments, workId, automationRun.mode)
    upsertOwnedPostCustomers(result.comments, workId)
    setReplyCandidates(current => [...nextCandidates, ...current.filter(item => item.sourceType !== 'owned_post_comments' || item.workId !== workId)])
    setAutomationRun(current => ({
      ...current,
      collectedCount: current.collectedCount + result.comments.length,
      publishedCount: current.publishedCount,
      replyDraftCount: current.replyDraftCount + nextCandidates.length,
      status: current.mode === 'full_auto' ? 'publishing' : 'awaiting_approval',
      updatedAt: current.mode === 'full_auto' ? '正在全自动发布自己笔记评论' : '已生成自己笔记评论候选回复',
    }))

    if (automationRun.mode === 'full_auto') {
      let successCount = 0
      let skippedCount = 0
      for (const candidate of nextCandidates) {
        await waitForCooldown(createTaskLimitPolicy(syncProfile()).cooldownSeconds)
        const outcome = await publishReplyCandidate(candidate, { silent: true })
        if (outcome === 'published')
          successCount += 1
        if (outcome === 'skipped')
          skippedCount += 1
      }
      setExecutionLogs(current => [
        {
          id: `customer-radar-log-${Date.now()}`,
          at: new Date().toLocaleString('zh-CN', { hour12: false }),
          detail: liveExecutionEnabled
            ? `全自动模式已发布自己笔记评论 ${successCount}/${nextCandidates.length} 条。`
            : `自己笔记评论安全演练 ${skippedCount}/${nextCandidates.length} 条，未向平台发送评论。`,
          level: successCount + skippedCount === nextCandidates.length ? 'success' : 'warning',
          title: liveExecutionEnabled
            ? (successCount === nextCandidates.length ? '自己笔记评论自动回复完成' : '自己笔记评论部分发布失败')
            : (skippedCount === nextCandidates.length ? '自己笔记评论演练完成' : '自己笔记评论演练部分失败'),
        },
        ...current,
      ])
      setAutomationRun(current => ({
        ...current,
        status: 'awaiting_approval',
        updatedAt: liveExecutionEnabled
          ? (successCount === nextCandidates.length ? '自己笔记评论已全自动发布' : '自己笔记评论部分发布失败')
          : (skippedCount === nextCandidates.length ? '自己笔记评论演练完成，未真实发布' : '自己笔记评论演练部分失败'),
      }))
    }

    setIsFetchingOwnedComments(false)
    toast.success(`已处理 ${result.comments.length} 条自己笔记评论`)
  }

  function updateLeadStatus(leadId: string, status: CustomerLeadStatus) {
    setLeads(items => items.map(item => item.id === leadId ? { ...item, status } : item))
  }

  function updateTenantAiConfig(patch: Partial<CustomerRadarTenantAiConfig>) {
    setTenantAiConfig(current => ({ ...current, ...patch }))
  }

  async function handleSaveTenantAiConfig() {
    setIsSavingTenantAiConfig(true)
    const res = await customerRadarApi.saveTenantAiConfig(tenantAiConfig)
    setIsSavingTenantAiConfig(false)

    if (res?.code === 0 && res.data) {
      setTenantAiConfig({ ...defaultTenantAiConfig, ...res.data })
      toast.success('AI Key 配置已保存')
      return
    }

    toast.error(res?.message || 'AI Key 配置保存失败')
  }

  async function handleGenerateReply(candidateId: string) {
    const candidate = replyCandidates.find(item => item.id === candidateId)
    if (!candidate)
      return

    const customer = customerRecordsState.find(item => item.id === candidate.customerId)
    const relatedKnowledge = knowledgeBase
      .filter(item => item.enabled && (
        candidate.knowledgeRefs.includes(item.title)
        || candidate.knowledgeRefs.includes(item.id)
        || item.tags.some(tag => candidate.commentContent.includes(tag) || candidate.customerMemory.includes(tag))
      ))
      .slice(0, 4)

    setGeneratingReplyId(candidateId)
    const res = await customerRadarApi.generateReplyCandidate({
      candidate,
      customer,
      knowledgeRefs: relatedKnowledge.length ? relatedKnowledge : relevantKnowledge,
      profile,
    })
    setGeneratingReplyId(null)

    if (res?.code !== 0 || !res.data?.replyContent) {
      toast.error(res?.message || 'AI 生成失败')
      return
    }

    const generated = res.data
    const generatedAt = new Date().toLocaleString('zh-CN', { hour12: false })
    setReplyCandidates(items => items.map(item => item.id === candidateId
      ? {
          ...item,
          replyContent: generated.replyContent,
          riskNote: generated.source === 'fallback'
            ? '本次未调用外部模型，已使用本地兜底话术；发布前建议人工确认。'
            : `由${generated.source === 'tenant' ? '客户独立 Key' : '平台全局 Key'}生成，发布前请确认不含过度承诺。`,
        }
      : item))
    setExecutionLogs(current => [
      {
        id: `customer-radar-log-${Date.now()}`,
        at: generatedAt,
        detail: `已为 ${candidate.author} 生成候选回复，模型来源：${generated.source}，模型：${generated.model}。`,
        level: generated.source === 'fallback' ? 'warning' : 'success',
        title: generated.source === 'fallback' ? '已生成兜底回复' : 'AI 候选回复已生成',
      },
      ...current,
    ])
    toast.success(generated.source === 'fallback' ? '已生成兜底回复' : 'AI 回复已生成')
  }

  function handleApprove(leadId: string) {
    updateLeadStatus(leadId, 'approved')
    toast.success('已加入待触达队列')
  }

  function handleContacted(leadId: string) {
    updateLeadStatus(leadId, 'contacted')
    toast.success('已标记为已触达')
  }

  function handleReject(leadId: string) {
    updateLeadStatus(leadId, 'rejected')
    toast.info('已忽略该线索')
  }

  function updateCustomerFollowUp(customerId: string, action: CustomerFollowUpAction) {
    const now = nowText()
    const targetCustomer = customerRecordsState.find(customer => customer.id === customerId)
    if (!targetCustomer) {
      toast.warning('没有找到对应客户资料')
      return
    }

    const defaultFollowUpAt = targetCustomer.nextFollowUpAt || getDefaultFollowUpAt()
    const config: Record<CustomerFollowUpAction, {
      clearSchedule?: boolean
      leadStatus: CustomerLeadStatus
      memory: string
      nextFollowUpAt?: string
      stage: CustomerRecord['stage']
      summary: string
      toast: string
      valueLevel?: CustomerRecord['valueLevel']
    }> = {
      followed: {
        leadStatus: 'contacted',
        memory: '运营已完成首次跟进，后续应避免重复触达同一话题。',
        clearSchedule: true,
        stage: 'contacted',
        summary: '运营标记为已跟进。',
        toast: '已标记客户为已跟进',
      },
      invalid: {
        leadStatus: 'rejected',
        memory: '运营判断该线索暂不适合继续跟进，后续批次应降低同类信号优先级。',
        clearSchedule: true,
        stage: 'invalid',
        summary: '运营标记为无效线索。',
        toast: '已标记客户为无效',
        valueLevel: 'low',
      },
      revisit: {
        leadStatus: 'approved',
        memory: '运营标记为待二次触达，需要在后续批次或人工节奏中继续跟进。',
        nextFollowUpAt: defaultFollowUpAt,
        stage: 'warming',
        summary: `运营标记为待二次触达，计划 ${followUpTimeLabel(defaultFollowUpAt)} 跟进。`,
        toast: '已标记客户为待二次触达',
      },
    }
    const next = config[action]

    setCustomerRecordsState(items => items.map((customer) => {
      if (customer.id !== customerId)
        return customer

      const interaction: CustomerInteraction = {
        at: now,
        channel: customer.platform,
        id: `interaction-followup-${Date.now()}`,
        summary: next.summary,
        type: 'note',
      }

      return {
        ...customer,
        interactions: [interaction, ...customer.interactions],
        followUpNote: next.clearSchedule ? '' : customer.followUpNote,
        lastTouchAt: now,
        memory: customer.memory.includes(next.memory) ? customer.memory : [next.memory, ...customer.memory],
        nextFollowUpAt: next.clearSchedule ? '' : next.nextFollowUpAt || customer.nextFollowUpAt,
        stage: next.stage,
        valueLevel: next.valueLevel || customer.valueLevel,
      }
    }))
    setLeads(items => items.map(lead => lead.customerId === customerId ? { ...lead, status: next.leadStatus } : lead))
    setSelectedCustomerId(customerId)
    toast.success(next.toast)
  }

  function updateCustomerFollowUpSchedule(customerId: string, nextFollowUpAt: string, followUpNote: string) {
    const now = nowText()
    const targetCustomer = customerRecordsState.find(customer => customer.id === customerId)
    if (!targetCustomer) {
      toast.warning('没有找到对应客户资料')
      return
    }

    const normalizedNote = followUpNote.trim()
    setCustomerRecordsState(items => items.map((customer) => {
      if (customer.id !== customerId)
        return customer

      const summary = nextFollowUpAt
        ? `调整二次触达节奏：计划 ${followUpTimeLabel(nextFollowUpAt)} 跟进${normalizedNote ? `，备注：${normalizedNote}` : '。'}`
        : `清空二次触达排期${normalizedNote ? `，保留备注：${normalizedNote}` : '。'}`

      const interaction: CustomerInteraction = {
        at: now,
        channel: customer.platform,
        id: `interaction-followup-schedule-${Date.now()}`,
        summary,
        type: 'note',
      }

      return {
        ...customer,
        followUpNote: normalizedNote,
        interactions: [interaction, ...customer.interactions],
        lastTouchAt: now,
        nextFollowUpAt,
        stage: customer.stage === 'new' ? 'warming' : customer.stage,
      }
    }))
    setSelectedCustomerId(customerId)
    toast.success('已更新二次触达节奏')
  }

  function handleApproveReply(candidateId: string) {
    setReplyCandidates(items => items.map(item => item.id === candidateId ? { ...item, status: 'approved' } : item))
    toast.success('候选回复已批准，等待发布')
  }

  function handleRejectReply(candidateId: string) {
    setReplyCandidates(items => items.map(item => item.id === candidateId ? { ...item, status: 'rejected' } : item))
    toast.info('已忽略该候选回复')
  }

  function markReplyPublished(candidate: CustomerReplyCandidate, options?: { silent?: boolean }) {
    const nowText = new Date().toLocaleString('zh-CN', { hour12: false })
    setReplyCandidates(items => items.map(item => item.id === candidate.id ? { ...item, status: 'published' } : item))
    setCustomerRecordsState(items => items.map((customer) => {
      if (customer.id !== candidate.customerId)
        return customer

      const nextInteraction: CustomerInteraction = {
        id: `interaction-${candidate.id}-${Date.now()}`,
        at: nowText,
        channel: candidate.platform,
        type: 'reply',
        summary: `已对${commentSourceLabels[candidate.sourceType]}发布回复：${candidate.commentContent}`,
        aiReply: candidate.replyContent,
      }
      const nextMemory = `已围绕“${candidate.sourceTitle}”发布过一次${commentSourceLabels[candidate.sourceType]}回复，后续应避免重复推销。`

      return {
        ...customer,
        lastTouchAt: nowText,
        stage: 'contacted',
        memory: customer.memory.includes(nextMemory) ? customer.memory : [nextMemory, ...customer.memory],
        interactions: [nextInteraction, ...customer.interactions],
      }
    }))
    if (candidate.leadId)
      updateLeadStatus(candidate.leadId, 'contacted')

    setAutomationRun(current => ({
      ...current,
      status: 'awaiting_approval',
      publishedCount: current.publishedCount + 1,
      updatedAt: options?.silent ? current.updatedAt : '刚刚发布回复',
    }))
  }

  async function publishReplyCandidate(candidate: CustomerReplyCandidate, options?: { silent?: boolean }): Promise<'published' | 'skipped' | 'failed'> {
    if (!options?.silent) {
      setAutomationRun(current => ({
        ...current,
        status: 'publishing',
        updatedAt: '正在发布回复',
      }))
    }

    const result = await publishCustomerRadarReply(candidate, { liveExecutionEnabled })
    setExecutionLogs(current => [result.log, ...current])
    if (!result.success) {
      setAutomationRun(current => ({
        ...current,
        status: 'awaiting_approval',
        updatedAt: '发布失败，等待处理',
      }))
      if (!options?.silent)
        toast.error('发布失败，请查看执行日志')
      return 'failed'
    }

    if (result.skipped) {
      setAutomationRun(current => ({
        ...current,
        status: 'awaiting_approval',
        updatedAt: options?.silent ? current.updatedAt : '安全演练完成，未真实发布',
      }))
      if (!options?.silent)
        toast.info('安全演练完成，没有向平台发送评论')
      return 'skipped'
    }

    markReplyPublished(candidate, options)
    if (!options?.silent)
      toast.success('已发布评论，并写入客户记忆')
    return 'published'
  }

  async function handlePublishReply(candidateId: string) {
    const candidate = replyCandidates.find(item => item.id === candidateId)
    if (!candidate)
      return

    await publishReplyCandidate(candidate)
  }

  function canPublishCandidate(candidate: CustomerReplyCandidate) {
    if (candidate.status !== 'approved')
      return false

    return hasLivePublishTarget(candidate)
  }

  function canApproveCandidate(candidate: CustomerReplyCandidate) {
    if (candidate.status !== 'draft')
      return false

    return hasLivePublishTarget(candidate)
  }

  function hasLivePublishTarget(candidate: CustomerReplyCandidate) {
    if (!liveExecutionEnabled)
      return true

    if (!candidate.workId)
      return false

    return candidate.sourceType !== 'owned_post_comments' || Boolean(candidate.commentId)
  }

  function handlePlatformChange(platform: CustomerRadarPlatform, checked: boolean) {
    setProfile((current) => {
      const platforms = checked
        ? Array.from(new Set([...current.platforms, platform]))
        : current.platforms.filter(item => item !== platform)

      return {
        ...current,
        platforms: platforms.length ? platforms : current.platforms,
      }
    })
  }

  function handleCommentSourceChange(source: CustomerRadarCommentSource, checked: boolean) {
    setProfile((current) => {
      const commentSources = checked
        ? Array.from(new Set([...(current.commentSources || []), source]))
        : (current.commentSources || []).filter(item => item !== source)

      return {
        ...current,
        commentSources: commentSources.length ? commentSources : current.commentSources,
      }
    })
  }

  function handleOwnedPostInputChange(value: string) {
    const parsed = parseXhsNoteInput(value)
    setOwnedPostWorkId(parsed.noteId)
    if (parsed.xsecToken)
      setOwnedPostXsecToken(parsed.xsecToken)
  }

  function handleAutomationModeChange(mode: CustomerRadarAutomationRun['mode']) {
    setAutomationRun(current => ({
      ...current,
      mode,
      updatedAt: `已切换为${automationModeLabel(mode)}`,
    }))
    setProfile(current => ({
      ...current,
      requireApproval: mode === 'manual_approval',
    }))
    setExecutionLogs(current => [
      {
        id: `customer-radar-log-${Date.now()}`,
        at: new Date().toLocaleString('zh-CN', { hour12: false }),
        detail: mode === 'manual_approval'
          ? '候选回复会进入确认队列，人工批准后才发布。'
          : '候选回复生成后会直接进入发布流程，仍会记录日志和回写客户记忆。',
        level: mode === 'manual_approval' ? 'info' : 'warning',
        title: `回复模式：${automationModeLabel(mode)}`,
      },
      ...current,
    ])
  }

  async function handleLiveExecutionChange(enabled: boolean) {
    if (enabled) {
      const inspection = await probeCustomerRadarExecutor(syncProfile())
      setPlatformCapabilities(inspection.capabilities)
      setSocialAccounts(inspection.socialAccounts)
      setExecutionLogs(current => [...inspection.logs, ...current])

      const publishReady = inspection.capabilities.some(item => item.available && item.canPublishComment)
      if (!publishReady) {
        setLiveExecutionEnabled(false)
        setExecutionLogs(current => [
          {
            id: `customer-radar-log-${Date.now()}`,
            at: new Date().toLocaleString('zh-CN', { hour12: false }),
            detail: '未检测到可真实发布评论的平台账号，已保持安全演练模式。请先安装插件、授权权限，并登录目标平台后重新检测。',
            level: 'warning',
            title: '真实执行未开启',
          },
          ...current,
        ])
        toast.warning('未检测到可真实发布的平台账号，仍保持安全演练')
        return
      }
    }

    setLiveExecutionEnabled(enabled)
    setExecutionLogs(current => [
      {
        id: `customer-radar-log-${Date.now()}`,
        at: new Date().toLocaleString('zh-CN', { hour12: false }),
        detail: enabled
          ? '真实平台执行已打开：后续发布按钮和全自动任务可通过插件向平台发送评论。请只在确认账号、内容和目标页面后使用。'
          : '真实平台执行已关闭：系统只抓取、生成、入库和记录日志，不会向平台发送评论。',
        level: enabled ? 'warning' : 'info',
        title: enabled ? '真实执行已打开' : '安全演练模式',
      },
      ...current,
    ])
    toast[enabled ? 'warning' : 'info'](enabled ? '真实平台执行已打开' : '已切回安全演练模式')
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-5 text-[#102033] md:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between md:p-6">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#2563eb,#00bbd9_52%,#22c55e)] text-white shadow-[0_14px_34px_rgba(37,99,235,0.18)]">
                <Radar className="size-6" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">客户雷达</h1>
                  <Badge className="border-blue-100 bg-blue-50 text-blue-700 shadow-none" variant="outline">
                    AI 主动获客
                  </Badge>
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  配置客户画像后，系统会扫描社媒内容与评论区信号，AI 判断意向、生成触达建议，并把动作放入人工确认队列。
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="bg-[#102033] hover:bg-[#182b45]" onClick={handleScan} loading={isScanning}>
                {isScanning ? '扫描中' : '开始扫描'}
              </Button>
              <Button variant="outline" onClick={() => {
                setProfile(defaultProfile)
                setKeywordText(joinText(defaultProfile.keywords))
                setPainPointText(joinText(defaultProfile.painPoints))
                setExcludedText(joinText(defaultProfile.excludedWords))
                toast.success('已恢复默认画像')
              }}
              >
                重置画像
              </Button>
            </div>
          </div>
          <div className="grid border-t border-slate-100 bg-slate-50/70 md:grid-cols-4">
            <Metric icon={<Target className="size-4" />} label="线索总数" value={leads.length.toString()} />
            <Metric icon={<Sparkles className="size-4" />} label="高意向" value={highIntentCount.toString()} />
            <Metric icon={<Clock3 className="size-4" />} label="待确认" value={pendingCount.toString()} />
            <Metric icon={<UserCheck className="size-4" />} label="已触达" value={contactedCount.toString()} />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">客户空间</h2>
                  <Badge variant="outline" className="border-blue-100 bg-blue-50 text-blue-700 shadow-none">
                    {tenantContext?.packageName || '增长标准版'}
                  </Badge>
                  <Badge variant="outline" className={tenantContext?.status === 'paused' ? 'border-amber-200 bg-amber-50 text-amber-700 shadow-none' : 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-none'}>
                    {tenantContext?.status === 'active' ? '正式' : tenantContext?.status === 'paused' ? '暂停' : '试用'}
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {tenantContext?.customerName || '当前客户'} 的数据独立保存：知识库、线索池、客户记忆、任务日志和插件状态都按登录账号隔离。
                </p>
              </div>
            </div>
            <div className="grid gap-2 text-sm md:grid-cols-3">
              <InfoPill label="每日额度" value={`${tenantContext?.dailyLimit || profile.dailyLimit} 条`} />
              <InfoPill label="单轮额度" value={`${tenantContext?.perRunLimit || createTaskLimitPolicy(profile).perRunLimit} 条`} />
              <InfoPill label="席位" value={`${tenantContext?.maxSeats || 1} 个`} />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 ring-1 ring-cyan-100">
                <KeyRound className="size-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">AI Key 配置</h2>
                  <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-700 shadow-none">
                    {tenantAiConfig.mode === 'tenant' ? '客户自己的 Key' : '使用平台全局 Key'}
                  </Badge>
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  默认使用系统管理台里的全局模型 Key；需要独立计费或企业自带额度时，可切换为客户自己的 Key。已保存的 Key 不会明文回显。
                </p>
              </div>
            </div>
            <Button className="bg-[#102033] hover:bg-[#182b45]" onClick={handleSaveTenantAiConfig} loading={isSavingTenantAiConfig}>
              <Save className="size-4" />
              保存 AI 配置
            </Button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Field label="Key 使用模式">
              <Input
                value={tenantAiConfig.mode}
                onChange={event => updateTenantAiConfig({ mode: event.target.value as CustomerRadarTenantAiConfig['mode'] })}
                placeholder="global / tenant"
              />
            </Field>
            <Field label="默认供应商">
              <Input
                value={tenantAiConfig.provider}
                onChange={event => updateTenantAiConfig({ provider: event.target.value as CustomerRadarTenantAiConfig['provider'] })}
                placeholder="openai / anthropic / gemini"
              />
            </Field>
            <Field label="默认模型">
              <Input
                value={tenantAiConfig.defaultChatModel || ''}
                onChange={event => updateTenantAiConfig({ defaultChatModel: event.target.value })}
                placeholder="例如：gpt-5.1-all"
              />
            </Field>
            <Field label="OpenAI Base URL">
              <Input
                value={tenantAiConfig.openaiBaseUrl || ''}
                onChange={event => updateTenantAiConfig({ openaiBaseUrl: event.target.value })}
              />
            </Field>
            <Field label="OpenAI API Key">
              <Input
                type="password"
                value={tenantAiConfig.openaiApiKey || ''}
                onChange={event => updateTenantAiConfig({ openaiApiKey: event.target.value })}
                placeholder="sk-..."
              />
            </Field>
            <Field label="Claude API Key">
              <Input
                type="password"
                value={tenantAiConfig.anthropicApiKey || ''}
                onChange={event => updateTenantAiConfig({ anthropicApiKey: event.target.value })}
                placeholder="sk-ant-..."
              />
            </Field>
            <Field label="Gemini API Key">
              <Input
                type="password"
                value={tenantAiConfig.geminiApiKey || ''}
                onChange={event => updateTenantAiConfig({ geminiApiKey: event.target.value })}
              />
            </Field>
            <Field label="火山 / Grok Key">
              <Input
                type="password"
                value={tenantAiConfig.volcengineApiKey || tenantAiConfig.grokApiKey || ''}
                onChange={event => updateTenantAiConfig({ grokApiKey: event.target.value, volcengineApiKey: event.target.value })}
              />
            </Field>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 ring-1 ring-cyan-100">
                  <ListChecks className="size-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">客户启动台</h2>
                    <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-700 shadow-none">
                      {readySteps}/4 已就绪
                    </Badge>
                  </div>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    客户登录后先完成插件、平台账号、知识库和任务创建四件事，再开始跑自动获客。这里就是客户侧每天打开系统后的第一屏。
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                  {(['manual', 'hourly', 'daily'] as CustomerRadarTask['cadence'][]).map(cadence => (
                    <Button
                      key={cadence}
                      type="button"
                      size="sm"
                      variant={taskCadence === cadence ? 'default' : 'ghost'}
                      className={cn(
                        'h-9 px-3',
                        taskCadence === cadence ? 'bg-[#102033] text-white hover:bg-[#182b45]' : 'text-slate-600 hover:bg-white',
                      )}
                      onClick={() => setTaskCadence(cadence)}
                    >
                      {taskCadenceLabel(cadence)}
                    </Button>
                  ))}
                </div>
                <Button variant="outline" onClick={handlePluginDiagnostic} loading={isPluginDiagnosticRunning}>
                  <PlugZap className={cn('size-4', isPluginDiagnosticRunning && 'animate-pulse')} />
                  插件诊断
                </Button>
                <Button variant="outline" onClick={handleInspectExecutor}>
                  <PlugZap className="size-4" />
                  检测插件/账号
                </Button>
                <Button className="bg-[#102033] hover:bg-[#182b45]" onClick={handleCreateAutomationTask}>
                  <PlusCircle className="size-4" />
                  创建获客任务
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <ReadinessStep active={pluginConnected} label="浏览器插件" text={pluginConnected ? '已检测到插件能力' : '未检测到插件，先模拟执行'} />
              <ReadinessStep active={accountReady} label="平台账号" text={accountReady ? '至少一个账号可执行' : '等待平台登录检测'} />
              <ReadinessStep active={knowledgeReady} label="知识库" text={knowledgeReady ? '已可用于 AI 回复' : '请到全局知识库补充'} />
              <ReadinessStep active={automationTasks.length > 0} label="获客任务" text={automationTasks.length ? `${automationTasks.length} 个任务` : '先创建一个任务'} />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {socialAccounts.map(account => (
                <SocialAccountRow key={account.id} account={account} />
              ))}
            </div>

            {pluginDiagnostic && (
              <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">浏览器插件诊断</div>
                    <div className="mt-1 text-xs text-slate-500">{pluginDiagnostic.checkedAt}</div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'shadow-none',
                      pluginDiagnostic.hasPlugin
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-rose-200 bg-rose-50 text-rose-700',
                    )}
                  >
                    {pluginDiagnostic.hasPlugin ? '已注入' : '未注入'}
                  </Badge>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div className="rounded-md border border-white/80 bg-white/80 p-3">
                    <div className="text-xs text-slate-500">插件版本</div>
                    <div className="mt-1 text-sm font-medium text-slate-900">
                      {pluginDiagnostic.version?.name || '未知'}
                      {' '}
                      {pluginDiagnostic.version?.version || ''}
                    </div>
                  </div>
                  <div className="rounded-md border border-white/80 bg-white/80 p-3">
                    <div className="text-xs text-slate-500">权限状态</div>
                    <div className="mt-1 text-sm font-medium text-slate-900">
                      {pluginDiagnostic.permission?.granted ? '已授权' : '未授权 / 未检测'}
                    </div>
                  </div>
                  {pluginDiagnostic.platforms.map(item => (
                    <div key={item.platform} className="rounded-md border border-white/80 bg-white/80 p-3">
                      <div className="text-xs text-slate-500">{platformLabels[item.platform]}</div>
                      <div className={cn('mt-1 text-sm font-medium', item.ready ? 'text-emerald-700' : 'text-rose-700')}>
                        {item.ready ? `已登录：${item.nickname || item.uid || '当前账号'}` : item.error || '未登录'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div className="flex items-center gap-2">
                <Bot className="size-5 text-blue-600" />
                <h2 className="text-lg font-semibold">自动获客任务</h2>
              </div>
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 shadow-none">
                {automationTasks.length} 个
              </Badge>
            </div>
            <div className="max-h-96 space-y-3 overflow-auto p-5">
              {automationTasks.length ? automationTasks.map(task => (
                <TaskCard
                  key={task.id}
                  active={selectedTask?.id === task.id}
                  task={task}
                  onInspect={() => setSelectedTaskId(task.id)}
                  onRun={() => handleRunAutomationTask(task.id)}
                  onStop={() => handleStopAutomationTask(task.id)}
                />
              )) : (
                <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm leading-6 text-slate-500">
                  暂无任务。先确认客户画像，再创建获客任务。
                </div>
              )}
            </div>
            {selectedTask && (
              <TaskDetailPanel
                candidates={selectedTaskCandidates}
                canApproveCandidate={canApproveCandidate}
                canPublishCandidate={canPublishCandidate}
                generatingReplyId={generatingReplyId}
                leads={selectedTaskLeads}
                liveExecutionEnabled={liveExecutionEnabled}
                logs={selectedTaskLogs}
                onApproveCandidate={handleApproveReply}
                onGenerateReply={handleGenerateReply}
                onPublishCandidate={handlePublishReply}
                onRejectCandidate={handleRejectReply}
                onUpdateCustomerFollowUp={updateCustomerFollowUp}
                onSelectRun={setSelectedTaskRunId}
                selectedRunId={selectedTaskRun?.id || null}
                taskRuns={selectedTaskRuns}
                task={selectedTask}
              />
            )}
          </aside>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                <Search className="size-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">关键词搜索获客</h2>
                  <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 shadow-none">
                    别人笔记/评论
                  </Badge>
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  用客户画像里的关键词去搜索平台内容，采集别人笔记和评论区里的需求信号，入库成客户资料，再生成低打扰候选回复。
                </p>
              </div>
            </div>
            <Button
              className="bg-[#102033] hover:bg-[#182b45]"
              onClick={handleRunKeywordDiscovery}
              loading={isKeywordDiscovering}
            >
              <Radar className={cn('size-4', isKeywordDiscovering && 'animate-pulse')} />
              {isKeywordDiscovering ? '搜索中' : '搜索并生成线索'}
            </Button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
            <Field label="搜索关键词">
              <Input
                value={keywordDiscoveryTerm}
                onChange={event => setKeywordDiscoveryTerm(event.target.value)}
                placeholder="例如：开业引流、小红书运营、没人咨询"
              />
            </Field>
            <Field label="当前平台">
              <div className="flex h-9 items-center rounded-md border border-slate-200 px-3 text-sm text-slate-700">
                小红书优先，抖音搜索待加固
              </div>
            </Field>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <MessageSquareText className="size-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">自己笔记评论自动回复</h2>
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 shadow-none">
                    第一条真实链路
                  </Badge>
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  真实上线时填写自己发布的小红书笔记 ID，系统会尝试抓取该笔记评论，生成客户资料和候选回复。本地测试可直接点击按钮，插件未就绪时会使用样例评论验证流程。
                </p>
              </div>
            </div>
            <Button
              className="bg-[#102033] hover:bg-[#182b45]"
              onClick={handleFetchOwnedPostComments}
              loading={isFetchingOwnedComments}
            >
              <RefreshCw className={cn('size-4', isFetchingOwnedComments && 'animate-spin')} />
              {isFetchingOwnedComments ? '抓取中' : '抓取评论并生成回复'}
            </Button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Field label="小红书笔记 ID">
              <Input
                value={ownedPostWorkId}
                onChange={event => handleOwnedPostInputChange(event.target.value)}
                placeholder="可直接粘贴笔记链接 / note_id"
              />
            </Field>
            <Field label="xsec_token（可选）">
              <Input
                value={ownedPostXsecToken}
                onChange={event => setOwnedPostXsecToken(event.target.value)}
                placeholder="部分小红书评论接口需要 xsec_token"
              />
            </Field>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <Bot className="size-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">自动获客任务中枢</h2>
                    <Badge variant="outline" className={cn('shadow-none', automationStatusClassName[automationRun.status])}>
                      {automationStatusLabel(automationRun.status)}
                    </Badge>
                  </div>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    这条任务会区分“搜索别人笔记/评论获客”和“自己笔记评论回复”，收集客户资料后结合全局知识库和客户记忆生成回复。
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button className="bg-[#102033] hover:bg-[#182b45]" onClick={handleStartAutomationRun} loading={isScanning}>
                  <PlayCircle className="size-4" />
                  {isScanning ? '运行中' : '运行任务'}
                </Button>
                <Button variant="outline" onClick={handleInspectExecutor}>
                  <Settings2 className="size-4" />
                  检测执行器
                </Button>
                <Button variant="outline" onClick={handlePauseAutomationRun} disabled={automationRun.status === 'paused'}>
                  <PauseCircle className="size-4" />
                  暂停
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-5">
              <InfoPill label="扫描评论" value={`${automationRun.scannedCount} 条`} />
              <InfoPill label="客户入库" value={`${automationRun.collectedCount} 个`} />
              <InfoPill label="候选回复" value={`${automationRun.replyDraftCount} 条`} />
              <InfoPill label="已发布" value={`${automationRun.publishedCount} 条`} />
              <InfoPill label="平均意向" value={`${averageScore} 分`} />
            </div>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-blue-600" />
              <h2 className="text-lg font-semibold">执行规则</h2>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <div className="mb-2 text-sm font-medium text-slate-700">回复模式</div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={automationRun.mode === 'manual_approval' ? 'default' : 'outline'}
                    className={automationRun.mode === 'manual_approval' ? 'bg-[#102033] hover:bg-[#182b45]' : ''}
                    onClick={() => handleAutomationModeChange('manual_approval')}
                  >
                    人工确认
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={automationRun.mode === 'full_auto' ? 'default' : 'outline'}
                    className={automationRun.mode === 'full_auto' ? 'bg-[#102033] hover:bg-[#182b45]' : ''}
                    onClick={() => handleAutomationModeChange('full_auto')}
                  >
                    全自动发布
                  </Button>
                </div>
              </div>
              <label
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition',
                  liveExecutionEnabled ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50',
                )}
              >
                <Checkbox
                  className="mt-0.5"
                  checked={liveExecutionEnabled}
                  onCheckedChange={checked => void handleLiveExecutionChange(Boolean(checked))}
                />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-800">
                    真实平台执行
                    <Badge variant="outline" className={cn('shadow-none', liveExecutionEnabled ? 'border-amber-200 bg-white text-amber-700' : 'border-emerald-200 bg-white text-emerald-700')}>
                      {liveExecutionEnabled ? '已打开' : '安全演练'}
                    </Badge>
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">
                    {liveExecutionEnabled ? '发布按钮和全自动任务会真实发送评论。' : '只抓取、生成、入库和记录日志，不向平台发送评论。'}
                  </span>
                </span>
              </label>
              <RuleRow label="风控等级" value={automationRun.riskLevel === 'low' ? '低风险' : automationRun.riskLevel === 'medium' ? '中风险' : '高风险'} />
              <RuleRow label="默认限频" value={`单轮 ${createTaskLimitPolicy(profile).perRunLimit} 条 / 间隔 ${createTaskLimitPolicy(profile).cooldownSeconds} 秒`} />
              <RuleRow label="失败保护" value={`${createTaskLimitPolicy(profile).maxFailures} 次失败自动暂停`} />
              <RuleRow label="知识来源" value="全局知识库 + 客户记忆" />
              <RuleRow label="最近状态" value={automationRun.updatedAt} />
            </div>
          </aside>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center gap-2">
                <Settings2 className="size-5 text-blue-600" />
                <h2 className="text-lg font-semibold">平台执行器能力</h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">检测当前浏览器插件与平台适配能力，决定哪些动作能真执行，哪些只能进入模拟或待开发。</p>
            </div>
            <div className="grid gap-3 p-5 md:grid-cols-2">
              {platformCapabilities.map(capability => (
                <div key={capability.platform} className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium text-slate-900">{platformLabels[capability.platform]}</div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'shadow-none',
                        capability.available
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700',
                      )}
                    >
                      {capability.available ? '可连接' : '待接入'}
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <CapabilityPill active={capability.canScanComments} label="抓评论" />
                    <CapabilityPill active={capability.canPublishComment} label="发评论" />
                    <CapabilityPill active={capability.canSendDirectMessage} label="发私信" />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{capability.note}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center gap-2">
                <History className="size-5 text-blue-600" />
                <h2 className="text-lg font-semibold">任务详情与日志</h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">记录扫描、生成、暂停、发布和执行器异常，后续会对接真实任务表。</p>
            </div>
            <div className="max-h-72 space-y-3 overflow-auto p-5">
              {executionLogs.length ? executionLogs.map(log => (
                <div key={log.id} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-medium text-slate-900">{log.title}</div>
                    <Badge variant="outline" className={cn('shrink-0 shadow-none', logLevelClassName[log.level])}>
                      {logLevelLabel(log.level)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{log.at}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{log.detail}</p>
                </div>
              )) : (
                <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                  运行任务或检测执行器后会生成日志。
                </div>
              )}
            </div>
          </aside>
        </section>

        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <SlidersHorizontal className="size-5 text-blue-600" />
              <h2 className="text-lg font-semibold">客户画像</h2>
            </div>

            <div className="space-y-4">
              <Field label="行业/业务">
                <Input
                  value={profile.industry}
                  onChange={event => setProfile(current => ({ ...current, industry: event.target.value }))}
                />
              </Field>
              <Field label="地区范围">
                <Input
                  value={profile.region}
                  onChange={event => setProfile(current => ({ ...current, region: event.target.value }))}
                />
              </Field>
              <Field label="关键词">
                <Textarea
                  value={keywordText}
                  onChange={event => setKeywordText(event.target.value)}
                  rows={3}
                  placeholder="用逗号或换行分隔"
                />
              </Field>
              <Field label="痛点词">
                <Textarea
                  value={painPointText}
                  onChange={event => setPainPointText(event.target.value)}
                  rows={3}
                  placeholder="没人咨询、没流量、不知道怎么拍..."
                />
              </Field>
              <Field label="排除词">
                <Input
                  value={excludedText}
                  onChange={event => setExcludedText(event.target.value)}
                  placeholder="招聘，加盟广告，兼职"
                />
              </Field>
              <Field label="扫描平台">
                <div className="grid grid-cols-2 gap-2">
                  {platformOptions.map(platform => (
                    <label
                      key={platform}
                      className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm"
                    >
                      <Checkbox
                        checked={profile.platforms.includes(platform)}
                        onCheckedChange={checked => handlePlatformChange(platform, Boolean(checked))}
                      />
                      {platformLabels[platform]}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="评论来源">
                <div className="grid gap-2">
                  {commentSourceOptions.map(source => (
                    <label
                      key={source}
                      className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm"
                    >
                      <Checkbox
                        checked={(profile.commentSources || defaultProfile.commentSources).includes(source)}
                        onCheckedChange={checked => handleCommentSourceChange(source, Boolean(checked))}
                      />
                      {commentSourceLabels[source]}
                    </label>
                  ))}
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="每日上限">
                  <Input
                    min={10}
                    max={500}
                    type="number"
                    value={profile.dailyLimit}
                    onChange={event => setProfile(current => ({ ...current, dailyLimit: Number(event.target.value) || 10 }))}
                  />
                </Field>
                <Field label="人工确认">
                  <label className="flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm">
                    <Checkbox
                      checked={profile.requireApproval}
                      onCheckedChange={(checked) => {
                        const requireApproval = Boolean(checked)
                        setProfile(current => ({ ...current, requireApproval }))
                        setAutomationRun(current => ({
                          ...current,
                          mode: requireApproval ? 'manual_approval' : 'full_auto',
                          updatedAt: `已切换为${requireApproval ? '人工确认后发布' : '全自动发布'}`,
                        }))
                      }}
                    />
                    {profile.requireApproval ? '开启' : '关闭'}
                  </label>
                </Field>
              </div>
            </div>
          </section>

          <section className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-lg font-semibold">线索池</h2>
                  <p className="mt-1 text-sm text-slate-500">按意向分和状态优先处理。</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleScan} disabled={isScanning}>
                  <RefreshCw className={cn('size-4', isScanning && 'animate-spin')} />
                  刷新
                </Button>
              </div>
              <div className="divide-y divide-slate-100">
                {leads.map(lead => (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => {
                      setSelectedLeadId(lead.id)
                      setSelectedCustomerId(lead.customerId)
                    }}
                    className={cn(
                      'flex w-full gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50',
                      selectedLead?.id === lead.id && 'bg-blue-50/60',
                    )}
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-700">
                      {lead.avatarText}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{lead.author}</span>
                        <Badge variant="outline" className="border-slate-200 bg-white text-slate-600 shadow-none">
                          {platformLabels[lead.platform]}
                        </Badge>
                        <Badge variant="outline" className={cn('shadow-none', intentClassName[lead.intent])}>
                          {intentLabel(lead.intent)}
                        </Badge>
                        <Badge variant="outline" className={cn('shadow-none', statusClassName[lead.status])}>
                          {statusLabel(lead.status)}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-sm font-medium text-slate-700">{lead.sourceTitle}</p>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{lead.demandSummary}</p>
                      <div className="mt-3 flex items-center gap-3">
                        <span className="w-14 text-xs font-medium text-slate-500">评分 {lead.score}</span>
                        <Progress value={lead.score} className="h-1.5 max-w-48 bg-slate-100 [&>div]:bg-[linear-gradient(90deg,#2563eb,#00bbd9,#22c55e)]" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <aside className="rounded-lg border border-slate-200 bg-white shadow-sm">
              {selectedLead ? (
                <div className="flex h-full flex-col">
                  <div className="border-b border-slate-100 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold">线索详情</h2>
                        <p className="mt-1 text-sm text-slate-500">{selectedLead.author}</p>
                      </div>
                      <Badge className={cn('shadow-none', intentClassName[selectedLead.intent])} variant="outline">
                        {selectedLead.score}
                      </Badge>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedLead.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 shadow-none">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 space-y-5 p-5">
                    <DetailBlock icon={<Eye className="size-4" />} title="客户信号">
                      {selectedLead.signalText}
                    </DetailBlock>
                    <DetailBlock icon={<Sparkles className="size-4" />} title="AI 判断">
                      {selectedLead.demandSummary}
                    </DetailBlock>
                    <DetailBlock icon={<MessageSquareText className="size-4" />} title="建议话术">
                      {selectedLead.suggestedReply}
                    </DetailBlock>
                    <DetailBlock icon={<ShieldCheck className="size-4" />} title="下一步">
                      {selectedLead.nextAction}
                    </DetailBlock>
                  </div>

                  <div className="grid gap-2 border-t border-slate-100 p-5">
                    <Button
                      className="bg-[#102033] hover:bg-[#182b45]"
                      onClick={() => handleApprove(selectedLead.id)}
                      disabled={selectedLead.status === 'approved' || selectedLead.status === 'contacted'}
                    >
                      <CheckCircle2 className="size-4" />
                      批准触达
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleContacted(selectedLead.id)}
                      disabled={selectedLead.status === 'contacted' || selectedLead.status === 'rejected'}
                    >
                      <UserCheck className="size-4" />
                      标记已触达
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-slate-500 hover:text-slate-900"
                      onClick={() => handleReject(selectedLead.id)}
                      disabled={selectedLead.status === 'rejected'}
                    >
                      <XCircle className="size-4" />
                      忽略线索
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex h-80 flex-col items-center justify-center p-8 text-center text-slate-500">
                  <Radar className="mb-3 size-8" />
                  暂无线索
                </div>
              )}
            </aside>
          </section>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="size-5 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold">评论回复确认队列</h2>
                <p className="mt-1 text-sm text-slate-500">
                  AI 已结合客户记忆和全局知识库生成候选回复，批准后才会执行发布。
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 shadow-none">
                待确认 {replyPendingCount}
              </Badge>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 shadow-none">
                已发布 {replyPublishedCount}
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 p-5 lg:grid-cols-2">
            {replyCandidates.map(candidate => (
              <div key={candidate.id} className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-900">{candidate.author}</span>
                    <Badge variant="outline" className="border-slate-200 bg-white text-slate-600 shadow-none">
                      {platformLabels[candidate.platform]}
                    </Badge>
                    <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-700 shadow-none">
                      {commentSourceLabels[candidate.sourceType]}
                    </Badge>
                    <Badge variant="outline" className={cn('shadow-none', replyStatusClassName[candidate.status])}>
                      {replyStatusLabel(candidate.status)}
                    </Badge>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'border-blue-100 bg-blue-50 text-blue-700 shadow-none',
                      automationRun.mode === 'full_auto' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
                    )}
                  >
                    {automationModeLabel(automationRun.mode)}
                  </Badge>
                </div>
                <p className="mt-3 text-sm font-medium text-slate-700">{candidate.sourceTitle}</p>
                <div className="mt-3 rounded-md bg-white p-3 text-sm leading-6 text-slate-600 ring-1 ring-slate-100">
                  <span className="font-medium text-slate-900">客户评论：</span>
                  {candidate.commentContent}
                </div>
                <div className="mt-3 rounded-md bg-white p-3 text-sm leading-6 text-slate-600 ring-1 ring-slate-100">
                  <span className="font-medium text-slate-900">候选回复：</span>
                  {candidate.replyContent}
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-md bg-white p-3 text-sm leading-6 text-slate-600 ring-1 ring-slate-100">
                    <span className="font-medium text-slate-900">客户记忆：</span>
                    {candidate.customerMemory}
                  </div>
                  <div className="rounded-md bg-white p-3 text-sm leading-6 text-slate-600 ring-1 ring-slate-100">
                    <span className="font-medium text-slate-900">引用知识：</span>
                    {candidate.knowledgeRefs.join('、')}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-500">{candidate.riskNote}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateReply(candidate.id)}
                    disabled={generatingReplyId === candidate.id || candidate.status === 'published'}
                  >
                    {generatingReplyId === candidate.id ? <RefreshCw className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    {candidate.replyContent ? '重新生成' : 'AI 生成'}
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[#102033] hover:bg-[#182b45]"
                    onClick={() => handleApproveReply(candidate.id)}
                    disabled={!canApproveCandidate(candidate)}
                    title={liveExecutionEnabled && !canApproveCandidate(candidate) ? '真实执行需要候选回复带有真实作品 ID；自己笔记评论还需要评论 ID' : undefined}
                  >
                    <CheckCircle2 className="size-4" />
                    批准
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePublishReply(candidate.id)}
                    disabled={!canPublishCandidate(candidate)}
                    title={liveExecutionEnabled && !canPublishCandidate(candidate) ? '真实执行需要候选回复带有真实作品 ID；自己笔记评论还需要评论 ID' : undefined}
                  >
                    <Send className="size-4" />
                    发布回复
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-500 hover:text-slate-900"
                    onClick={() => handleRejectReply(candidate.id)}
                    disabled={candidate.status === 'published' || candidate.status === 'rejected'}
                  >
                    <XCircle className="size-4" />
                    忽略
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <Database className="size-5 text-blue-600" />
                <div>
                  <h2 className="text-lg font-semibold">客户资料库</h2>
                  <p className="mt-1 text-sm text-slate-500">线索进入这里后，会沉淀客户资料、记忆、互动记录和 AI 回复历史。</p>
                </div>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-9"
                  value={customerQuery}
                  onChange={event => setCustomerQuery(event.target.value)}
                  placeholder="搜索客户、城市、标签、记忆"
                />
              </div>
            </div>
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex flex-wrap gap-2">
                {customerStageFilterOptions.map(option => (
                  <Button
                    key={option.value}
                    type="button"
                    size="sm"
                    variant={customerStageFilter === option.value ? 'default' : 'outline'}
                    className={cn(
                      customerStageFilter === option.value && 'bg-[#102033] hover:bg-[#182b45]',
                    )}
                    onClick={() => setCustomerStageFilter(option.value)}
                  >
                    {option.label}
                    <span className={cn(
                      'ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500',
                      customerStageFilter === option.value && 'bg-white/15 text-white',
                    )}
                    >
                      {customerStageCounts[option.value]}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
            {followUpCustomers.length > 0 && (
              <FollowUpQueue
                customers={followUpCustomers.slice(0, 6)}
                dueCount={dueFollowUpCount}
                onSelectCustomer={setSelectedCustomerId}
                onUpdateSchedule={updateCustomerFollowUpSchedule}
                onUpdateCustomerFollowUp={updateCustomerFollowUp}
                selectedCustomerId={selectedCustomer?.id || null}
                total={followUpCustomers.length}
              />
            )}

            <div className="grid lg:grid-cols-[320px_minmax(0,1fr)]">
              <div className="max-h-[620px] overflow-auto border-b border-slate-100 lg:border-b-0 lg:border-r">
                {filteredCustomers.map(customer => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => setSelectedCustomerId(customer.id)}
                    className={cn(
                      'flex w-full gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50',
                      selectedCustomer?.id === customer.id && 'bg-blue-50/60',
                    )}
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-700">
                      {customer.name.slice(-1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{customer.name}</span>
                        <Badge variant="outline" className={cn('shadow-none', valueClassName[customer.valueLevel])}>
                          {valueLabel(customer.valueLevel)}
                        </Badge>
                        <Badge variant="outline" className={cn('shadow-none', stageClassName[customer.stage])}>
                          {stageLabel(customer.stage)}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-500">{customer.company} / {customer.city}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {customer.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="outline" className="border-slate-200 bg-white text-slate-500 shadow-none">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {selectedCustomer ? (
                <div className="grid gap-5 p-5 lg:grid-cols-2">
                  <div className="space-y-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-semibold">{selectedCustomer.name}</h3>
                        <Badge variant="outline" className={cn('shadow-none', stageClassName[selectedCustomer.stage])}>
                          {stageLabel(selectedCustomer.stage)}
                        </Badge>
                        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 shadow-none">
                          {platformLabels[selectedCustomer.platform]}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {selectedCustomer.company}，{selectedCustomer.role}，{selectedCustomer.city}。来源：{selectedCustomer.source}。
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <BrainCircuit className="size-4 text-blue-600" />
                        独立客户记忆
                      </div>
                      <ul className="space-y-2">
                        {selectedCustomer.memory.map(memory => (
                          <li key={memory} className="text-sm leading-6 text-slate-600">
                            {memory}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <InfoPill label="负责人" value={selectedCustomer.owner} />
                      <InfoPill label="最近互动" value={selectedCustomer.lastTouchAt} />
                    </div>
                    <CustomerFollowUpActions
                      customer={selectedCustomer}
                      onUpdateSchedule={updateCustomerFollowUpSchedule}
                      onUpdate={updateCustomerFollowUp}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <History className="size-4 text-blue-600" />
                      互动与回复记录
                    </div>
                    <InteractionTimeline interactions={selectedCustomer.interactions} />
                  </div>
                </div>
              ) : (
                <div className="flex min-h-80 items-center justify-center p-8 text-center text-slate-500">
                  没有找到匹配客户
                </div>
              )}
            </div>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center gap-2">
                <BookOpenText className="size-5 text-blue-600" />
                <h2 className="text-lg font-semibold">全局知识库引用</h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                这里展示本次客户回复会引用的全局知识。真正维护入口应放在“全局知识库”，客户雷达只负责调用。
              </p>
            </div>
            <div className="space-y-3 p-5">
              {relevantKnowledge.map(item => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 shrink-0 text-blue-600" />
                        <h3 className="font-medium text-slate-900">{item.title}</h3>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 border-blue-100 bg-blue-50 text-blue-700 shadow-none">
                      {knowledgeCategoryLabel(item.category)}
                    </Badge>
                  </div>
                  <div className="mt-3 rounded-md bg-white p-3 text-sm leading-6 text-slate-600 ring-1 ring-slate-100">
                    回复使用：{item.replyUse}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <WorkflowCard title="1. 扫描信号" text="根据关键词、痛点词和平台范围发现内容与评论里的潜在需求。" />
          <WorkflowCard title="2. AI 打分" text="自动提取需求摘要、判断意向等级，并生成低打扰触达建议。" />
          <WorkflowCard title="3. 人工确认" text="关键评论和私信先进入确认队列，避免自动乱发和平台风控。" />
        </section>
      </div>
    </main>
  )
}

function Metric({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3 border-t border-slate-100 px-5 py-4 md:border-l md:border-t-0 first:md:border-l-0">
      <div className="flex size-9 items-center justify-center rounded-md bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
        {icon}
      </div>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-xl font-semibold text-slate-900">{value}</div>
      </div>
    </div>
  )
}

function Field({ children, label }: { children: React.ReactNode, label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  )
}

function DetailBlock({
  children,
  icon,
  title,
}: {
  children: React.ReactNode
  icon: React.ReactNode
  title: string
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span className="text-blue-600">{icon}</span>
        {title}
      </div>
      <p className="text-sm leading-6 text-slate-600">{children}</p>
    </div>
  )
}

function InfoPill({ label, value }: { label: string, value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 truncate font-medium text-slate-900">{value}</div>
    </div>
  )
}

function RuleRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm ring-1 ring-slate-100">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  )
}

function CapabilityPill({ active, label }: { active: boolean, label: string }) {
  return (
    <div
      className={cn(
        'rounded-md px-2 py-1 text-center font-medium ring-1',
        active
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
          : 'bg-white text-slate-400 ring-slate-100',
      )}
    >
      {label}
    </div>
  )
}

function ReadinessStep({ active, label, text }: { active: boolean, label: string, text: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium text-slate-900">{label}</div>
        <span
          className={cn(
            'flex size-7 items-center justify-center rounded-md ring-1',
            active ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-white text-slate-400 ring-slate-200',
          )}
        >
          {active ? <CheckCircle2 className="size-4" /> : <Clock3 className="size-4" />}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  )
}

function SocialAccountRow({ account }: { account: CustomerRadarSocialAccount }) {
  function openPlatformLogin() {
    window.open(platformLoginUrls[account.platform], '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 ring-1 ring-slate-50">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-medium text-slate-900">{platformLabels[account.platform]}</div>
          <p className="mt-1 text-sm text-slate-500">{account.nickname}</p>
        </div>
        <Badge variant="outline" className={cn('shadow-none', socialLoginStatusClassName[account.loginStatus])}>
          {socialLoginStatusLabel(account.loginStatus)}
        </Badge>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{account.note}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-400">最近检测：{account.lastCheckedAt}</div>
        <Button type="button" size="sm" variant="outline" onClick={openPlatformLogin}>
          打开平台
        </Button>
      </div>
    </div>
  )
}

function TaskCard({
  active,
  onInspect,
  onRun,
  onStop,
  task,
}: {
  active?: boolean
  onInspect: () => void
  onRun: () => void
  onStop: () => void
  task: CustomerRadarTask
}) {
  return (
    <div className={cn('rounded-lg border bg-slate-50/60 p-4', active ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-medium text-slate-900">{task.name}</div>
          <p className="mt-1 text-xs text-slate-500">{task.updatedAt}</p>
        </div>
        <Badge variant="outline" className={cn('shrink-0 shadow-none', taskStatusClassName[task.status])}>
          {taskStatusLabel(task.status)}
        </Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {task.platforms.map(platform => (
          <Badge key={platform} variant="outline" className="border-slate-200 bg-white text-slate-600 shadow-none">
            {platformLabels[platform]}
          </Badge>
        ))}
        <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-700 shadow-none">
          {automationModeLabel(task.mode)}
        </Badge>
        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 shadow-none">
          {taskCadenceLabel(task.cadence)}
        </Badge>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{task.lastLog}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
        <div className="rounded-md bg-white px-2 py-1.5 ring-1 ring-slate-100">
          今日额度 {task.dailyUsed}/{task.dailyLimit}
        </div>
        <div className="rounded-md bg-white px-2 py-1.5 ring-1 ring-slate-100">
          单轮 {task.perRunLimit} / 间隔 {task.cooldownSeconds}s
        </div>
        <div className="rounded-md bg-white px-2 py-1.5 ring-1 ring-slate-100">
          失败 {task.failureCount}/{task.maxFailures}
        </div>
        <div className="rounded-md bg-white px-2 py-1.5 ring-1 ring-slate-100">
          下次 {task.nextRunAt}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
        <TaskStat label="扫" value={task.stats.scanned} />
        <TaskStat label="客" value={task.stats.collected} />
        <TaskStat label="稿" value={task.stats.replies} />
        <TaskStat label="发" value={task.stats.published} />
      </div>
      <div className="mt-4 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 bg-white"
          onClick={onInspect}
        >
          <Eye className="size-4" />
          详情
        </Button>
        <Button
          size="sm"
          className="flex-1 bg-[#102033] hover:bg-[#182b45]"
          onClick={onRun}
          disabled={task.status === 'running'}
        >
          <PlayCircle className="size-4" />
          运行
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={onStop}
          disabled={task.status === 'paused'}
        >
          <StopCircle className="size-4" />
          停止
        </Button>
      </div>
    </div>
  )
}

function TaskStat({ label, value }: { label: string, value: number }) {
  return (
    <div className="rounded-md bg-white px-2 py-1.5 ring-1 ring-slate-100">
      <div className="text-slate-400">{label}</div>
      <div className="font-semibold text-slate-900">{value}</div>
    </div>
  )
}

function TaskDetailPanel({
  candidates,
  canApproveCandidate,
  canPublishCandidate,
  generatingReplyId,
  leads,
  liveExecutionEnabled,
  logs,
  onApproveCandidate,
  onGenerateReply,
  onPublishCandidate,
  onRejectCandidate,
  onUpdateCustomerFollowUp,
  onSelectRun,
  selectedRunId,
  task,
  taskRuns,
}: {
  candidates: CustomerReplyCandidate[]
  canApproveCandidate: (candidate: CustomerReplyCandidate) => boolean
  canPublishCandidate: (candidate: CustomerReplyCandidate) => boolean
  generatingReplyId: string | null
  leads: CustomerLead[]
  liveExecutionEnabled: boolean
  logs: CustomerRadarExecutionLog[]
  onApproveCandidate: (candidateId: string) => void
  onGenerateReply: (candidateId: string) => void
  onPublishCandidate: (candidateId: string) => void
  onRejectCandidate: (candidateId: string) => void
  onUpdateCustomerFollowUp: (customerId: string, action: CustomerFollowUpAction) => void
  onSelectRun: (runId: string | null) => void
  selectedRunId: string | null
  task: CustomerRadarTask
  taskRuns: CustomerRadarTaskRun[]
}) {
  const selectedRun = taskRuns.find(run => run.id === selectedRunId) || taskRuns[0]
  const conversionText = selectedRun
    ? `本轮 ${selectedRun.scanned || 0} 条信号沉淀 ${selectedRun.collected || 0} 个客户，生成 ${selectedRun.candidates || 0} 条候选回复，跳过 ${selectedRun.skipped || 0} 条，二次触达记忆 ${selectedRun.revisited || 0} 条，发布 ${selectedRun.published || 0} 条。`
    : '暂无可复盘的运行批次。'

  function handleExportSelectedRun() {
    if (!selectedRun) {
      toast.warning('暂无可导出的运行批次')
      return
    }

    exportTaskRunCsv(task, selectedRun, leads, candidates)
    toast.success('已导出批次复盘 CSV')
  }

  return (
    <div className="border-t border-slate-100 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900">任务详情</h3>
          </div>
          <p className="mt-1 text-sm text-slate-500">{task.name}</p>
        </div>
        <Badge variant="outline" className={cn('shrink-0 shadow-none', taskStatusClassName[task.status])}>
          {taskStatusLabel(task.status)}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600">
        <TaskMeta label="类型" value={task.type === 'hybrid' ? '混合获客' : task.type === 'keyword_discovery' ? '关键词搜索' : '自己笔记'} />
        <TaskMeta label="频率" value={taskCadenceLabel(task.cadence)} />
        <TaskMeta label="下次运行" value={task.nextRunAt} />
        <TaskMeta label="回复模式" value={automationModeLabel(task.mode)} />
        <TaskMeta label="关键词" value={task.keywords.slice(0, 3).join('、') || '未配置'} wide />
        <TaskMeta label="来源" value={task.commentSources.map(source => commentSourceLabels[source]).join('、')} wide />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
        <TaskStat label="扫" value={task.stats.scanned} />
        <TaskStat label="客" value={task.stats.collected} />
        <TaskStat label="稿" value={task.stats.replies} />
        <TaskStat label="发" value={task.stats.published} />
      </div>

      <TaskRunList onSelectRun={onSelectRun} runs={taskRuns} selectedRunId={selectedRunId} />

      {selectedRun && (
        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/70 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">批次复盘</div>
              <p className="mt-1 text-xs leading-5 text-slate-600">{conversionText}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{selectedRun.summary}</p>
            </div>
            <Button type="button" size="sm" variant="outline" className="shrink-0 bg-white" onClick={handleExportSelectedRun}>
              <Download className="size-4" />
              导出
            </Button>
          </div>
        </div>
      )}

      <TaskDetailList title={selectedRunId ? '本批次线索' : '最近线索'} emptyText="暂无与该任务匹配的线索">
        {leads.map(lead => (
          <div key={lead.id} className="rounded-md bg-white p-3 ring-1 ring-slate-100">
            <div className="flex items-center justify-between gap-2">
              <div className="truncate text-sm font-medium text-slate-900">{lead.author}</div>
              <Badge variant="outline" className={cn('shrink-0 shadow-none', intentClassName[lead.intent])}>
                {intentLabel(lead.intent)}
              </Badge>
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{lead.sourceTitle}</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Button
                type="button"
                size="sm"
                className="h-8 bg-[#102033] px-2 text-xs hover:bg-[#182b45]"
                onClick={() => onUpdateCustomerFollowUp(lead.customerId, 'followed')}
                disabled={lead.status === 'contacted'}
              >
                已跟进
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 bg-white px-2 text-xs"
                onClick={() => onUpdateCustomerFollowUp(lead.customerId, 'revisit')}
                disabled={lead.status === 'approved'}
              >
                二次触达
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-xs text-slate-500 hover:text-slate-900"
                onClick={() => onUpdateCustomerFollowUp(lead.customerId, 'invalid')}
                disabled={lead.status === 'rejected'}
              >
                无效
              </Button>
            </div>
          </div>
        ))}
      </TaskDetailList>

      <TaskDetailList title={selectedRunId ? '本批次候选回复' : '候选回复'} emptyText="暂无与该任务匹配的候选回复">
        {candidates.map(candidate => (
          <div key={candidate.id} className="rounded-md bg-white p-3 ring-1 ring-slate-100">
            <div className="flex items-center justify-between gap-2">
              <div className="truncate text-sm font-medium text-slate-900">{candidate.author}</div>
              <Badge variant="outline" className={cn('shrink-0 shadow-none', replyStatusClassName[candidate.status])}>
                {replyStatusLabel(candidate.status)}
              </Badge>
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{candidate.commentContent}</p>
            <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">{candidate.replyContent}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 bg-white px-2 text-xs"
                onClick={() => onGenerateReply(candidate.id)}
                disabled={generatingReplyId === candidate.id || candidate.status === 'published'}
              >
                {generatingReplyId === candidate.id ? <RefreshCw className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                {candidate.replyContent ? '重写' : '生成'}
              </Button>
              <Button
                size="sm"
                className="h-8 bg-[#102033] px-2 text-xs hover:bg-[#182b45]"
                onClick={() => onApproveCandidate(candidate.id)}
                disabled={!canApproveCandidate(candidate)}
                title={liveExecutionEnabled && !canApproveCandidate(candidate) ? '真实执行需要候选回复带有真实作品 ID；自己笔记评论还需要评论 ID' : undefined}
              >
                <CheckCircle2 className="size-3.5" />
                批准
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 bg-white px-2 text-xs"
                onClick={() => onPublishCandidate(candidate.id)}
                disabled={!canPublishCandidate(candidate)}
                title={liveExecutionEnabled && !canPublishCandidate(candidate) ? '真实执行需要候选回复带有真实作品 ID；自己笔记评论还需要评论 ID' : undefined}
              >
                <Send className="size-3.5" />
                发布
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-xs text-slate-500 hover:text-slate-900"
                onClick={() => onRejectCandidate(candidate.id)}
                disabled={candidate.status === 'published' || candidate.status === 'rejected'}
              >
                <XCircle className="size-3.5" />
                忽略
              </Button>
            </div>
          </div>
        ))}
      </TaskDetailList>

      <TaskDetailList title="运行记录" emptyText="暂无运行记录">
        {logs.map(log => (
          <div key={log.id} className="rounded-md bg-white p-3 ring-1 ring-slate-100">
            <div className="flex items-center justify-between gap-2">
              <div className="truncate text-sm font-medium text-slate-900">{log.title}</div>
              <Badge variant="outline" className={cn('shrink-0 shadow-none', logLevelClassName[log.level])}>
                {logLevelLabel(log.level)}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-400">{log.at}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{log.detail}</p>
          </div>
        ))}
      </TaskDetailList>
    </div>
  )
}

function TaskMeta({ label, value, wide }: { label: string, value: string, wide?: boolean }) {
  return (
    <div className={cn('rounded-md bg-slate-50 px-2 py-1.5 ring-1 ring-slate-100', wide && 'col-span-2')}>
      <div className="text-slate-400">{label}</div>
      <div className="mt-0.5 truncate font-medium text-slate-800">{value}</div>
    </div>
  )
}

function TaskRunList({
  onSelectRun,
  runs,
  selectedRunId,
}: {
  onSelectRun: (runId: string | null) => void
  runs: CustomerRadarTaskRun[]
  selectedRunId: string | null
}) {
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-900">运行批次</div>
        {selectedRunId && (
          <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs text-slate-500" onClick={() => onSelectRun(null)}>
            查看全部
          </Button>
        )}
      </div>
      <div className="max-h-44 space-y-2 overflow-auto rounded-lg bg-slate-50/70 p-2 ring-1 ring-slate-100">
        {runs.length ? runs.map(run => (
          <button
            key={run.id}
            type="button"
            onClick={() => onSelectRun(run.id)}
            className={cn(
              'w-full rounded-md bg-white p-3 text-left ring-1 transition hover:bg-blue-50/60',
              selectedRunId === run.id ? 'ring-blue-200' : 'ring-slate-100',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="truncate text-sm font-medium text-slate-900">{run.completedAt}</div>
              <Badge variant="outline" className={cn('shrink-0 shadow-none', run.status === 'completed' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700')}>
                {run.trigger === 'scheduled' ? '自动' : '手动'}
              </Badge>
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{run.summary}</p>
            <div className="mt-2 grid grid-cols-3 gap-1 text-center text-[11px] text-slate-500">
              <span className="rounded bg-slate-50 py-1">扫 {run.scanned}</span>
              <span className="rounded bg-slate-50 py-1">客 {run.collected}</span>
              <span className="rounded bg-slate-50 py-1">稿 {run.candidates}</span>
              <span className="rounded bg-slate-50 py-1">发 {run.published}</span>
              <span className="rounded bg-slate-50 py-1">跳 {run.skipped || 0}</span>
              <span className="rounded bg-slate-50 py-1">记 {run.revisited || 0}</span>
            </div>
          </button>
        )) : (
          <div className="rounded-md border border-dashed border-slate-200 bg-white p-4 text-center text-xs text-slate-500">
            暂无运行批次
          </div>
        )}
      </div>
    </div>
  )
}

function TaskDetailList({ children, emptyText, title }: { children: React.ReactNode, emptyText: string, title: string }) {
  const hasItems = Array.isArray(children) ? children.length > 0 : Boolean(children)

  return (
    <div className="mt-4">
      <div className="mb-2 text-sm font-semibold text-slate-900">{title}</div>
      <div className="max-h-52 space-y-2 overflow-auto rounded-lg bg-slate-50/70 p-2 ring-1 ring-slate-100">
        {hasItems ? children : (
          <div className="rounded-md border border-dashed border-slate-200 bg-white p-4 text-center text-xs text-slate-500">
            {emptyText}
          </div>
        )}
      </div>
    </div>
  )
}

function FollowUpQueue({
  customers,
  dueCount,
  onSelectCustomer,
  onUpdateSchedule,
  onUpdateCustomerFollowUp,
  selectedCustomerId,
  total,
}: {
  customers: CustomerRecord[]
  dueCount: number
  onSelectCustomer: (customerId: string) => void
  onUpdateSchedule: (customerId: string, nextFollowUpAt: string, followUpNote: string) => void
  onUpdateCustomerFollowUp: (customerId: string, action: CustomerFollowUpAction) => void
  selectedCustomerId: string | null
  total: number
}) {
  return (
    <div className="border-b border-slate-100 bg-amber-50/30 px-5 py-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Clock3 className="size-4 text-amber-600" />
          二次触达队列
          <Badge variant="outline" className="border-amber-200 bg-white text-amber-700 shadow-none">
            {total}
          </Badge>
          {dueCount > 0 && (
            <Badge variant="outline" className="border-rose-200 bg-white text-rose-700 shadow-none">
              到期 {dueCount}
            </Badge>
          )}
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {customers.map((customer) => {
          const dueState = followUpDueState(customer)
          return (
            <div
              key={customer.id}
              data-follow-up-customer-id={customer.id}
              className={cn(
                'rounded-lg border bg-white p-3 shadow-sm',
                selectedCustomerId === customer.id ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900">{customer.name}</span>
                    <Badge variant="outline" className={cn('shadow-none', stageClassName[customer.stage])}>
                      {stageLabel(customer.stage)}
                    </Badge>
                    <Badge variant="outline" className={cn('shadow-none', valueClassName[customer.valueLevel])}>
                      {valueLabel(customer.valueLevel)}
                    </Badge>
                    <Badge variant="outline" className={cn('shadow-none', dueState.className)}>
                      {dueState.label}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">{customer.company} / {customer.city}</p>
                </div>
                <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => onSelectCustomer(customer.id)}>
                  查看
                </Button>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                <div className="rounded-md bg-slate-50 px-2 py-1.5 text-xs text-slate-600 ring-1 ring-slate-100">
                  <span className="text-slate-400">下次：</span>
                  {followUpTimeLabel(customer.nextFollowUpAt)}
                </div>
                <Input
                  aria-label={`${customer.name} 下次跟进时间`}
                  className="h-8 bg-white text-xs"
                  type="datetime-local"
                  value={customer.nextFollowUpAt || ''}
                  onChange={event => onUpdateSchedule(customer.id, event.target.value, customer.followUpNote || '')}
                />
              </div>
              <Textarea
                key={`${customer.id}-${customer.followUpNote || 'empty'}`}
                aria-label={`${customer.name} 跟进备注`}
                className="mt-2 min-h-16 bg-white text-xs"
                defaultValue={customer.followUpNote || ''}
                onBlur={event => onUpdateSchedule(customer.id, customer.nextFollowUpAt || getDefaultFollowUpAt(), event.target.value)}
                placeholder="记录二次触达重点"
              />
              <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-600">
                {customer.memory[0] || customer.source}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-8 bg-[#102033] hover:bg-[#182b45]"
                  onClick={() => onUpdateCustomerFollowUp(customer.id, 'followed')}
                >
                  已跟进
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => onUpdateCustomerFollowUp(customer.id, 'revisit')}
                  disabled={customer.stage === 'warming'}
                >
                  保留二触
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 text-slate-500 hover:text-slate-900"
                  onClick={() => onUpdateCustomerFollowUp(customer.id, 'invalid')}
                >
                  无效
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CustomerFollowUpActions({
  customer,
  onUpdateSchedule,
  onUpdate,
}: {
  customer: CustomerRecord
  onUpdateSchedule: (customerId: string, nextFollowUpAt: string, followUpNote: string) => void
  onUpdate: (customerId: string, action: CustomerFollowUpAction) => void
}) {
  const dueState = followUpDueState(customer)

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <UserCheck className="size-4 text-blue-600" />
          跟进状态回写
        </div>
        <Badge variant="outline" className={cn('shadow-none', dueState.className)}>
          {dueState.label}
        </Badge>
      </div>
      <div className="mb-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="rounded-md bg-white px-3 py-2 text-sm text-slate-600 ring-1 ring-slate-100">
          <span className="text-slate-400">下次跟进：</span>
          {followUpTimeLabel(customer.nextFollowUpAt)}
        </div>
        <Input
          aria-label="下次跟进时间"
          className="bg-white"
          type="datetime-local"
          value={customer.nextFollowUpAt || ''}
          onChange={event => onUpdateSchedule(customer.id, event.target.value, customer.followUpNote || '')}
        />
      </div>
      <Textarea
        key={`${customer.id}-${customer.followUpNote || 'empty'}`}
        aria-label="跟进备注"
        className="mb-3 min-h-20 bg-white"
        defaultValue={customer.followUpNote || ''}
        onBlur={event => onUpdateSchedule(customer.id, customer.nextFollowUpAt || getDefaultFollowUpAt(), event.target.value)}
        placeholder="记录下一次触达重点、客户顾虑或承诺事项"
      />
      <div className="grid gap-2 sm:grid-cols-3">
        <Button
          type="button"
          size="sm"
          className="bg-[#102033] hover:bg-[#182b45]"
          onClick={() => onUpdate(customer.id, 'followed')}
          disabled={customer.stage === 'contacted'}
        >
          已跟进
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onUpdate(customer.id, 'revisit')}
          disabled={customer.stage === 'warming'}
        >
          待二次触达
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-slate-500 hover:text-slate-900"
          onClick={() => onUpdate(customer.id, 'invalid')}
          disabled={customer.stage === 'invalid'}
        >
          无效
        </Button>
      </div>
    </div>
  )
}

function InteractionTimeline({ interactions }: { interactions: CustomerInteraction[] }) {
  return (
    <div className="space-y-3">
      {interactions.map(interaction => (
        <div key={interaction.id} className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-slate-200 bg-white text-slate-600 shadow-none">
              {platformLabels[interaction.channel as CustomerRadarPlatform] || interaction.channel}
            </Badge>
            <Badge variant="outline" className="border-blue-100 bg-blue-50 text-blue-700 shadow-none">
              {interactionTypeLabel(interaction.type)}
            </Badge>
            <span className="text-xs text-slate-500">{interaction.at}</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">{interaction.summary}</p>
          {interaction.aiReply && (
            <div className="mt-3 rounded-md bg-white p-3 text-sm leading-6 text-slate-600 ring-1 ring-slate-100">
              <span className="font-medium text-slate-900">AI 回复：</span>
              {interaction.aiReply}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function WorkflowCard({ text, title }: { text: string, title: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  )
}
