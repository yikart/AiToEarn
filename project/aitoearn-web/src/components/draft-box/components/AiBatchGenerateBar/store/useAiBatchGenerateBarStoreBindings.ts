import type {
  AiBatchGenerateBarLocalState,
  AiBatchGenerateBarStatePatch,
  AiBatchGenerateBarStateValue,
} from './aiBatchGenerateBarStore.types'
import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useAiBatchGenerateBarStore } from './aiBatchGenerateBarStore'

function bindFieldSetter<Key extends keyof AiBatchGenerateBarLocalState>(
  configKey: string,
  field: Key,
  setField: (
    configKey: string,
    field: Key,
    value: AiBatchGenerateBarStateValue<Key>,
  ) => void,
) {
  return (value: AiBatchGenerateBarStateValue<Key>) => setField(configKey, field, value)
}

export function useAiBatchGenerateBarLocalState(
  configKey: string,
  fallbackState: AiBatchGenerateBarLocalState,
) {
  return useAiBatchGenerateBarStore(state => state.states[configKey]) ?? fallbackState
}

export function useAiBatchGenerateBarStoreActions(configKey: string) {
  const { initializeState, patchState, replaceState, setField } = useAiBatchGenerateBarStore(
    useShallow(state => ({
      initializeState: state.initializeState,
      patchState: state.patchState,
      replaceState: state.replaceState,
      setField: state.setField,
    })),
  )

  return useMemo(
    () => ({
      initializeLocalState: (state: AiBatchGenerateBarLocalState) =>
        initializeState(configKey, state),
      replaceLocalState: (state: AiBatchGenerateBarLocalState) => replaceState(configKey, state),
      patchLocalState: (patch: AiBatchGenerateBarStatePatch) => patchState(configKey, patch),
      setPromptValue: bindFieldSetter(configKey, 'promptValue', setField),
      setPromptEditorOpen: bindFieldSetter(configKey, 'promptEditorOpen', setField),
      setAspectRatio: bindFieldSetter(configKey, 'aspectRatio', setField),
      setDuration: bindFieldSetter(configKey, 'duration', setField),
      setResolution: bindFieldSetter(configKey, 'resolution', setField),
      setModelType: bindFieldSetter(configKey, 'modelType', setField),
      setSelectedVideoModels: bindFieldSetter(configKey, 'selectedVideoModels', setField),
      setVideoModelSelectionMode: bindFieldSetter(
        configKey,
        'videoModelSelectionMode',
        setField,
      ),
      setVideoModelResolutions: bindFieldSetter(configKey, 'videoModelResolutions', setField),
      setVideoModelParams: bindFieldSetter(configKey, 'videoModelParams', setField),
      setContentType: bindFieldSetter(configKey, 'contentType', setField),
      setImageModel: bindFieldSetter(configKey, 'imageModel', setField),
      setSelectedImageModels: bindFieldSetter(configKey, 'selectedImageModels', setField),
      setImageModelSelectionMode: bindFieldSetter(
        configKey,
        'imageModelSelectionMode',
        setField,
      ),
      setImageCount: bindFieldSetter(configKey, 'imageCount', setField),
      setImageSize: bindFieldSetter(configKey, 'imageSize', setField),
      setQuantity: bindFieldSetter(configKey, 'quantity', setField),
      setIsDraftMode: bindFieldSetter(configKey, 'isDraftMode', setField),
      setCaptionSystemPrompt: bindFieldSetter(configKey, 'captionSystemPrompt', setField),
      setCaptionSystemPromptDefault: bindFieldSetter(
        configKey,
        'captionSystemPromptDefault',
        setField,
      ),
      setMoreOptionsOpen: bindFieldSetter(configKey, 'moreOptionsOpen', setField),
      setSelectedPlatforms: bindFieldSetter(configKey, 'selectedPlatforms', setField),
    }),
    [configKey, initializeState, patchState, replaceState, setField],
  )
}
