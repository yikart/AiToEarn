import { getFilePathName } from '@/utils/common'

export function getDraftBoxMediaFileName(url: string) {
  const filename = getFilePathName(url).filename
  if (!filename)
    return url

  try {
    return decodeURIComponent(filename)
  }
  catch {
    return filename
  }
}
