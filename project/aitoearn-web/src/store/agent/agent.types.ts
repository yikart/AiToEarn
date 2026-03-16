/**
 * Agent Store - 类型定义
 * 全局 AI Agent 任务管理的类型定义
 */

import type { TFunction } from 'i18next'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

// ============ 媒体相关类型 ============

/** 上传的媒体文件类型 */
export interface IUploadedMedia {
  url: string
  type: 'image' | 'video' | 'document'
  /** 上传进度 (0-100) */
  progress?: number
  /** 原始文件（上传中时使用） */
  file?: File
  /** 文档名称（document 类型使用） */
  name?: string
  /** 缓存控制（可选） */
  cache_control?: {
    type: 'ephemeral'
  }
}

/** Claude Prompt 内容项类型 */
export type PromptContentType = 'text' | 'image' | 'video' | 'document'

/** Claude Prompt 内容项 */
export interface IPromptContentItem {
  type: PromptContentType
  text?: string
  source?: {
    type: 'url' | 'base64'
    url?: string
    data?: string
    media_type?: string
  }
  cache_control?: {
    type: 'ephemeral'
  }
}

/** 解析后的用户消息内容 */
export interface IParsedUserContent {
  /** 纯文本内容 */
  text: string
  /** 媒体文件列表 */
  medias: IUploadedMedia[]
  /** 是否包含特殊格式 */
  hasSpecialFormat: boolean
}

// ============ 消息相关类型 ============

/** 消息角色 */
export type MessageRole = 'user' | 'assistant' | 'system'

/** 消息状态 */
export type MessageStatus = 'pending' | 'streaming' | 'done' | 'error'

/** AI 消息步骤 - 用于展示 AI 回复的多个阶段 */
export interface IMessageStep {
  /** 步骤ID */
  id: string
  /** 该步骤的文本内容 */
  content: string
  /** 该步骤关联的工作流步骤 */
  workflowSteps?: IWorkflowStep[]
  /** 该步骤关联的媒体（图片/视频），用于在步骤位置内渲染资源 */
  medias?: IUploadedMedia[]
  /** 是否为当前活跃步骤 */
  isActive?: boolean
  /** 时间戳 */
  timestamp?: number
}

/** Action 卡片数据 */
export interface IActionCard {
  /** Action 类型 */
  type: ActionType
  /** 平台 */
  platform?: PlatformType
  /** 账号ID */
  accountId?: string
  /** 标题 */
  title?: string
  /** 描述 */
  description?: string
  /** 媒体数据（用于发布） */
  medias?: IMediaItem[]
  /** 标签 */
  tags?: string[]
  /** 发布流程 ID（用于查询发布详情） */
  flowId?: string
  /** 是否为实时 SSE 消息（区分实时推送 vs 历史加载，用于自动发布倒计时） */
  _isRealtime?: boolean
}

/** 发布详情数据（用于 PublishDetailCard） */
export interface IPublishFlowData {
  /** 发布流程 ID */
  flowId: string
  /** 平台类型 */
  platform?: PlatformType
  /** 初始数据（来自 SSE result） */
  initialData?: {
    title?: string
    description?: string
    medias?: IMediaItem[]
  }
}

/** 显示消息项 */
export interface IDisplayMessage {
  id: string
  role: MessageRole
  content: string
  medias?: IUploadedMedia[]
  status?: MessageStatus
  errorMessage?: string
  createdAt?: number
  /** AI 消息的步骤列表（仅 assistant 消息使用） */
  steps?: IMessageStep[]
  /** Action 卡片列表（用于显示可交互的 action） */
  actions?: IActionCard[]
  /** 发布流程数据列表（用于显示 PublishDetailCard） */
  publishFlows?: IPublishFlowData[]
}

// ============ 任务结果相关类型 ============

/** 结果类型 */
export type ResultType = 'imageOnly' | 'videoOnly' | 'mediaOnly' | 'fullContent'

/** 操作类型 */
export type ActionType
  = | 'navigateToPublish'
    | 'navigateToDraft'
    | 'saveDraft'
    | 'updateChannel'
    | 'loginChannel'
    | 'createChannel'
    | 'platformNotSupported'
    | 'errorOnly'
    | 'insufficientCredits'

/** 平台类型 */
export type PlatformType
  = | 'douyin'
    | 'xhs'
    | 'wxSph'
    | 'KWAI'
    | 'youtube'
    | 'wxGzh'
    | 'bilibili'
    | 'twitter'
    | 'tiktok'
    | 'facebook'
    | 'instagram'
    | 'threads'
    | 'pinterest'
    | 'linkedin'

/** 媒体项 */
export interface IMediaItem {
  type: 'video' | 'image' | 'VIDEO' | 'IMAGE'
  url: string
  coverUrl?: string
  thumbUrl?: string
}

/** 任务数据（从 SSE 返回） */
export interface ITaskData {
  taskId?: string
  type?: ResultType
  action?: ActionType
  platform?: PlatformType
  accountId?: string
  title?: string
  description?: string
  tags?: string[]
  medias?: IMediaItem[]
  errorMessage?: string
  /** 发布流程 ID（用于查询发布详情） */
  flowId?: string
}

// ============ 工作流相关类型 ============

/** 工作流步骤类型 */
export type WorkflowStepType = 'thinking' | 'tool_call' | 'tool_result'

/** 工作流步骤 */
export interface IWorkflowStep {
  /** 唯一标识 */
  id: string
  /** 步骤类型 */
  type: WorkflowStepType
  /** 工具名称（tool_call/tool_result 时使用） */
  toolName?: string
  /** 内容/参数（工具输入） */
  content?: string
  /** 工具执行结果 */
  result?: string
  /** 是否正在执行 */
  isActive?: boolean
  /** 时间戳 */
  timestamp: number
}

// ============ Store 状态类型 ============

/** 待处理的任务（用于首页跳转后在聊天页创建） */
export interface IPendingTask {
  prompt: string
  medias: IUploadedMedia[]
}

/** 单个任务的消息数据（按任务ID隔离存储） */
export interface ITaskMessageData {
  /** 显示的消息列表 */
  messages: IDisplayMessage[]
  /** Markdown 消息列表（用于显示对话历史） */
  markdownMessages: string[]
  /** 工作流步骤列表（当前轮次的所有步骤） */
  workflowSteps: IWorkflowStep[]
  /** 流式文本（正在生成的内容） */
  streamingText: string
  /** 进度百分比 0-100 */
  progress: number
  /** 是否正在生成 */
  isGenerating: boolean
  /** 最后更新时间戳 */
  lastUpdated: number
}

/** 按任务ID存储的消息映射 */
export type TaskMessageMap = Record<string, ITaskMessageData>

/** Agent Store 状态 */
export interface IAgentState {
  // === 当前活跃任务 ===
  /** 当前任务ID */
  currentTaskId: string

  // === 任务消息存储（按 taskId 隔离） ===
  /** 任务消息映射表 */
  taskMessages: TaskMessageMap

  // === 全局状态（不需要按任务隔离） ===
  /** 本次消费金额 */
  currentCost: number
  /** 待处理的任务（从首页跳转时设置） */
  pendingTask: IPendingTask | null

  // === Debug 模式状态 ===
  /** Debug 模式文件列表（按顺序对应第 N 次消息） */
  debugFiles: string[]
  /** Debug 模式当前消息索引 */
  debugMessageIndex: number
}

// ============ Action Handler 相关类型 ============

/** Action 上下文 */
export interface IActionContext {
  /** Next.js 路由实例 */
  router: AppRouterInstance
  /** 当前语言 */
  lng: string
  /** 翻译函数 */
  t: TFunction
}

/** Action Handler 接口 */
export interface IActionHandler {
  /** Action 类型 */
  type: ActionType
  /** 判断是否能处理该任务 */
  canHandle: (taskData: ITaskData) => boolean
  /** 执行 Action */
  execute: (taskData: ITaskData, context: IActionContext) => Promise<void>
}

/** SSE 消息类型 */
export interface ISSEMessage {
  type:
    | 'init'
    | 'keep_alive'
    | 'stream_event'
    | 'message'
    | 'status'
    | 'error'
    | 'done'
    | 'text'
    | 'result'
    | 'assistant'
    | 'user'
  taskId?: string
  message?: string | any
  sessionId?: string
  status?: string
  data?: any
}

/** 创建任务参数 */
export interface ICreateTaskParams {
  /** 提示词 */
  prompt: string
  /** 媒体文件列表 */
  medias?: IUploadedMedia[]
  /** 翻译函数 */
  t: (key: string) => string
  /** taskId 获取成功回调 */
  onTaskIdReady?: (taskId: string) => void
  /** 需要登录回调 */
  onLoginRequired?: () => void
}
