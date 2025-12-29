/**
 * Agent Store - 处理器模块
 *
 * 导出所有处理器和注册表
 */

// Action 处理器
export { ActionRegistry } from './action.handlers'
export type { IActionHandler } from './action.handlers'

// SSE 消息处理器
export { SSEHandlerRegistry } from './sse.handlers'

export type { ISSECallbacks, ISSEHandler, ISSEHandlerContext } from './sse.handlers'
// 导出单独的 SSE 处理器（用于扩展）
export {
  assistantMessageHandler,
  errorHandler,
  initHandler,
  inputJsonDeltaHandler,
  keepAliveHandler,
  messageStartHandler,
  textDeltaHandler,
  textHandler,
  toolUseStartHandler,
  userMessageHandler,
} from './sse.handlers'
