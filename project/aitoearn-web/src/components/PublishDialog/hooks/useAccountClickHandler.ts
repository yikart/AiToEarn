/**
 * 账户点击处理 Hook
 * 统一处理账户选择/取消选择的逻辑
 */

import type { PubItem } from '@/components/PublishDialog/publishDialog.type'
import { useCallback } from 'react'

interface UseAccountClickHandlerParams {
  pubListChoosed: PubItem[]
  step: number
  setStep: (step: number) => void
  setExpandedPubItem: (item: PubItem | undefined) => void
  setPubListChoosed: (list: PubItem[]) => void
}

/**
 * 账户点击处理 Hook
 * 处理账户选择、步骤切换等逻辑
 */
export function useAccountClickHandler({
  pubListChoosed,
  step,
  setStep,
  setExpandedPubItem,
  setPubListChoosed,
}: UseAccountClickHandlerParams) {
  /**
   * 处理账户点击
   * - 点击已选中的账户：取消选中
   * - 点击未选中的账户：添加到选中列表
   * - 自动切换步骤
   */
  const handleAccountClick = useCallback(
    (pubItem: PubItem) => {
      const newPubListChoosed = [...pubListChoosed]
      const index = newPubListChoosed.findIndex(v => v.account.id === pubItem.account.id)

      if (index !== -1) {
        newPubListChoosed.splice(index, 1)
      }
      else {
        newPubListChoosed.push(pubItem)
      }

      // 是否自动回到第一步
      if (newPubListChoosed.length === 0 && step === 1) {
        const isBack = newPubListChoosed.every(
          v => !v.params.des && !v.params.video && !v.params.images?.length,
        )
        if (isBack) {
          setStep(0)
        }
      }

      // 是否自动前往第二步
      if (step === 0 && newPubListChoosed.length !== 0) {
        const isFront = newPubListChoosed.every(
          v => v.params.des || v.params.video || v.params.images?.length !== 0,
        )
        if (isFront) {
          setStep(1)
        }
      }

      // 如果只有一个账户，自动展开
      if (newPubListChoosed.length === 1) {
        setExpandedPubItem(newPubListChoosed[0])
      }

      setPubListChoosed(newPubListChoosed)
    },
    [pubListChoosed, step, setStep, setExpandedPubItem, setPubListChoosed],
  )

  return {
    handleAccountClick,
  }
}
