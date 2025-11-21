export interface Template {
  id: number
  created_at: string
  updated_at: string
  name: string
  body: string
  body_source: string | null
  type: 'campaign' | 'campaign_visual' | 'tx'
  is_default: boolean
  subject?: string
}
