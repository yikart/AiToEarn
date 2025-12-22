/**
 * 任务状态检测工具
 * 用于判断任务是否已完成
 *
 * 优先使用任务的整体状态字段（status）来判断是否完成，
 * 避免仅依赖 message_stop 等局部事件（这些事件可能出现多次或只表示某一轮对话结束）。
 */
import type { TaskDetail, TaskMessage } from '@/api/agent'
import { TaskStatus } from '@/api/agent'

// 认为这些状态表示任务已结束（不再需要轮询）
// 同时支持大写和小写格式（兼容后端返回的格式）
const COMPLETED_STATUS_VALUES = [
  'completed',
  'COMPLETED',
  'failed',
  'FAILED',
  'cancelled',
  'CANCELLED',
  'requires_action', // 需要用户操作也算完成（停止轮询）
  'error',
]

/**
 * 根据 TaskDetail 的 status 判断任务是否完成
 */
export function isTaskCompletedByStatus(task: Pick<TaskDetail, 'status'> | null | undefined): boolean {
  if (!task) return false
  const statusValue = task.status as string
  return COMPLETED_STATUS_VALUES.includes(statusValue?.toLowerCase()) || 
         COMPLETED_STATUS_VALUES.includes(statusValue)
}

/**
 * 兼容旧逻辑：根据消息列表粗略判断任务是否完成
 * 仅在没有 status 信息时作为兜底使用
 */
export function isTaskCompletedByMessages(messages: TaskMessage[]): boolean {
  if (!messages || messages.length === 0) {
    return false
  }

  // 从后往前遍历消息，检查是否有完成标志
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]

    // 检查 stream_event 类型的消息
    if (msg.type === 'stream_event') {
      const streamEvent = msg as any
      const event = streamEvent.event

      // message_delta 中 stop_reason === 'end_turn' 表示一轮对话结束
      if (event?.type === 'message_delta' && event?.delta?.stop_reason === 'end_turn') {
        return true
      }
    }
  }

  return false
}

/**
 * 统一对外导出的方法：优先看 status，其次兜底看 messages
 */
export function isTaskCompleted(
  messages: TaskMessage[],
  task?: Pick<TaskDetail, 'status'> | null,
): boolean {
  if (task && isTaskCompletedByStatus(task)) {
    return true
  }
  return isTaskCompletedByMessages(messages)
}

