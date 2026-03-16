/**
 * TaskInstance 模块入口
 *
 * TaskInstance 是任务实例管理的核心类，每个 Agent 任务对应一个独立的实例。
 * 这种设计解决了多任务切换时消息混乱的问题，确保每个任务的状态完全隔离。
 *
 * 目录结构：
 * - task-instance.types.ts: 类型定义
 * - message.handler.ts: 消息处理逻辑
 * - workflow.handler.ts: 工作流处理逻辑
 * - sse.handler.ts: SSE 消息处理逻辑
 * - TaskInstance.ts: 核心类
 *
 * 主要导出：
 * - TaskInstance: 任务实例类
 * - createTaskInstance: 创建任务实例的工厂函数
 * - ITaskInstanceContext: 任务实例上下文接口
 * - ISSECallbacks: SSE 回调接口
 */

// 导出类型
export type {
  IMessageHandlerContext,
  ISSECallbacks,
  ISSEHandlerContext,
  ITaskInstanceContext,
  ITaskInstanceState,
  IWorkflowHandlerContext,
} from './task-instance.types'

// 导出类和工厂函数
export { createTaskInstance, TaskInstance } from './TaskInstance'
