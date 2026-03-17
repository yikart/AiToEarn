/**
 * TaskInstance 类型定义
 * 提取自 TaskInstance.ts，用于各个 handler 模块共享
 */

import type {
  IActionContext,
  IDisplayMessage,
  ITaskMessageData,
  IWorkflowStep,
} from '../agent.types'

// ============ 上下文接口 ============

/** 任务实例上下文（与 Store 交互） */
export interface ITaskInstanceContext {
  /** 同步数据到 store */
  syncToStore: (
    taskId: string,
    updater: (data: ITaskMessageData) => Partial<ITaskMessageData>,
  ) => void
  /** 获取任务数据 */
  getData: (taskId: string) => ITaskMessageData
  /** 迁移任务数据（从临时ID到真实ID） */
  migrateTaskData: (fromTaskId: string, toTaskId: string) => void
  /** 更新当前任务ID（在 store 中） */
  setCurrentTaskId: (taskId: string) => void
}

/** SSE 回调函数 */
export interface ISSECallbacks {
  onTaskIdReady?: (taskId: string) => void
  onError?: (error: Error) => void
  onComplete?: () => void
}

// ============ 内部状态接口 ============

/** TaskInstance 内部状态（供 handler 使用） */
export interface ITaskInstanceState {
  /** 实例ID */
  instanceId: string
  /** 任务ID */
  taskId: string
  /** 当前 assistant 消息 ID */
  currentAssistantMessageId: string
  /** 流式文本 */
  streamingText: string
  /** 当前步骤的工作流步骤 */
  currentStepWorkflow: IWorkflowStep[]
  /** 当前步骤索引 */
  currentStepIndex: number
  /** Action 上下文 */
  actionContext: IActionContext | null
}

// ============ Handler 上下文接口 ============

/** 消息处理上下文 */
export interface IMessageHandlerContext {
  /** 获取任务ID */
  getTaskId: () => string
  /** 获取当前 assistant 消息 ID */
  getCurrentAssistantMessageId: () => string
  /** 设置当前 assistant 消息 ID */
  setCurrentAssistantMessageId: (id: string) => void
  /** 更新数据 */
  updateData: (updater: (data: ITaskMessageData) => Partial<ITaskMessageData>) => void
}

/** 工作流处理上下文 */
export interface IWorkflowHandlerContext extends IMessageHandlerContext {
  /** 获取流式文本 */
  getStreamingText: () => string
  /** 设置流式文本 */
  setStreamingText: (text: string) => void
  /** 追加流式文本 */
  appendStreamingText: (text: string) => void
  /** 获取当前步骤工作流 */
  getCurrentStepWorkflow: () => IWorkflowStep[]
  /** 设置当前步骤工作流 */
  setCurrentStepWorkflow: (steps: IWorkflowStep[]) => void
  /** 追加到当前步骤工作流 */
  pushToCurrentStepWorkflow: (step: IWorkflowStep) => void
  /** 获取当前步骤索引 */
  getCurrentStepIndex: () => number
  /** 设置当前步骤索引 */
  setCurrentStepIndex: (index: number) => void
  /** 增加当前步骤索引 */
  incrementCurrentStepIndex: () => void
  /** 添加 markdown 消息 */
  addMarkdownMessage: (message: string) => void
}

/** SSE 处理上下文（扩展工作流上下文） */
export interface ISSEHandlerContext extends IWorkflowHandlerContext {
  /** 获取 action 上下文 */
  getActionContext: () => IActionContext | null
  /** 迁移到真实 taskId */
  migrateToRealTaskId: (realTaskId: string) => void
  /** 标记消息完成 */
  markMessageDone: () => void
  /** 添加消息 */
  addMessage: (message: IDisplayMessage) => void
  /** 设置生成状态 */
  setIsGenerating: (value: boolean) => void
  /** 设置进度 */
  setProgress: (value: number) => void
}
