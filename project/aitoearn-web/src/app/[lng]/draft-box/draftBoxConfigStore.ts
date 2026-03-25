/**
 * DraftBoxConfigStore - 按草稿箱隔离的 AI 批量生成配置
 * 每个草稿箱（按 groupId 区分）有独立的持久化配置
 */

import type { DraftContentType, VideoModelType } from '@/api/draftGeneration'
import type { PlatType } from '@/app/config/platConfig'
import { createPersistStore } from '@/utils/createPersistStore'

/** 可序列化的媒体信息（持久化用） */
export interface IPersistedMedia {
  id: string
  url: string
  type: 'image' | 'video'
  name?: string
  /** 视频时长，用于恢复后的时长校验 */
  duration?: number
}

/** 单个草稿箱的生成配置 */
export interface DraftBoxConfig {
  aspectRatio: string
  duration: number
  quantity: number
  modelType: VideoModelType
  contentType: DraftContentType
  imageModel: string
  imageCount: number
  imageSize: string
  selectedPlatforms: PlatType[]
  /** 用户上传的媒体持久化 */
  persistedMedias: IPersistedMedia[]
  /** 品牌图片选择 */
  selectedImageIds: string[]
  /** AI 生成描述 */
  promptValue: string
  /** 是否为草稿模式（true=生成完整草稿，false=仅生成视频/图片） */
  isDraftMode: boolean
  /** 关联的品牌 ID，用于检测品牌切换后重新应用默认值 */
  linkedBrandId: string
}

/** 默认配置（与原 systemStore 一致） */
const DEFAULT_CONFIG: DraftBoxConfig = {
  aspectRatio: '9:16',
  duration: 8,
  quantity: 1,
  modelType: '' as VideoModelType,
  contentType: 'video',
  imageModel: 'nb2',
  imageCount: 3,
  imageSize: '1K',
  selectedPlatforms: [],
  persistedMedias: [],
  selectedImageIds: [],
  promptValue: '',
  isDraftMode: true,
  linkedBrandId: '',
}

interface IDraftBoxConfigStore {
  configs: Record<string, DraftBoxConfig>
}

const state: IDraftBoxConfigStore = {
  configs: {},
}

export const useDraftBoxConfigStore = createPersistStore(
  { ...state },
  (set, get) => ({
    /** 获取指定 groupId 的配置，不存在时返回默认值 */
    getConfig(groupId: string): DraftBoxConfig {
      return get().configs[groupId] ?? { ...DEFAULT_CONFIG }
    },

    /** 合并更新指定 groupId 的配置 */
    updateConfig(groupId: string, partial: Partial<DraftBoxConfig>) {
      const current = get().configs[groupId] ?? { ...DEFAULT_CONFIG }
      set({
        configs: {
          ...get().configs,
          [groupId]: { ...current, ...partial },
        },
      })
    },

    /** 重置指定 groupId 的配置为默认值 */
    resetConfig(groupId: string) {
      set({
        configs: {
          ...get().configs,
          [groupId]: { ...DEFAULT_CONFIG },
        },
      })
    },
  }),
  {
    name: 'DraftBoxConfig',
    version: 7,
    migrate(persistedState: any, version: number) {
      if (version < 2) {
        // v1 → v2: 给已有配置补 persistedMedias 字段
        const configs = persistedState.configs ?? {}
        for (const key of Object.keys(configs)) {
          if (!configs[key].persistedMedias) {
            configs[key].persistedMedias = []
          }
        }
        persistedState.configs = configs
      }
      if (version < 3) {
        // v2 → v3: 给已有配置补 selectedImageIds 字段
        const configs = persistedState.configs ?? {}
        for (const key of Object.keys(configs)) {
          if (!configs[key].selectedImageIds) {
            configs[key].selectedImageIds = []
          }
        }
        persistedState.configs = configs
      }
      if (version < 4) {
        // v3 → v4: 给已有配置补 promptValue 字段
        const configs = persistedState.configs ?? {}
        for (const key of Object.keys(configs)) {
          if (configs[key].promptValue === undefined) {
            configs[key].promptValue = ''
          }
        }
        persistedState.configs = configs
      }
      if (version < 6) {
        // v5 → v6: 给已有配置补 isDraftMode 字段
        const configs = persistedState.configs ?? {}
        for (const key of Object.keys(configs)) {
          if (configs[key].isDraftMode === undefined) {
            configs[key].isDraftMode = true
          }
        }
        persistedState.configs = configs
      }
      if (version < 7) {
        // v6 → v7: 给已有配置补 linkedBrandId 字段
        const configs = persistedState.configs ?? {}
        for (const key of Object.keys(configs)) {
          if (configs[key].linkedBrandId === undefined) {
            configs[key].linkedBrandId = ''
          }
        }
        persistedState.configs = configs
      }
      return persistedState
    },
  },
  'indexedDB',
)
