/**
 * AgentGenerator - 类型定义文件
 * AI Agent 内容生成组件的类型定义
 */

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import type { TFunction } from 'i18next'

// ============ 媒体相关类型 ============

/** 上传的媒体文件类型 */
export interface IUploadedMedia {
  url: string
  type: 'image' | 'video'
}

// ============ 消息相关类型 ============

/** 消息类型 */
export type MessageType = 'status' | 'description' | 'error' | 'text' | 'markdown'

/** 消息项 */
export interface IMessageItem {
  type: MessageType
  content: string
  /** 状态类型（用于渲染对应图标） */
  status?: string
  /** 是否显示加载动画（用于媒体生成状态） */
  loading?: boolean
}

// ============ 任务结果相关类型 ============

/** 结果类型 */
export type ResultType = 'imageOnly' | 'videoOnly' | 'mediaOnly' | 'fullContent'

/** 操作类型 */
export type ActionType = 
  | 'navigateToPublish' 
  | 'navigateToDraft' 
  | 'saveDraft' 
  | 'updateChannel' 
  | 'loginChannel'
  | 'platformNotSupported'

/** 平台类型 */
export type PlatformType = 
  | 'douyin' 
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
  type: 'VIDEO' | 'IMAGE'
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
}

// ============ Store 状态类型 ============

/** Agent Store 状态 */
export interface IAgentStoreState {
  // === 会话状态 ===
  /** 任务ID */
  taskId: string
  /** 会话ID */
  sessionId: string
  /** 用户输入的提示词 */
  prompt: string

  // === 生成状态 ===
  /** 是否正在生成 */
  isGenerating: boolean
  /** 进度百分比 0-100 */
  progress: number
  /** 流式文本 */
  streamingText: string

  // === 媒体状态 ===
  /** 已上传的媒体文件列表 */
  uploadedImages: IUploadedMedia[]
  /** 是否正在上传 */
  isUploading: boolean

  // === 消息状态 ===
  /** 已完成的消息列表 */
  completedMessages: IMessageItem[]
  /** 待处理的消息队列 */
  pendingMessages: IMessageItem[]
  /** 当前正在打字的消息 */
  currentTypingMsg: IMessageItem | null
  /** 当前已显示的文本（打字机效果） */
  displayedText: string
  /** Markdown 消息列表 */
  markdownMessages: string[]

  // === UI 状态 ===
  /** 选中的模式 */
  selectedMode: 'agent' | 'image' | 'video' | 'draft' | 'publishbatch'
  /** 本次消费金额 */
  currentCost: number
  /** 是否显示固定输入框 */
  showFixedInput: boolean
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

// ============ 组件 Props 类型 ============

/** AgentGenerator 组件 Props */
export interface IAgentGeneratorProps {
  /** 需要登录时的回调 */
  onLoginRequired?: () => void
  /** 需要应用的提示词（从外部传入） */
  promptToApply?: { prompt: string; image?: string } | null
}

/** AgentGenerator Ref 接口 */
export interface IAgentGeneratorRef {
  /** 重置状态 */
  reset: () => void
  /** 新对话 */
  newConversation: () => void
}

