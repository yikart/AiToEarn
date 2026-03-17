/**
 * Agent Store - 全局 AI Agent 任务状态管理
 *
 * 目录结构：
 * ├── index.ts           - 主入口（本文件）
 * ├── agent.types.ts     - 类型定义
 * ├── agent.constants.ts - 常量定义
 * ├── agent.state.ts     - 初始状态
 * ├── agent.methods.ts   - 核心方法
 * ├── handlers/          - 处理器目录
 * │   └── action.handlers.ts - Action 处理器
 * ├── utils/             - 工具函数目录
 * │   ├── refs.ts        - Refs 管理
 * │   ├── message.ts     - 消息工具
 * │   └── progress.ts    - 进度工具
 * └── task-instance/     - 任务实例目录
 *     ├── index.ts               - 模块入口
 *     ├── task-instance.types.ts - 类型定义
 *     ├── TaskInstance.ts        - 核心类
 *     ├── message.handler.ts     - 消息处理
 *     ├── workflow.handler.ts    - 工作流处理
 *     └── sse.handler.ts         - SSE 消息处理
 */

import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { createStoreMethods } from './agent.methods'
import { getInitialState } from './agent.state'
import { TaskInstance } from './task-instance'
import { createMessageUtils } from './utils/message'
import { createAgentRefs, resetAgentRefs } from './utils/refs'

// ============ TaskInstance 管理（不需要持久化，放在 store 外部） ============

/** 任务实例映射表 */
const taskInstances = new Map<string, TaskInstance>()

/**
 * 获取任务实例
 */
export function getTaskInstance(instanceId: string): TaskInstance | undefined {
  return taskInstances.get(instanceId)
}

/**
 * 创建或获取任务实例
 */
export function getOrCreateTaskInstance(
  taskId: string,
  ctx: import('./task-instance').ITaskInstanceContext,
): TaskInstance {
  const existing = taskInstances.get(taskId)
  if (existing) {
    return existing
  }
  const instance = new TaskInstance(taskId, ctx)
  taskInstances.set(taskId, instance)
  return instance
}

/**
 * 删除任务实例
 */
export function removeTaskInstance(instanceId: string): boolean {
  const instance = taskInstances.get(instanceId)
  if (instance) {
    instance.abort() // 确保 SSE 连接被中止
    taskInstances.delete(instanceId)
    return true
  }
  return false
}

/**
 * 迁移任务实例（从临时ID到真实ID）
 */
export function migrateTaskInstance(fromId: string, toId: string): void {
  const instance = taskInstances.get(fromId)
  if (instance && fromId !== toId) {
    taskInstances.delete(fromId)
    taskInstances.set(toId, instance)
    console.log(`[TaskInstances] Migrated instance: ${fromId} -> ${toId}`)
  }
}

/**
 * 获取所有任务实例（用于调试）
 */
export function getAllTaskInstances(): Map<string, TaskInstance> {
  return new Map(taskInstances)
}

/**
 * 清理所有任务实例
 */
export function clearAllTaskInstances(): void {
  taskInstances.forEach((instance) => {
    instance.abort()
  })
  taskInstances.clear()
}

// ============ Store 定义 ============

export const useAgentStore = create(
  combine(getInitialState(), (set, get) => {
    // 创建 Refs
    const refs = createAgentRefs()

    // 创建工具
    const messageUtils = createMessageUtils({ refs, set: set as any, get })

    // 重置 Refs 的函数
    const resetRefs = () => resetAgentRefs(refs)

    // 创建并返回所有方法
    return createStoreMethods({
      refs,
      set: set as any,
      get,
      messageUtils,
      resetRefs,
    })
  }),
)

// ============ 导出 ============

export * from './agent.constants'
// 导出状态相关
export { getDefaultTaskData, getInitialState } from './agent.state'

// 导出类型
export * from './agent.types'

// 导出处理器
export { ActionRegistry } from './handlers'
export type { IActionHandler } from './handlers'

// 导出 TaskInstance 相关
export { createTaskInstance, TaskInstance } from './task-instance'
export type { ITaskInstanceContext, ISSECallbacks as ITaskSSECallbacks } from './task-instance'

// 导出工具（用于扩展）
export { createAgentRefs, createMessageUtils } from './utils'
export type { IAgentRefs, MessageUtils } from './utils'
