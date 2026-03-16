/**
 * BatchActionBar - 批量模式底部固定操作栏
 * 显示已选数量、取消按钮、删除按钮
 */

'use client'

import { Loader2, Trash2 } from 'lucide-react'
import { memo, useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useDraftBoxStore } from '@/app/[lng]/draft-box/draftBoxStore'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { confirm } from '@/lib/confirm'
import { toast } from '@/lib/toast'

const BatchActionBar = memo(() => {
  const { t } = useTransClient('brandPromotion')

  const { selectedMaterialIds, batchDeleting } = useDraftBoxStore(
    useShallow(state => ({
      selectedMaterialIds: state.selectedMaterialIds,
      batchDeleting: state.batchDeleting,
    })),
  )

  const exitBatchMode = useDraftBoxStore(state => state.exitBatchMode)
  const batchDeleteMaterials = useDraftBoxStore(state => state.batchDeleteMaterials)

  const handleDelete = useCallback(() => {
    const count = selectedMaterialIds.length
    if (count === 0)
      return

    confirm({
      title: t('draftManage.batchDeleteConfirmTitle'),
      content: t('draftManage.batchDeleteConfirmDesc', { count }),
      okType: 'destructive',
      onOk: async () => {
        const success = await batchDeleteMaterials()
        if (success) {
          toast.success(t('draftManage.batchDeleteSuccess'))
        }
        else {
          toast.error(t('draftManage.batchDeleteFailed'))
        }
      },
    })
  }, [selectedMaterialIds.length, batchDeleteMaterials, t])

  return (
    <div data-testid="draftbox-batch-bar" className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-6 py-3">
      <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
        <span data-testid="draftbox-batch-selected-count" className="text-sm text-muted-foreground">
          {t('draftManage.selectedCount', { count: selectedMaterialIds.length })}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={exitBatchMode} className="cursor-pointer">
            {t('draftManage.cancel')}
          </Button>
          <Button
            data-testid="draftbox-batch-delete-btn"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={selectedMaterialIds.length === 0 || batchDeleting}
            className="cursor-pointer gap-1.5"
          >
            {batchDeleting
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Trash2 className="h-3.5 w-3.5" />}
            {t('common.delete')}
          </Button>
        </div>
      </div>
    </div>
  )
})

BatchActionBar.displayName = 'BatchActionBar'

export { BatchActionBar }
