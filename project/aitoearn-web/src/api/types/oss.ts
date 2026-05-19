/**
 * 资源类型
 */
export enum AssetType {
  AgentSession = 'agentSession',
  AiCard = 'aiCard',
  AiChatImage = 'aiChatImage',
  AiImage = 'aiImage',
  AiVideo = 'aiVideo',
  AideoOutput = 'aideoOutput',
  Avatar = 'avatar',
  DramaRecap = 'dramaRecap',
  StyleTransfer = 'styleTransfer',
  Temp = 'temp',
  UserFile = 'userFile',
  UserMedia = 'userMedia',
  VideoEdit = 'videoEdit',
}

export interface UploadToOssOptions {
  onProgress?: (prog: number) => void
  publicUploadId?: string
  signal?: AbortSignal
}

export interface UploadSignData {
  id: string
  url: string
  uploadUrl: string
}

export interface ConfirmUploadData {
  url?: string
}
