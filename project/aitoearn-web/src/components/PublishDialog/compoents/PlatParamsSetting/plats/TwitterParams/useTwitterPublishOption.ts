import type { TwitterOption } from './types'
import type { IPlatOption, PubItem } from '@/components/PublishDialog/publishDialog.type'
import { useCallback } from 'react'

export function useTwitterPublishOption(
  pubItem: PubItem,
  setOnePubParams: (params: { option: IPlatOption }, accountId: string) => void,
) {
  const twitterOption = pubItem.params.option.twitter ?? {}

  const updateTwitterOption = useCallback(
    (patch: Partial<TwitterOption>) => {
      setOnePubParams({ option: { twitter: patch } }, pubItem.account.id)
    },
    [pubItem.account.id, setOnePubParams],
  )

  return {
    twitterOption,
    updateTwitterOption,
  }
}
