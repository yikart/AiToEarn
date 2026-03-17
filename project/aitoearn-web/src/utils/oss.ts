// 获取完整的OSS URL
export function getOssUrl(path?: string) {
  if (!path)
    return ''
  if (path.startsWith('http') || path.startsWith('https') || path.startsWith('ossProxy') || path.startsWith('blob:http'))
    return path
  return `${process.env.NEXT_PUBLIC_OSS_URL}${path}`
}

// 将完整的oss url转为代理的 oss url
export function getOssProxyPath(ossUrl?: string) {
  if (!ossUrl)
    return ''

  return ossUrl?.replace(
    process.env.NEXT_PUBLIC_OSS_URL ?? '',
    process.env.NEXT_PUBLIC_OSS_URL_PROXY ?? '',
  )
}
