export interface WorkLinkInfo {
  dataId: string
  uniqueId: string
  type: string
  videoType?: 'short' | 'long'
}

export interface WorkDetailInfo {
  dataId: string
  title?: string
  desc?: string
  topics?: string[]
  coverUrl?: string
  videoUrl?: string
  imgUrlList?: string[]
  publishTime?: Date
  type: string
  videoType?: 'short' | 'long'
  duration?: number
  rawData?: Record<string, unknown>
}
