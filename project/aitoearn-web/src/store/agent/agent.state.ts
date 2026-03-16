/**
 * Agent Store - 状态定义
 * 初始状态和状态类型
 */

import type { IAgentState, ITaskMessageData } from './agent.types'
import lodash from 'lodash'

// ============ 默认任务数据 ============

/** 获取默认的任务消息数据 */
export function getDefaultTaskData(): ITaskMessageData {
  return {
    messages: [],
    markdownMessages: [],
    workflowSteps: [],
    streamingText: '',
    progress: 0,
    isGenerating: false,
    lastUpdated: 0,
  }
}

// ============ 初始状态 ============

export const initialState: IAgentState = {
  // 当前活跃任务
  currentTaskId: '',

  // 任务消息存储（按 taskId 隔离）
  taskMessages: {},

  // 全局状态
  currentCost: 0,
  pendingTask: null,

  // Debug 模式状态
  debugFiles: [],
  debugMessageIndex: 0,
}

/**
 * 获取初始状态的深拷贝
 */
export function getInitialState(): IAgentState {
  return lodash.cloneDeep(initialState)
}
