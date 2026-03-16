/**
 * TaskInstance - 任务实例类
 * 每个 Agent 任务有独立的实例，消除多任务竞态条件
 *
 * 设计理念：
 * - 每个任务创建一个 TaskInstance，持有自己的 taskId
 * - 所有消息/工作流操作自动使用实例的 taskId，无需传参
 * - SSE 回调绑定到具体实例，不受全局 currentTaskId 切换影响
 *
 * 模块拆分：
 * - task-instance.types.ts: 类型定义
 * - message.handler.ts: 消息处理逻辑
 * - workflow.handler.ts: 工作流处理逻辑
 * - sse.handler.ts: SSE 消息处理逻辑
 */

import type {
  IActionCard,
  IActionContext,
  IDisplayMessage,
  IPublishFlowData,
  ISSEMessage,
  ITaskMessageData,
  IUploadedMedia,
  IWorkflowStep,
} from '../agent.types'
import type {
  IMessageHandlerContext,
  ISSECallbacks,
  ISSEHandlerContext,
  ITaskInstanceContext,
  IWorkflowHandlerContext,
} from './task-instance.types'
import { getDefaultTaskData } from '../agent.state'
import * as MessageHandler from './message.handler'
import * as SSEHandler from './sse.handler'
import * as WorkflowHandler from './workflow.handler'

// ============ TaskInstance 类 ============

/**
 * 任务实例类
 * 封装单个任务的所有状态和操作
 */
export class TaskInstance {
  // ========== 实例标识 ==========

  /** 实例ID（创建时确定，不可变，用于 Map key） */
  readonly instanceId: string

  /** 任务ID（可从 temp-xxx 更新为真实ID） */
  private _taskId: string

  /** 获取当前任务ID */
  get taskId(): string {
    return this._taskId
  }

  // ========== 实例级别的状态（不会被其他任务覆盖） ==========

  /** 当前 assistant 消息 ID */
  private currentAssistantMessageId: string = ''

  /** 流式文本（正在生成的内容） */
  private streamingText: string = ''

  /** 当前步骤的工作流步骤 */
  private currentStepWorkflow: IWorkflowStep[] = []

  /** 当前步骤索引 */
  private currentStepIndex: number = -1

  /** SSE abort 函数 */
  private sseAbort: (() => void) | null = null

  /** 翻译函数 */
  private t: ((key: string) => string) | null = null

  /** Action 上下文 */
  private actionContext: IActionContext | null = null

  // ========== 上下文 ==========

  /** Store 交互上下文 */
  private ctx: ITaskInstanceContext

  // ========== 构造函数 ==========

  constructor(taskId: string, ctx: ITaskInstanceContext) {
    this.instanceId = taskId // 实例ID = 初始 taskId
    this._taskId = taskId
    this.ctx = ctx
    console.log(`[TaskInstance] Created instance: ${this.instanceId}`)
  }

  // ========== 生命周期方法 ==========

  /**
   * 更新真实 taskId（SSE init 返回后调用）
   */
  migrateToRealTaskId(realTaskId: string): void {
    const oldTaskId = this._taskId
    if (oldTaskId === realTaskId) {
      return
    }
    console.log(`[TaskInstance] Migrating taskId: ${oldTaskId} -> ${realTaskId}`)
    this._taskId = realTaskId
    this.ctx.migrateTaskData(oldTaskId, realTaskId)
  }

  /**
   * 设置 SSE abort 函数
   */
  setAbort(abortFn: () => void): void {
    this.sseAbort = abortFn
  }

  /**
   * 中止 SSE 连接
   */
  abort(): void {
    if (this.sseAbort) {
      console.log(`[TaskInstance] Aborting SSE for task: ${this.taskId}`)
      this.sseAbort()
      this.sseAbort = null
    }
  }

  /**
   * 设置翻译函数
   */
  setTranslation(t: (key: string) => string): void {
    this.t = t
  }

  /**
   * 设置 Action 上下文
   */
  setActionContext(context: IActionContext): void {
    this.actionContext = context
  }

  /**
   * 重置实例状态（新一轮对话前调用）
   */
  resetForNewRound(): void {
    this.currentAssistantMessageId = ''
    this.streamingText = ''
    this.currentStepWorkflow = []
    this.currentStepIndex = -1
  }

  // ========== 数据访问方法 ==========

  /**
   * 获取当前任务数据
   */
  private getData(): ITaskMessageData {
    return this.ctx.getData(this.taskId) || getDefaultTaskData()
  }

  /**
   * 更新当前任务数据
   */
  private updateData(updater: (data: ITaskMessageData) => Partial<ITaskMessageData>): void {
    this.ctx.syncToStore(this.taskId, updater)
  }

  // ========== Handler 上下文构建 ==========

  /**
   * 获取消息处理上下文
   */
  private getMessageContext(): IMessageHandlerContext {
    return {
      getTaskId: () => this.taskId,
      getCurrentAssistantMessageId: () => this.currentAssistantMessageId,
      setCurrentAssistantMessageId: (id: string) => {
        this.currentAssistantMessageId = id
      },
      updateData: updater => this.updateData(updater),
    }
  }

  /**
   * 获取工作流处理上下文
   */
  private getWorkflowContext(): IWorkflowHandlerContext {
    return {
      ...this.getMessageContext(),
      getStreamingText: () => this.streamingText,
      setStreamingText: (text: string) => {
        this.streamingText = text
      },
      appendStreamingText: (text: string) => {
        this.streamingText += text
      },
      getCurrentStepWorkflow: () => this.currentStepWorkflow,
      setCurrentStepWorkflow: (steps: IWorkflowStep[]) => {
        this.currentStepWorkflow = steps
      },
      pushToCurrentStepWorkflow: (step: IWorkflowStep) => {
        this.currentStepWorkflow.push(step)
      },
      getCurrentStepIndex: () => this.currentStepIndex,
      setCurrentStepIndex: (index: number) => {
        this.currentStepIndex = index
      },
      incrementCurrentStepIndex: () => {
        this.currentStepIndex++
      },
      addMarkdownMessage: (message: string) =>
        MessageHandler.addMarkdownMessage(this.getMessageContext(), message),
    }
  }

  /**
   * 获取 SSE 处理上下文
   */
  private getSSEContext(): ISSEHandlerContext {
    return {
      ...this.getWorkflowContext(),
      getActionContext: () => this.actionContext,
      migrateToRealTaskId: (realTaskId: string) => this.migrateToRealTaskId(realTaskId),
      markMessageDone: () => this.markMessageDone(),
      addMessage: (message: IDisplayMessage) => this.addMessage(message),
      setIsGenerating: (value: boolean) => this.setIsGenerating(value),
      setProgress: (value: number) => this.setProgress(value),
    }
  }

  // ========== 消息方法（代理到 message.handler） ==========

  /**
   * 创建用户消息
   */
  createUserMessage(content: string, medias?: IUploadedMedia[]): IDisplayMessage {
    return MessageHandler.createUserMessage(content, medias)
  }

  /**
   * 创建 assistant 消息
   */
  createAssistantMessage(): IDisplayMessage {
    return MessageHandler.createAssistantMessage(this.getMessageContext())
  }

  /**
   * 添加消息到列表
   */
  addMessage(message: IDisplayMessage): void {
    MessageHandler.addMessage(this.getMessageContext(), message)
  }

  /**
   * 设置消息列表（用于加载历史消息）
   */
  setMessages(messages: IDisplayMessage[]): void {
    MessageHandler.setMessages(this.getMessageContext(), messages)
  }

  /**
   * 标记当前 assistant 消息为完成
   */
  markMessageDone(): void {
    MessageHandler.markMessageDone(this.getMessageContext())
  }

  /**
   * 标记当前 assistant 消息为错误
   */
  markMessageError(errorMessage: string): void {
    MessageHandler.markMessageError(this.getMessageContext(), errorMessage)
  }

  /**
   * 更新当前 assistant 消息内容
   */
  updateMessageContent(content: string): void {
    MessageHandler.updateMessageContent(this.getMessageContext(), content)
  }

  /**
   * 更新当前 assistant 消息的 actions
   */
  updateMessageActions(actions: IActionCard[]): void {
    MessageHandler.updateMessageActions(this.getMessageContext(), actions)
  }

  /**
   * 更新当前 assistant 消息内容和 actions
   */
  updateMessageWithActions(content: string, actions: IActionCard[]): void {
    MessageHandler.updateMessageWithActions(this.getMessageContext(), content, actions)
  }

  /**
   * 更新当前 assistant 消息内容，并将 medias 附加到最后一个 step
   */
  updateMessageContentWithMedias(
    content: string,
    medias?: Array<{ type: string, url: string, thumbUrl?: string }>,
  ): void {
    MessageHandler.updateMessageContentWithMedias(this.getMessageContext(), content, medias)
  }

  /**
   * 更新当前 assistant 消息的发布流程数据
   */
  updateMessageWithPublishFlows(publishFlows: IPublishFlowData[]): void {
    MessageHandler.updateMessageWithPublishFlows(this.getMessageContext(), publishFlows)
  }

  /**
   * 更新当前 assistant 消息内容、actions 和发布流程数据
   */
  updateMessageWithActionsAndPublishFlows(
    content: string,
    actions: IActionCard[],
    publishFlows: IPublishFlowData[],
  ): void {
    MessageHandler.updateMessageWithActionsAndPublishFlows(
      this.getMessageContext(),
      content,
      actions,
      publishFlows,
    )
  }

  /**
   * 添加到 markdown 消息历史
   */
  addMarkdownMessage(message: string): void {
    MessageHandler.addMarkdownMessage(this.getMessageContext(), message)
  }

  /**
   * 更新最后一条 markdown 消息
   */
  updateLastMarkdownMessage(message: string): void {
    MessageHandler.updateLastMarkdownMessage(this.getMessageContext(), message)
  }

  // ========== 工作流方法（代理到 workflow.handler） ==========

  /**
   * 开始新步骤
   */
  startNewStep(): void {
    WorkflowHandler.startNewStep(this.getWorkflowContext())
  }

  /**
   * 添加工作流步骤
   */
  addWorkflowStep(step: IWorkflowStep): void {
    WorkflowHandler.addWorkflowStep(this.getWorkflowContext(), step)
  }

  /**
   * 更新最后一个工作流步骤
   */
  updateLastWorkflowStep(updater: (step: IWorkflowStep) => IWorkflowStep): void {
    WorkflowHandler.updateLastWorkflowStep(this.getWorkflowContext(), updater)
  }

  /**
   * 处理工具调用完成
   */
  handleToolCallComplete(toolName: string, toolInput: string): void {
    WorkflowHandler.handleToolCallComplete(this.getWorkflowContext(), toolName, toolInput)
  }

  /**
   * 处理工具结果
   */
  handleToolResult(resultText: string): void {
    WorkflowHandler.handleToolResult(this.getWorkflowContext(), resultText)
  }

  // ========== 状态更新方法 ==========

  /**
   * 设置生成状态
   */
  setIsGenerating(isGenerating: boolean): void {
    this.updateData(() => ({ isGenerating }))
  }

  /**
   * 设置进度
   */
  setProgress(progress: number): void {
    this.updateData(() => ({ progress }))
  }

  /**
   * 清空工作流步骤（新一轮对话开始时调用）
   */
  clearWorkflowSteps(): void {
    this.updateData(() => ({ workflowSteps: [] }))
  }

  // ========== SSE 消息处理（代理到 sse.handler） ==========

  /**
   * 处理 SSE 消息
   */
  handleSSEMessage(msg: ISSEMessage, callbacks?: ISSECallbacks): void {
    SSEHandler.handleSSEMessage(this.getSSEContext(), msg, callbacks)
  }

  // ========== 调试方法 ==========

  /**
   * 获取实例状态信息（用于调试）
   */
  getDebugInfo(): object {
    return {
      instanceId: this.instanceId,
      taskId: this.taskId,
      currentAssistantMessageId: this.currentAssistantMessageId,
      streamingTextLength: this.streamingText.length,
      currentStepWorkflowLength: this.currentStepWorkflow.length,
      currentStepIndex: this.currentStepIndex,
      hasAbort: !!this.sseAbort,
    }
  }
}

// ============ 工厂函数 ============

/**
 * 创建任务实例
 */
export function createTaskInstance(taskId: string, ctx: ITaskInstanceContext): TaskInstance {
  return new TaskInstance(taskId, ctx)
}
