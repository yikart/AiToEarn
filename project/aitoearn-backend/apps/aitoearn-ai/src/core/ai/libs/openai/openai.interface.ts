export interface SoraCreateCharacterRequest {
  model: 'sora-2-character'
  url?: string
  taskId?: string
  timestamps: string
  prompt: string
}

export interface SoraCharacterResponse {
  id: string
  object: 'character'
  model: 'sora-2-character'
  status: 'queued' | 'processing' | 'completed' | 'failed'
  username: string
  avatar_url?: string
  video_url?: string
  created_at: number
  completed_at?: number
  error?: { code: number, message: string }
}
