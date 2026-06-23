/**
 * common.ts - 跨业务基础工具函数
 */

/**
 * 生成唯一 ID。
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const randomValue = (Math.random() * 16) | 0
    const uuidValue = char === 'x' ? randomValue : (randomValue & 0x3) | 0x8
    return uuidValue.toString(16)
  })
}

/**
 * 等待指定毫秒数。
 */
export function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

/**
 * 获取文件路径中的文件名和后缀。
 */
export function getFilePathName(path: string) {
  if (!path) {
    return {
      filename: '',
      suffix: '',
    }
  }

  const pathByBackslash = path.split('\\')
  const pathWithoutBackslash = pathByBackslash[pathByBackslash.length - 1]
  const pathBySlash = pathWithoutBackslash.split('/')
  const filename = pathBySlash[pathBySlash.length - 1]

  return {
    filename,
    suffix: filename.split('.')[filename.split('.').length - 1],
  }
}

/**
 * 提取字符串中的话题，并返回去除话题后的文本。
 */
export function parseTopicString(input: string): {
  topics: string[]
  cleanedString: string
} {
  const extractedParts = input.match(/#(\S+)/g) || []
  let cleanedString = input

  extractedParts.forEach((part) => {
    cleanedString = cleanedString.replace(part, '').trim()
  })

  const topics = extractedParts.map((part) => {
    const match = part.match(/#(\S+)/)
    return match ? match[1] : ''
  })

  return { topics, cleanedString }
}
