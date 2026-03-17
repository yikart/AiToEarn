/** 从 unknown error 提取 message */
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** 从 unknown error 提取 stack */
export function getErrorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined
}

/** 提取 message + stack，用于结构化日志 */
export function getErrorDetail(error: unknown): { message: string, stack: string | undefined } {
  return error instanceof Error
    ? { message: error.message, stack: error.stack }
    : { message: String(error), stack: undefined }
}

/** 序列化 error 为 JSON（保留 Error 不可枚举属性） */
export function stringifyError(error: unknown): string {
  return error instanceof Error
    ? JSON.stringify(error, Object.getOwnPropertyNames(error))
    : JSON.stringify(error)
}
