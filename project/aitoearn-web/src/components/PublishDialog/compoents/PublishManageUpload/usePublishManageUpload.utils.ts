/** 生成任务 ID（优先使用 crypto.randomUUID） */
export function createTaskId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
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

function getFileName(file: Blob, fileName?: string) {
  if (fileName)
    return fileName
  return 'name' in file && typeof file.name === 'string' ? file.name : ''
}

function getFileLastModified(file: Blob) {
  return 'lastModified' in file && typeof file.lastModified === 'number'
    ? file.lastModified
    : 0
}

/** 计算文件轻量指纹（用于去重与缓存键，避免大文件主线程 MD5） */
export function computeFileFingerprint(file: Blob, fileName?: string) {
  return JSON.stringify([
    getFileName(file, fileName),
    file.size,
    getFileLastModified(file),
  ])
}
