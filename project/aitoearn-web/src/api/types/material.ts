import type { PlatType } from '@/app/config/platConfig'

export interface CreateMaterialGroupParams {
  name: string
  desc?: string
  platforms?: PlatType[]
}

export interface MaterialGroupListFilters {
  title?: string
}

export interface MaterialGroupSceneVo {
  id: string
  name: string
}
