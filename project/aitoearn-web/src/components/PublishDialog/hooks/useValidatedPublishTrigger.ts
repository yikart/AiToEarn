import { useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'
import { toast } from '@/lib/toast'

export function useValidatedPublishTrigger(onPublish: () => void) {
  const { step, pubListChoosed, errParamsMap, setExpandedPubItem } = usePublishDialog(
    useShallow(state => ({
      step: state.step,
      pubListChoosed: state.pubListChoosed,
      errParamsMap: state.errParamsMap,
      setExpandedPubItem: state.setExpandedPubItem,
    })),
  )

  const triggerPublish = useCallback(() => {
    if (errParamsMap) {
      for (const [key, errVideoItem] of errParamsMap) {
        if (!errVideoItem)
          continue

        const pubItem = pubListChoosed.find(v => v.account.id === key)
        if (pubItem && step === 1)
          setExpandedPubItem(pubItem)

        if (errVideoItem.parErrMsg)
          toast.warning(errVideoItem.parErrMsg)

        return false
      }
    }

    onPublish()
    return true
  }, [errParamsMap, onPublish, pubListChoosed, setExpandedPubItem, step])

  return {
    triggerPublish,
  }
}
