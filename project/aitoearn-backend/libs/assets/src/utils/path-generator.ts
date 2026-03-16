import type { UserType } from '@yikart/common'
import { AssetType } from '@yikart/mongodb'
import dayjs from 'dayjs'
import { extension } from 'mime-types'
import { nanoid } from 'nanoid'

export interface PathGeneratorOptions {
  userId: string
  userType?: UserType
  type: AssetType
  mimeType: string
  filename?: string
  subPath?: string
}

const TYPE_PATH_MAP: Record<AssetType, string> = {
  [AssetType.AiImage]: 'ai/images',
  [AssetType.AiVideo]: 'ai/video',
  [AssetType.AiCard]: 'ai/cards',
  [AssetType.AiChatImage]: 'ai/chat-images',
  [AssetType.AideoOutput]: 'agent/aideo',
  [AssetType.VideoEdit]: 'agent/video-edit',
  [AssetType.DramaRecap]: 'agent/drama-recap',
  [AssetType.StyleTransfer]: 'agent/style-transfer',
  [AssetType.UserMedia]: 'user/media',
  [AssetType.UserFile]: 'user/files',
  [AssetType.PublishMedia]: 'publish/media',
  [AssetType.Avatar]: 'social/avatar',
  [AssetType.AgentSession]: 'claude-session',
  [AssetType.VideoThumbnail]: 'ai/video-thumbnail',
  [AssetType.Temp]: 'temp',
  [AssetType.ImageEdit]: 'agent/image-edit',
  [AssetType.Subtitle]: 'agent/subtitle',
}

export function generateAssetPath(options: PathGeneratorOptions): string {
  const { userId, type, mimeType, subPath } = options

  const basePath = TYPE_PATH_MAP[type] || 'misc'
  const datePath = dayjs().format('YYYYMM')
  const ext = extension(mimeType) || 'bin'
  const uniqueId = nanoid()

  const parts = [userId, basePath]

  if (subPath) {
    parts.push(subPath)
  }

  parts.push(datePath)
  parts.push(`${uniqueId}.${ext}`)

  return parts.join('/')
}

export function generateAssetPathFromFilename(options: PathGeneratorOptions): string {
  const { userId, type, filename, subPath } = options

  const basePath = TYPE_PATH_MAP[type] || 'misc'
  const datePath = dayjs().format('YYYYMM')
  const uniquePrefix = Date.now().toString(36)
  const safeName = filename ? filename.replace(/[^a-z0-9.-]/gi, '_') : nanoid()

  const parts = [userId, basePath]

  if (subPath) {
    parts.push(subPath)
  }

  parts.push(datePath)
  parts.push(`${uniquePrefix}-${safeName}`)

  return parts.join('/')
}
