/**
 * Agent Store - 状态定义
 * 初始状态和状态类型
 */

import lodash from 'lodash'
import type { IAgentState } from './agent.types'

// ============ 初始状态 ============

export const initialState: IAgentState = {
  // 任务状态
  currentTaskId: '',
  isGenerating: false,
  progress: 0,

  // 流式响应状态
  streamingText: '',
  markdownMessages: [],
  workflowSteps: [],

  // 消息状态
  messages: [],

  // 消费状态
  currentCost: 0,

  // 待处理任务
  pendingTask: null,
}

/**
 * 获取初始状态的深拷贝
 */
export function getInitialState(): IAgentState {
  return lodash.cloneDeep(initialState)
}

