/**
 * Agent Store - Refs 管理
 * 管理内部引用变量，避免闭包问题
 */

import type { IActionContext, IWorkflowStep } from '../agent.types'

// ============ Ref 类型定义 ============

/** 可变引用类型 */
export interface IRef<T> {
  value: T
}

/** Agent Store 所有 Refs */
export interface IAgentRefs {
  /** 流式文本 */
  streamingText: IRef<string>
  /** 当前步骤的工作流步骤 */
  currentStepWorkflow: IRef<IWorkflowStep[]>
  /** 当前步骤索引 */
  currentStepIndex: IRef<number>
  /** 当前 assistant 消息 ID */
  currentAssistantMessageId: IRef<string>
  /** SSE 连接的 abort 函数 */
  sseAbort: IRef<(() => void) | null>
  /** 翻译函数 */
  t: IRef<((key: string) => string) | null>
  /** Action 上下文 */
  actionContext: IRef<IActionContext | null>
}

// ============ 创建 Refs ============

/**
 * 创建 Agent Store 的所有 Refs
 */
export function createAgentRefs(): IAgentRefs {
  return {
    streamingText: { value: '' },
    currentStepWorkflow: { value: [] },
    currentStepIndex: { value: -1 },
    currentAssistantMessageId: { value: '' },
    sseAbort: { value: null },
    t: { value: null },
    actionContext: { value: null },
  }
}

/**
 * 重置所有 Refs 到初始状态
 */
export function resetAgentRefs(refs: IAgentRefs): void {
  refs.streamingText.value = ''
  refs.currentStepWorkflow.value = []
  refs.currentStepIndex.value = -1
  refs.currentAssistantMessageId.value = ''
}

/**
 * 完全重置所有 Refs（包括 SSE 和上下文）
 */
export function resetAllRefs(refs: IAgentRefs): void {
  resetAgentRefs(refs)
  refs.sseAbort.value = null
  refs.t.value = null
  refs.actionContext.value = null
}
