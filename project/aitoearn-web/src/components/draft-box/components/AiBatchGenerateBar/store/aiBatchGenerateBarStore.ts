import type {
  AiBatchGenerateBarLocalState,
  AiBatchGenerateBarStatePatch,
  AiBatchGenerateBarStateValue,
  BuildAiBatchGenerateBarStateParams,
} from './aiBatchGenerateBarStore.types'
import isEqual from 'lodash/isEqual'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'

interface AiBatchGenerateBarStoreState {
  states: Record<string, AiBatchGenerateBarLocalState>
}

const initialStoreState: AiBatchGenerateBarStoreState = {
  states: {},
}

function resolveStateValue<Key extends keyof AiBatchGenerateBarLocalState>(
  current: AiBatchGenerateBarLocalState[Key],
  value: AiBatchGenerateBarStateValue<Key>,
) {
  return typeof value === 'function'
    ? (value as (current: AiBatchGenerateBarLocalState[Key]) => AiBatchGenerateBarLocalState[Key])(
        current,
      )
    : value
}

export function buildAiBatchGenerateBarInitialState({
  config,
  forceDraftMode,
  availablePlatforms,
}: BuildAiBatchGenerateBarStateParams): AiBatchGenerateBarLocalState {
  const selectedPlatforms = config.selectedPlatforms.length === 0
    ? availablePlatforms
    : config.selectedPlatforms.filter(platform => availablePlatforms.includes(platform))

  return {
    promptValue: config.promptValue ?? '',
    promptEditorOpen: false,
    aspectRatio: config.aspectRatio,
    duration: config.duration,
    resolution: config.resolution,
    modelType: config.modelType,
    selectedVideoModels: config.selectedVideoModels.length > 0
      ? config.selectedVideoModels
      : config.modelType
        ? [config.modelType]
        : [],
    videoModelSelectionMode: config.videoModelSelectionMode ?? 'single',
    videoModelResolutions: config.videoModelResolutions ?? {},
    videoModelParams: config.videoModelParams ?? {},
    contentType: config.contentType,
    imageModel: config.imageModel,
    selectedImageModels: config.selectedImageModels.length > 0
      ? config.selectedImageModels
      : config.imageModel
        ? [config.imageModel]
        : [],
    imageModelSelectionMode: config.imageModelSelectionMode ?? 'single',
    imageCount: config.imageCount,
    imageSize: config.imageSize,
    quantity: config.quantity,
    isDraftMode: forceDraftMode ? true : (config.isDraftMode ?? true),
    captionSystemPrompt: config.captionSystemPrompt ?? '',
    captionSystemPromptDefault: config.captionSystemPromptDefault ?? '',
    moreOptionsOpen: config.captionPromptOpen ?? true,
    selectedPlatforms,
  }
}

export const useAiBatchGenerateBarStore = create(
  combine(initialStoreState, set => ({
    initializeState: (configKey: string, state: AiBatchGenerateBarLocalState) => {
      set((current) => {
        if (current.states[configKey])
          return current

        return {
          states: {
            ...current.states,
            [configKey]: state,
          },
        }
      })
    },
    replaceState: (configKey: string, state: AiBatchGenerateBarLocalState) => {
      set((current) => {
        const currentState = current.states[configKey]
        if (currentState && isEqual(currentState, state)) {
          return current
        }

        return {
          states: {
            ...current.states,
            [configKey]: state,
          },
        }
      })
    },
    patchState: (configKey: string, patch: AiBatchGenerateBarStatePatch) => {
      set((current) => {
        const state = current.states[configKey]
        if (!state)
          return current

        return {
          states: {
            ...current.states,
            [configKey]: {
              ...state,
              ...patch,
            },
          },
        }
      })
    },
    setField: <Key extends keyof AiBatchGenerateBarLocalState>(
      configKey: string,
      field: Key,
      value: AiBatchGenerateBarStateValue<Key>,
    ) => {
      set((current) => {
        const state = current.states[configKey]
        if (!state)
          return current

        const nextValue = resolveStateValue(state[field], value)
        if (Object.is(nextValue, state[field]))
          return current

        return {
          states: {
            ...current.states,
            [configKey]: {
              ...state,
              [field]: nextValue,
            },
          },
        }
      })
    },
  })),
)
