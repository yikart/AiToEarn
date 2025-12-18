// 获取完整的OSS URL
export function getOssUrl(path?: string) {
  if (!path)
    return ''
  if (path.startsWith('http') || path.startsWith('https') || path.startsWith('ossProxy'))
    return path
  return `${process.env.NEXT_PUBLIC_OSS_URL_PROXY}${path}`
}
