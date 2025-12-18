/**
 * Agent Store - 处理器模块
 * 
 * 导出所有处理器和注册表
 */

// SSE 消息处理器
export { SSEHandlerRegistry } from './sse.handlers'
export type { ISSEHandler, ISSEHandlerContext, ISSECallbacks } from './sse.handlers'

// 导出单独的 SSE 处理器（用于扩展）
export {
  initHandler,
  keepAliveHandler,
  messageStartHandler,
  toolUseStartHandler,
  textDeltaHandler,
  inputJsonDeltaHandler,
  assistantMessageHandler,
  userMessageHandler,
  textHandler,
  errorHandler,
} from './sse.handlers'

// Action 处理器
export { ActionRegistry } from './action.handlers'
export type { IActionHandler } from './action.handlers'

