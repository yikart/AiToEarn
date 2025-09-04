export interface GenerateCardParams {
  markdown: string
  theme?: string
  themeMode?: string
  width?: number
  height?: number
  splitMode?: string
  mdxMode?: boolean
  overHiddenMode?: boolean
}

export interface GenerateCardResult {
  images: {
    url: string
    fileName: string
  }[]
}
