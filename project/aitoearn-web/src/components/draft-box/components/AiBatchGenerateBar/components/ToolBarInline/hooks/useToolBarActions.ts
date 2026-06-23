import type { UseToolBarActionsParams } from '../types'
import type { VideoModelType } from '@/api/ai/ai.types'
import { useCallback } from 'react'

export function useToolBarActions({
  imageModelSelectionMode,
  onImageCountChange,
  onImageModelsChange,
  onQuantityChange,
  onVideoModelsChange,
  selectedImageModels,
  selectedVideoModels,
  videoModelSelectionMode,
}: UseToolBarActionsParams) {
  const handleVideoModelToggle = useCallback(
    (modelName: VideoModelType) => {
      if (videoModelSelectionMode === 'single') {
        onVideoModelsChange([modelName])
        return
      }
      const isSelected = selectedVideoModels.includes(modelName)
      if (isSelected && selectedVideoModels.length <= 1)
        return
      onVideoModelsChange(
        isSelected
          ? selectedVideoModels.filter(item => item !== modelName)
          : [...selectedVideoModels, modelName],
      )
    },
    [onVideoModelsChange, selectedVideoModels, videoModelSelectionMode],
  )

  const handleImageModelToggle = useCallback(
    (modelName: string) => {
      if (imageModelSelectionMode === 'single') {
        onImageModelsChange([modelName])
        return
      }
      const isSelected = selectedImageModels.includes(modelName)
      if (isSelected && selectedImageModels.length <= 1)
        return
      onImageModelsChange(
        isSelected
          ? selectedImageModels.filter(item => item !== modelName)
          : [...selectedImageModels, modelName],
      )
    },
    [imageModelSelectionMode, onImageModelsChange, selectedImageModels],
  )

  const handleQuantityChange = useCallback(
    ([value]: number[]) => {
      onQuantityChange(value)
    },
    [onQuantityChange],
  )

  const handleImageCountChange = useCallback(
    ([value]: number[]) => {
      onImageCountChange(value)
    },
    [onImageCountChange],
  )

  return {
    handleImageCountChange,
    handleImageModelToggle,
    handleQuantityChange,
    handleVideoModelToggle,
  }
}
