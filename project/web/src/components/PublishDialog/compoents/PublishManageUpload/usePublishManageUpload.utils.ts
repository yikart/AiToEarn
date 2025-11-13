import CryptoJS from 'crypto-js'

/** 生成任务 ID（优先使用 crypto.randomUUID） */
export function createTaskId() {
  if (
    typeof crypto !== 'undefined'
    && typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }
  return `upload_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

/** 判断是否为中断错误 */
export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === 'AbortError'
  }
  return Boolean((error as { name?: string })?.name === 'AbortError')
}

/** 计算文件 MD5（用于去重与缓存键） */
export async function computeFileMd5(file: Blob): Promise<string> {
  const buffer = await file.arrayBuffer()
  const wordArray = CryptoJS.lib.WordArray.create(new Uint8Array(buffer))
  return CryptoJS.MD5(wordArray).toString()
}
