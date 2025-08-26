export interface MaterialDetail {
  id: string
  taskId: string
  type: string
  title?: string
  description?: string
  tags?: string[]
  aiPrompt?: string
  priority?: number
  content?: string
  status: string
  createdAt: Date
  updatedAt: Date
}
