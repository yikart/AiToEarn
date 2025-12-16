/**
 * Agent Store - 类型定义
 * 全局 AI Agent 任务管理的类型定义
 */

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import type { TFunction } from 'i18next'

// ============ 媒体相关类型 ============

/** 上传的媒体文件类型 */
export interface IUploadedMedia {
  url: string
  type: 'image' | 'video'
  /** 上传进度 (0-100) */
  progress?: number
  /** 原始文件（上传中时使用） */
  file?: File
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
  /** 是否为当前活跃步骤 */
  isActive?: boolean
  /** 时间戳 */
  timestamp?: number
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
  /** 内容/参数 */
  content?: string
  /** 是否正在执行 */
  isActive?: boolean
  /** 时间戳 */
  timestamp: number
}

// ============ Store 状态类型 ============

/** Agent Store 状态 */
export interface IAgentState {
  // === 任务状态 ===
  /** 当前任务ID */
  currentTaskId: string
  /** 是否正在生成 */
  isGenerating: boolean
  /** 进度百分比 0-100 */
  progress: number

  // === 流式响应状态 ===
  /** 流式文本（正在生成的内容） */
  streamingText: string
  /** Markdown 消息列表（用于显示对话历史） */
  markdownMessages: string[]
  /** 工作流步骤列表（当前轮次的所有步骤） */
  workflowSteps: IWorkflowStep[]

  // === 消息状态 ===
  /** 显示的消息列表 */
  messages: IDisplayMessage[]

  // === 消费状态 ===
  /** 本次消费金额 */
  currentCost: number
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
  type: 'init' | 'keep_alive' | 'stream_event' | 'message' | 'status' | 'error' | 'done' | 'text' | 'result' | 'assistant' | 'user'
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

