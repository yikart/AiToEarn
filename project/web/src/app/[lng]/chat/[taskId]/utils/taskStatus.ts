/**
 * 任务状态检测工具
 * 用于判断任务是否已完成
 */
import type { TaskMessage } from '@/api/agent'

/**
 * 检测任务是否已完成
 * 根据消息列表判断任务状态：
 * - 存在 stream_event 且 event.type === 'message_stop' 表示任务完成
 * - 存在 message_delta 且 stop_reason === 'end_turn' 表示任务完成
 * @param messages 任务消息列表
 * @returns 是否已完成
 */
export function isTaskCompleted(messages: TaskMessage[]): boolean {
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

      // message_stop 表示任务完成
      if (event?.type === 'message_stop') {
        return true
      }

      // message_delta 中 stop_reason === 'end_turn' 表示任务完成
      if (event?.type === 'message_delta' && event?.delta?.stop_reason === 'end_turn') {
        return true
      }
    }
  }

  return false
}

