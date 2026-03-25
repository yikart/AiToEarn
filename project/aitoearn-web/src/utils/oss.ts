// 获取完整的OSS URL
export function getOssUrl(path?: string) {
  if (!path)
    return ''
  if (path.startsWith('http') || path.startsWith('https') || path.startsWith('blob:http'))
    return path
  return path
}
