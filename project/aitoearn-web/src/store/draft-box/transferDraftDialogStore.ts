/**
 * TransferDraftDialog Store - 移动到草稿箱弹窗状态管理
 */

import { create } from 'zustand'
import { combine } from 'zustand/middleware'

interface TransferDraftDialogPayload {
  currentPlanId: string
  draftIds: string[]
  mediaIds: string[]
}

const initialState: TransferDraftDialogPayload & {
  open: boolean
} = {
  open: false,
  currentPlanId: '',
  draftIds: [],
  mediaIds: [],
}

export const useTransferDraftDialogStore = create(
  combine(
    initialState,
    set => ({
      openDialog(payload: TransferDraftDialogPayload) {
        set({
          open: true,
          ...payload,
        })
      },
      closeDialog() {
        set(initialState)
      },
    }),
  ),
)
