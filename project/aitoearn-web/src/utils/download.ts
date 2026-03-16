/**
 * download.ts - 下载工具函数
 * 提供带进度回调的文件下载功能
 */

/**
 * 带进度回调的 fetch 下载
 * 通过 ReadableStream 读取响应体，实时计算下载百分比
 * 无 Content-Length 时降级为无进度下载（直接 blob）
 */
export async function fetchWithProgress(
  url: string,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`)
  }

  const contentLength = response.headers.get('Content-Length')
  // 无 Content-Length 或无 body，降级为直接 blob
  if (!contentLength || !response.body) {
    const blob = await response.blob()
    onProgress?.(100)
    return blob
  }

  const total = Number.parseInt(contentLength, 10)
  let loaded = 0
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []

  while (true) {
    const { done, value } = await reader.read()
    if (done)
      break
    chunks.push(value)
    loaded += value.length
    onProgress?.(Math.round((loaded / total) * 100))
  }

  return new Blob(chunks as BlobPart[])
}
