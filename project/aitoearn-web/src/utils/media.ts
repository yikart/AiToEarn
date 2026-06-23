/**
 * media.ts - 媒体文件工具函数
 */

import type { Options as ImageCompressionOptions } from 'browser-image-compression'

const IMAGE_UPLOAD_COMPRESSION_THRESHOLD = 1024 * 1024
const IMAGE_UPLOAD_MAX_SIZE_MB = 1
const IMAGE_UPLOAD_MAX_WIDTH_OR_HEIGHT = 2560
const IMAGE_UPLOAD_INITIAL_QUALITY = 0.92

const COMPRESSIBLE_UPLOAD_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
])

const FALLBACK_IMAGE_FILE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'avif', 'heic', 'heif']
const FALLBACK_VIDEO_FILE_EXTENSIONS = ['mp4', 'mov', 'm4v', 'webm', 'avi', 'mkv']
const FALLBACK_AUDIO_FILE_EXTENSIONS = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac']

export type MediaFileType = 'image' | 'video' | 'audio' | 'document'

export interface MediaFileTypeOptions {
  imageFormats?: string[]
  videoFormats?: string[]
  audioFormats?: string[]
}

export interface MediaAcceptOptions extends MediaFileTypeOptions {
  canUploadImage: boolean
  canUploadVideo: boolean
  canUploadAudio: boolean
}

export interface OptimizeImageForUploadOptions {
  signal?: AbortSignal
}

function normalizeMediaFormat(format: string) {
  return format.trim().replace(/^\./, '').toLowerCase()
}

function normalizeMediaFormats(formats?: string[]) {
  return formats?.map(normalizeMediaFormat).filter(Boolean) ?? []
}

function includesMediaExtension(extension: string, formats: string[]) {
  return extension.length > 0 && formats.includes(extension)
}

function getMediaFileExtension(fileOrName: Pick<File, 'name'> | string) {
  const name = (typeof fileOrName === 'string' ? fileOrName : fileOrName.name).toLowerCase()
  const dotIndex = name.lastIndexOf('.')
  return dotIndex >= 0 ? name.slice(dotIndex + 1) : ''
}

export function isMediaFileFormatAllowed(file: Pick<File, 'name'>, formats?: string[]) {
  const normalizedFormats = normalizeMediaFormats(formats)
  if (normalizedFormats.length === 0)
    return true

  return includesMediaExtension(getMediaFileExtension(file), normalizedFormats)
}

export function getMediaTypeFromFile(file: File, options: MediaFileTypeOptions = {}): MediaFileType {
  const contentType = file.type.toLowerCase()
  if (contentType.startsWith('image/'))
    return 'image'
  if (contentType.startsWith('video/'))
    return 'video'
  if (contentType.startsWith('audio/'))
    return 'audio'

  const extension = getMediaFileExtension(file)
  if (includesMediaExtension(extension, normalizeMediaFormats(options.imageFormats ?? FALLBACK_IMAGE_FILE_EXTENSIONS)))
    return 'image'
  if (includesMediaExtension(extension, normalizeMediaFormats(options.videoFormats ?? FALLBACK_VIDEO_FILE_EXTENSIONS)))
    return 'video'
  if (includesMediaExtension(extension, normalizeMediaFormats(options.audioFormats ?? FALLBACK_AUDIO_FILE_EXTENSIONS)))
    return 'audio'

  return 'document'
}

function toAcceptExtension(format: string) {
  const normalizedFormat = normalizeMediaFormat(format)
  return normalizedFormat ? `.${normalizedFormat}` : ''
}

function appendAcceptTypes(target: string[], formats: string[] | undefined, fallback: string) {
  const extensions = normalizeMediaFormats(formats).map(toAcceptExtension).filter(Boolean)
  target.push(...(extensions.length > 0 ? extensions : [fallback]))
}

export function buildMediaAcceptTypes(options: MediaAcceptOptions) {
  const acceptTypes: string[] = []
  if (options.canUploadImage)
    appendAcceptTypes(acceptTypes, options.imageFormats, 'image/*')
  if (options.canUploadVideo)
    appendAcceptTypes(acceptTypes, options.videoFormats, 'video/*')
  if (options.canUploadAudio)
    appendAcceptTypes(acceptTypes, options.audioFormats, 'audio/*')

  return Array.from(new Set(acceptTypes)).join(',')
}

function getUploadImageFileExtension(contentType: string) {
  if (contentType === 'image/png')
    return '.png'
  if (contentType === 'image/webp')
    return '.webp'
  if (contentType === 'image/jpeg' || contentType === 'image/jpg')
    return '.jpg'

  return ''
}

function getUploadImageFileName(file: File | Blob) {
  if ('name' in file && typeof file.name === 'string' && file.name)
    return file.name

  return `image_${Date.now()}${getUploadImageFileExtension(file.type)}`
}

function getCompressionFileType(contentType: string) {
  return contentType === 'image/jpg' ? 'image/jpeg' : contentType
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

function shouldOptimizeImageForUpload(file: File | Blob) {
  return file.size > IMAGE_UPLOAD_COMPRESSION_THRESHOLD
    && COMPRESSIBLE_UPLOAD_IMAGE_TYPES.has(file.type.toLowerCase())
}

function toImageCompressionFile(file: File | Blob) {
  if (typeof File === 'undefined')
    return null

  if (file instanceof File)
    return file

  return new File([file], getUploadImageFileName(file), {
    type: getCompressionFileType(file.type),
    lastModified: Date.now(),
  })
}

/** 上传前优化图片：超过 1MB 的 jpeg/png/webp 会限制最长边并尽量压缩到 1MB 内 */
export async function optimizeImageForUpload(file: File | Blob, options?: OptimizeImageForUploadOptions) {
  if (!shouldOptimizeImageForUpload(file) || typeof window === 'undefined')
    return file

  if (options?.signal?.aborted)
    throw new DOMException('上传已取消', 'AbortError')

  const compressionFile = toImageCompressionFile(file)
  if (!compressionFile)
    return file

  try {
    const { default: imageCompression } = await import('browser-image-compression')
    const compressionOptions: ImageCompressionOptions = {
      maxSizeMB: IMAGE_UPLOAD_MAX_SIZE_MB,
      maxWidthOrHeight: IMAGE_UPLOAD_MAX_WIDTH_OR_HEIGHT,
      initialQuality: IMAGE_UPLOAD_INITIAL_QUALITY,
      useWebWorker: false,
      fileType: getCompressionFileType(compressionFile.type),
      signal: options?.signal,
    }
    const compressedFile = await imageCompression(compressionFile, compressionOptions)

    return compressedFile.size < file.size ? compressedFile : file
  }
  catch (error) {
    if (options?.signal?.aborted)
      throw new DOMException('上传已取消', 'AbortError')
    if (isAbortError(error))
      throw error

    console.warn('图片压缩失败，使用原图上传:', error)
    return file
  }
}

/** 获取音频文件时长（秒），通过临时 audio 元素读取 metadata */
export function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement('audio')
    audio.preload = 'metadata'

    const cleanup = () => {
      URL.revokeObjectURL(audio.src)
      audio.remove()
    }

    audio.onloadedmetadata = () => {
      const duration = audio.duration
      cleanup()
      resolve(Math.round(duration * 10) / 10)
    }

    audio.onerror = () => {
      cleanup()
      reject(new Error('Failed to load audio metadata'))
    }

    audio.src = URL.createObjectURL(file)
  })
}

/** 获取视频元信息：时长 + 宽高 */
export function getVideoMeta(file: File): Promise<{ duration: number, width: number, height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    const cleanup = () => { URL.revokeObjectURL(video.src); video.remove() }
    video.onloadedmetadata = () => {
      resolve({
        duration: Math.round(video.duration * 10) / 10,
        width: video.videoWidth,
        height: video.videoHeight,
      })
      cleanup()
    }
    video.onerror = () => { cleanup(); reject(new Error('Failed to load video metadata')) }
    video.src = URL.createObjectURL(file)
  })
}

/** 从本地视频文件提取封面（data URL）和时长 */
export function getVideoInfo(file: File): Promise<{ coverUrl: string, duration: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'auto'
    const blobUrl = URL.createObjectURL(file)
    video.src = blobUrl

    const cleanup = () => {
      URL.revokeObjectURL(blobUrl)
      video.remove()
    }

    video.onloadedmetadata = () => {
      video.currentTime = 0.1
    }

    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')!.drawImage(video, 0, 0)
      const coverUrl = canvas.toDataURL('image/jpeg', 0.7)
      const duration = Math.round(video.duration * 10) / 10
      cleanup()
      resolve({ coverUrl, duration })
    }

    video.onerror = () => {
      cleanup()
      reject(new Error('Failed to load video'))
    }
  })
}

/** 格式化视频时长为 M:SS */
export function formatVideoDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
