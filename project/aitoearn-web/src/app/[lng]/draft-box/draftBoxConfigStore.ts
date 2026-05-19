/**
 * DraftBoxConfigStore - 按草稿箱隔离的 AI 批量生成配置
 * 每个草稿箱（按 groupId 区分）有独立的持久化配置
 */

import type { DraftContentType, VideoModelType } from '@/api/draftGeneration'
import type { MaterialGenerationParams } from '@/app/[lng]/brand-promotion/brandPromotionStore/types'
import type { PlatType } from '@/app/config/platConfig'
import isEqual from 'lodash/isEqual'
import { generateUUID } from '@/utils'
import { createPersistStore } from '@/utils/createPersistStore'
import { getOssUrl } from '@/utils/oss'
import { stripCaptionPromptSystemRequirement, stripDraftPromptLimits } from './utils/promptLimits'

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
  resolution: string
  quantity: number
  modelType: VideoModelType
  selectedVideoModels: VideoModelType[]
  contentType: DraftContentType
  imageModel: string
  selectedImageModels: string[]
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
  /** 文案生成提示词，用于标题、描述和话题 */
  captionPrompt: string
  /** 文案要求区域是否展开 */
  captionPromptOpen: boolean
  /** 系统内置文案要求，默认根据平台限制动态生成，支持用户覆盖 */
  captionSystemPrompt: string
  /** 最近一次系统内置文案要求默认值，用于判断是否跟随动态默认值更新 */
  captionSystemPromptDefault: string
}

/** 默认配置（与原 systemStore 一致） */
const DEFAULT_CONFIG: DraftBoxConfig = {
  aspectRatio: '9:16',
  duration: 8,
  resolution: '',
  quantity: 1,
  modelType: '' as VideoModelType,
  selectedVideoModels: [],
  contentType: 'video',
  imageModel: 'nb2',
  selectedImageModels: [],
  imageCount: 3,
  imageSize: '1K',
  selectedPlatforms: [],
  persistedMedias: [],
  selectedImageIds: [],
  promptValue: '',
  isDraftMode: true,
  linkedBrandId: '',
  captionPrompt: '',
  captionPromptOpen: true,
  captionSystemPrompt: '',
  captionSystemPromptDefault: '',
}

interface IDraftBoxConfigStore {
  configs: Record<string, DraftBoxConfig>
}

const state: IDraftBoxConfigStore = {
  configs: {},
}

const pendingConfigUpdates = new Map<string, Partial<DraftBoxConfig>>()
let pendingFlushScheduled = false

function normalizePersistedMedias(params: MaterialGenerationParams): IPersistedMedia[] {
  const dedupedMedias = new Map<string, IPersistedMedia>()

  params.imageUrls?.forEach((url) => {
    const normalizedUrl = getOssUrl(url)
    dedupedMedias.set(`image:${normalizedUrl}`, {
      id: generateUUID(),
      url: normalizedUrl,
      type: 'image',
    })
  })

  params.videoUrls?.forEach((url) => {
    const normalizedUrl = getOssUrl(url)
    dedupedMedias.set(`video:${normalizedUrl}`, {
      id: generateUUID(),
      url: normalizedUrl,
      type: 'video',
    })
  })

  return [...dedupedMedias.values()]
}

function inferContentType(params: MaterialGenerationParams, current: DraftBoxConfig): DraftContentType {
  if (params.imageModel || params.imageCount || params.imageSize) {
    return 'image_text'
  }

  if (params.model || params.resolution || params.videoUrls?.length) {
    return 'video'
  }

  return current.contentType
}

function queueConfigUpdate(
  get: () => IDraftBoxConfigStore,
  set: (
    partial:
      | IDraftBoxConfigStore
      | Partial<IDraftBoxConfigStore>
      | ((state: IDraftBoxConfigStore) => IDraftBoxConfigStore | Partial<IDraftBoxConfigStore>),
  ) => void,
  groupId: string,
  partial: Partial<DraftBoxConfig>,
) {
  const configs = get().configs
  const current = configs[groupId] ?? { ...DEFAULT_CONFIG }
  const pendingPartial = pendingConfigUpdates.get(groupId) ?? {}
  const mergedCurrent = { ...current, ...pendingPartial }
  const hasChanges = Object.entries(partial).some(([key, value]) => {
    return !isEqual(mergedCurrent[key as keyof DraftBoxConfig], value)
  })

  if (!hasChanges) {
    return
  }

  pendingConfigUpdates.set(groupId, { ...pendingPartial, ...partial })

  if (pendingFlushScheduled) {
    return
  }

  pendingFlushScheduled = true
  queueMicrotask(() => {
    pendingFlushScheduled = false

    const latestConfigs = get().configs
    let hasAnyConfigChanged = false
    const nextConfigs = { ...latestConfigs }

    pendingConfigUpdates.forEach((queuedPartial, queuedGroupId) => {
      const latestCurrent = latestConfigs[queuedGroupId] ?? { ...DEFAULT_CONFIG }
      const queuedHasChanges = Object.entries(queuedPartial).some(([key, value]) => {
        return !isEqual(latestCurrent[key as keyof DraftBoxConfig], value)
      })

      if (!queuedHasChanges) {
        return
      }
      nextConfigs[queuedGroupId] = { ...latestCurrent, ...queuedPartial }
      hasAnyConfigChanged = true
    })

    pendingConfigUpdates.clear()

    if (!hasAnyConfigChanged) {
      return
    }

    set({
      configs: nextConfigs,
    })
  })
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
      queueConfigUpdate(get, set, groupId, partial)
    },

    /** 将历史生成参数回填到当前草稿箱输入配置 */
    applyGenerationParams(groupId: string, params: MaterialGenerationParams) {
      const current = get().configs[groupId] ?? { ...DEFAULT_CONFIG }
      const nextContentType = inferContentType(params, current)
      const nextDraftMode = params.draftType
        ? params.draftType === 'draft'
        : current.isDraftMode
      const nextCaptionPrompt = stripCaptionPromptSystemRequirement(params.captionPrompt ?? '')

      queueConfigUpdate(get, set, groupId, {
        promptValue: params.prompt ? stripDraftPromptLimits(params.prompt) : '',
        aspectRatio: params.aspectRatio ?? current.aspectRatio,
        duration: params.duration ?? current.duration,
        resolution: nextContentType === 'video'
          ? (params.resolution ?? current.resolution)
          : current.resolution,
        contentType: nextContentType,
        modelType: nextContentType === 'video'
          ? (params.model ?? current.modelType)
          : current.modelType,
        selectedVideoModels: nextContentType === 'video' && params.model
          ? [params.model]
          : current.selectedVideoModels,
        imageModel: nextContentType === 'image_text'
          ? (params.imageModel ?? current.imageModel)
          : current.imageModel,
        selectedImageModels: nextContentType === 'image_text' && params.imageModel
          ? [params.imageModel]
          : current.selectedImageModels,
        imageCount: nextContentType === 'image_text'
          ? (params.imageCount ?? current.imageCount)
          : current.imageCount,
        imageSize: nextContentType === 'image_text'
          ? (params.imageSize ?? current.imageSize)
          : current.imageSize,
        selectedPlatforms: params.platforms ? [...params.platforms] : [],
        persistedMedias: normalizePersistedMedias(params),
        selectedImageIds: [],
        isDraftMode: nextDraftMode,
        captionPrompt: nextCaptionPrompt,
        captionPromptOpen: nextDraftMode ? (Boolean(nextCaptionPrompt) || current.captionPromptOpen) : false,
      })
    },

    /** 追加持久化媒体，按 type + url 去重，保留原有顺序 */
    appendPersistedMedias(groupId: string, medias: IPersistedMedia[]) {
      const current = get().configs[groupId] ?? { ...DEFAULT_CONFIG }
      const existingMedias = current.persistedMedias ?? []
      if (medias.length === 0) {
        return { added: 0, total: existingMedias.length }
      }

      const mergedMedias = [...existingMedias]
      const existingKeys = new Set(existingMedias.map(media => `${media.type}:${media.url}`))
      let added = 0

      medias.forEach((media) => {
        const mediaKey = `${media.type}:${media.url}`
        if (existingKeys.has(mediaKey)) {
          return
        }

        mergedMedias.push(media)
        existingKeys.add(mediaKey)
        added += 1
      })

      if (added === 0) {
        return { added: 0, total: mergedMedias.length }
      }

      set({
        configs: {
          ...get().configs,
          [groupId]: {
            ...current,
            persistedMedias: mergedMedias,
          },
        },
      })

      return { added, total: mergedMedias.length }
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
    version: 11,
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
      if (version < 8) {
        // v7 → v8: 给已有配置补 resolution 字段
        const configs = persistedState.configs ?? {}
        for (const key of Object.keys(configs)) {
          if (configs[key].resolution === undefined) {
            configs[key].resolution = ''
          }
        }
        persistedState.configs = configs
      }
      if (version < 9) {
        // v8 → v9: 给已有配置补 captionPrompt 字段
        const configs = persistedState.configs ?? {}
        for (const key of Object.keys(configs)) {
          if (configs[key].captionPrompt === undefined) {
            configs[key].captionPrompt = ''
          }
        }
        persistedState.configs = configs
      }
      if (version < 10) {
        // v9 → v10: 从旧单模型字段迁移到多模型选择
        const configs = persistedState.configs ?? {}
        for (const key of Object.keys(configs)) {
          if (!Array.isArray(configs[key].selectedVideoModels)) {
            configs[key].selectedVideoModels = configs[key].modelType ? [configs[key].modelType] : []
          }
          if (!Array.isArray(configs[key].selectedImageModels)) {
            configs[key].selectedImageModels = configs[key].imageModel ? [configs[key].imageModel] : []
          }
        }
        persistedState.configs = configs
      }
      if (version < 11) {
        // v10 → v11: 给已有配置补文案要求展开和系统内置文案要求字段
        const configs = persistedState.configs ?? {}
        for (const key of Object.keys(configs)) {
          if (configs[key].captionPromptOpen === undefined) {
            configs[key].captionPromptOpen = true
          }
          if (configs[key].captionSystemPrompt === undefined) {
            configs[key].captionSystemPrompt = ''
          }
          if (configs[key].captionSystemPromptDefault === undefined) {
            configs[key].captionSystemPromptDefault = ''
          }
        }
        persistedState.configs = configs
      }
      return persistedState
    },
  },
  'indexedDB',
)
