import type { ImageStackPreviewType } from '../types'
import type { IUploadedMedia } from '@/components/Chat/MediaUpload'

export function getAudioDisplayName(media: Pick<IUploadedMedia, 'name' | 'file'>) {
  return media.name ?? media.file?.name ?? ''
}

export function getLocalMediaPreviewSrc(media: IUploadedMedia) {
  return media.url || (media.file ? URL.createObjectURL(media.file) : '')
}

export function getMediaPreviewType(media: IUploadedMedia): ImageStackPreviewType {
  if (media.type === 'audio')
    return 'audio'
  if (media.type === 'video')
    return 'video'
  return 'image'
}
