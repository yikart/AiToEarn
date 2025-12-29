/**
 * Agent Store - 状态定义
 * 初始状态和状态类型
 */

import type { IAgentState } from './agent.types'
import lodash from 'lodash'

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

  // 调试回放模式（用于本地调试回放文件）
  debugReplayActive: false,

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
