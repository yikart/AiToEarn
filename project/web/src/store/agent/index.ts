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
 * │   ├── sse.handlers.ts    - SSE 消息处理器
 * │   └── action.handlers.ts - Action 处理器
 * └── utils/             - 工具函数目录
 *     ├── refs.ts        - Refs 管理
 *     ├── workflow.ts    - 工作流工具
 *     ├── message.ts     - 消息工具
 *     └── progress.ts    - 进度工具
 */

import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { createStoreMethods } from './agent.methods'
import { getInitialState } from './agent.state'
import { createMessageUtils } from './utils/message'
import { createAgentRefs, resetAgentRefs } from './utils/refs'
import { createWorkflowUtils } from './utils/workflow'

// ============ Store 定义 ============

export const useAgentStore = create(
  combine(getInitialState(), (set, get) => {
    // 创建 Refs
    const refs = createAgentRefs()

    // 创建工具
    const workflowUtils = createWorkflowUtils({ refs, set: set as any, get })
    const messageUtils = createMessageUtils({ refs, set: set as any, get })

    // 重置 Refs 的函数
    const resetRefs = () => resetAgentRefs(refs)

    // 创建并返回所有方法
    return createStoreMethods({
      refs,
      set: set as any,
      get,
      workflowUtils,
      messageUtils,
      resetRefs,
    })
  }),
)

// ============ 导出 ============

export * from './agent.constants'
// 导出类型
export * from './agent.types'

// 导出处理器
export { ActionRegistry, SSEHandlerRegistry } from './handlers'
export type { IActionHandler, ISSECallbacks, ISSEHandler, ISSEHandlerContext } from './handlers'

// 导出工具（用于扩展）
export { createAgentRefs, createMessageUtils, createWorkflowUtils } from './utils'
export type { IAgentRefs, MessageUtils, WorkflowUtils } from './utils'

// Debug helpers: enable/disable persistent debug replay mode
export function enableDebugReplay() {
  useAgentStore.setState({ debugReplayActive: true })
}

export function disableDebugReplay() {
  useAgentStore.setState({ debugReplayActive: false })
}
