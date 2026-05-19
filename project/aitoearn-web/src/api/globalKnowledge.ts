import http from '@/utils/request'

export type GlobalKnowledgeCategory = 'offer' | 'case' | 'faq' | 'boundary' | 'tone'

export type GlobalKnowledgeScope = 'global' | 'account' | 'campaign'

export interface GlobalKnowledgeItem {
  id: string
  title: string
  category: GlobalKnowledgeCategory
  scope: GlobalKnowledgeScope
  summary: string
  replyUse: string
  updatedAt: string
  enabled: boolean
  tags: string[]
}

export interface UpsertGlobalKnowledgeRequest {
  title: string
  category: GlobalKnowledgeCategory
  scope: GlobalKnowledgeScope
  summary: string
  replyUse: string
  tags: string[]
  enabled: boolean
}

export const globalKnowledgeApi = {
  list() {
    return http.get<GlobalKnowledgeItem[]>('knowledge-base')
  },
  create(data: UpsertGlobalKnowledgeRequest) {
    return http.post<GlobalKnowledgeItem>('knowledge-base', data)
  },
  update(id: string, data: UpsertGlobalKnowledgeRequest) {
    return http.post<GlobalKnowledgeItem>(`knowledge-base/${id}`, data)
  },
  toggle(id: string, enabled: boolean) {
    return http.post<{ success: boolean }>(`knowledge-base/${id}/toggle`, { enabled })
  },
  delete(id: string) {
    return http.delete<{ success: boolean }>(`knowledge-base/${id}`)
  },
}
