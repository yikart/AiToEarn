import type { ImageLoader, ImageLoaderProps, ImageProps, StaticImageData } from 'next/image'
import Image from 'next/image'
import { getOssThumbnailUrl, getOssUrl } from '@/utils/oss'

export type OssImageProps = ImageProps & {
  thumbnailSize?: number
  thumbnailWidth?: number
  thumbnailHeight?: number
  disableOssThumbnail?: boolean
}

const DEVICE_PIXEL_RATIO = 2
const THUMBNAIL_SHARPNESS_SCALE = 1.5
const THUMBNAIL_SHARPNESS_MAX_DIMENSION = 320
const DEFAULT_THUMBNAIL_MAX_DIMENSION = 2048
const MIN_THUMBNAIL_DIMENSION = 16
const SIZE_PIXEL_PATTERN = /(?:^|\s)([1-9]\d*)px(?:\s|$)/

type ResolveOssImageSrcOptions = Pick<ImageProps, 'height' | 'loader' | 'overrideSrc' | 'quality' | 'sizes' | 'width'> & Pick<OssImageProps, 'disableOssThumbnail' | 'thumbnailHeight' | 'thumbnailSize' | 'thumbnailWidth'>

function getThumbnailMaxDimension() {
  const rawValue = process.env.NEXT_PUBLIC_OSS_IMAGE_THUMBNAIL_MAX_WIDTH
  const value = rawValue ? Number(rawValue) : DEFAULT_THUMBNAIL_MAX_DIMENSION
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_THUMBNAIL_MAX_DIMENSION
}

function isThumbnailEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_OSS_IMAGE_THUMBNAIL !== 'false'
}

function isStaticImageImport(src: ImageProps['src']) {
  return typeof src !== 'string'
}

function isLocalOrRuntimeImageSrc(src: string) {
  return src.startsWith('/')
    || src.startsWith('blob:')
    || src.startsWith('data:')
    || src.startsWith('ossProxy')
    || src.startsWith('/ossProxy/')
}

function isSvgImageSrc(src: string) {
  const pathname = src.split(/[?#]/)[0]
  return pathname.toLowerCase().endsWith('.svg')
}

function shouldUseOriginalSrc(src: string, options: ResolveOssImageSrcOptions) {
  if (isLocalOrRuntimeImageSrc(src))
    return true

  if (isSvgImageSrc(src))
    return true

  if (!isThumbnailEnabled())
    return true

  if (options.disableOssThumbnail)
    return true

  if (options.loader)
    return true

  if (options.overrideSrc)
    return true

  return false
}

function getNumericDimension(value: ImageProps['width'] | ImageProps['height']) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0)
    return value

  if (typeof value === 'string') {
    const numericValue = Number.parseFloat(value)
    return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : undefined
  }

  return undefined
}

function getNumericQuality(value: ImageProps['quality']) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0)
    return value

  if (typeof value === 'string') {
    const numericValue = Number.parseFloat(value)
    return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : undefined
  }

  return undefined
}

function shouldSharpenThumbnail(width?: number, height?: number) {
  const dimensions = [width, height].filter((dimension): dimension is number => (
    typeof dimension === 'number' && Number.isFinite(dimension) && dimension > 0
  ))

  if (dimensions.length === 0)
    return false

  return Math.max(...dimensions) < THUMBNAIL_SHARPNESS_MAX_DIMENSION
}

function normalizeThumbnailDimension(value?: number, scale = 1) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0)
    return undefined

  const dimension = Math.ceil(value)
  const scaledDimension = Math.ceil(dimension * scale)

  return Math.min(
    Math.max(scaledDimension, MIN_THUMBNAIL_DIMENSION),
    getThumbnailMaxDimension(),
  )
}

function getLargestPixelSize(sizes?: string) {
  if (!sizes)
    return undefined

  const pixelSizes = sizes
    .split(',')
    .map((size) => {
      const normalizedSize = size.trim()
      const sizeValue = normalizedSize.includes(')')
        ? normalizedSize.slice(normalizedSize.lastIndexOf(')') + 1).trim()
        : normalizedSize
      return SIZE_PIXEL_PATTERN.exec(sizeValue)?.[1]
    })
    .filter((value): value is string => Boolean(value))
    .map(value => Number(value))

  if (pixelSizes.length === 0)
    return undefined

  return Math.max(...pixelSizes)
}

function getRequestedThumbnailDimensions(options: ResolveOssImageSrcOptions) {
  const explicitWidth = options.thumbnailWidth ?? options.thumbnailSize
  const explicitHeight = options.thumbnailHeight ?? options.thumbnailSize

  if (explicitWidth || explicitHeight) {
    const scale = shouldSharpenThumbnail(explicitWidth, explicitHeight) ? THUMBNAIL_SHARPNESS_SCALE : 1

    return {
      width: normalizeThumbnailDimension(explicitWidth, scale),
      height: normalizeThumbnailDimension(explicitHeight, scale),
    }
  }

  const width = getLargestPixelSize(options.sizes) ?? getNumericDimension(options.width)
  const height = getNumericDimension(options.height)
  const thumbnailWidth = width ? width * DEVICE_PIXEL_RATIO : undefined
  const thumbnailHeight = height ? height * DEVICE_PIXEL_RATIO : undefined
  const scale = shouldSharpenThumbnail(thumbnailWidth, thumbnailHeight) ? THUMBNAIL_SHARPNESS_SCALE : 1

  return {
    width: normalizeThumbnailDimension(thumbnailWidth, scale),
    height: normalizeThumbnailDimension(thumbnailHeight, scale),
  }
}

function resolveOssImageSrc(src: ImageProps['src'], options: ResolveOssImageSrcOptions) {
  if (isStaticImageImport(src))
    return src

  if (isLocalOrRuntimeImageSrc(src))
    return src

  const normalizedSrc = getOssUrl(src)
  if (shouldUseOriginalSrc(src, options))
    return normalizedSrc

  const { width, height } = getRequestedThumbnailDimensions(options)
  if (!width && !height)
    return normalizedSrc

  return getOssThumbnailUrl(normalizedSrc, { width, height, quality: getNumericQuality(options.quality) })
}

export function OssImage({
  src,
  thumbnailSize,
  thumbnailWidth,
  thumbnailHeight,
  disableOssThumbnail,
  ...imageProps
}: OssImageProps) {
  return (
    <Image
      {...imageProps}
      src={resolveOssImageSrc(src, {
        ...imageProps,
        disableOssThumbnail,
        thumbnailHeight,
        thumbnailSize,
        thumbnailWidth,
      })}
    />
  )
}

export default OssImage
export { getImageProps } from 'next/image'
export type { ImageLoader, ImageLoaderProps, ImageProps, StaticImageData }
