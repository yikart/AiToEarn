/**
 * CreatePlanModal - 创建/编辑草稿弹窗
 * 仅包含名称输入
 */

'use client'

import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/lib/toast'
import { useBrandPromotionStore } from '../../brandPromotionStore'

function CreatePlanModal() {
  const { t } = useTransClient('brandPromotion')

  const {
    createPlanModalOpen,
    editingPlan,
    isSubmitting,
  } = useBrandPromotionStore(
    useShallow(state => ({
      createPlanModalOpen: state.createPlanModalOpen,
      editingPlan: state.editingPlan,
      isSubmitting: state.isSubmitting,
    })),
  )

  const closePlanModal = useBrandPromotionStore(state => state.closePlanModal)
  const createPlan = useBrandPromotionStore(state => state.createPlan)
  const updatePlan = useBrandPromotionStore(state => state.updatePlan)

  const isEdit = editingPlan !== null

  // 表单状态
  const [name, setName] = useState('')

  // 初始化/重置表单
  useEffect(() => {
    if (createPlanModalOpen) {
      if (editingPlan) {
        setName(editingPlan.name || editingPlan.title || '')
      }
      else {
        setName('')
      }
    }
  }, [createPlanModalOpen, editingPlan])

  const handleSubmit = useCallback(async () => {
    if (!name.trim())
      return

    if (isEdit && editingPlan) {
      const success = await updatePlan(editingPlan.id, {
        name: name.trim(),
      })
      if (success) {
        toast.success(t('createPlan.updateSuccess'))
        closePlanModal()
      }
      else {
        toast.error(t('createPlan.updateFailed'))
      }
    }
    else {
      const success = await createPlan({
        name: name.trim(),
      })
      if (success) {
        toast.success(t('createPlan.createSuccess'))
        closePlanModal()
      }
      else {
        toast.error(t('createPlan.createFailed'))
      }
    }
  }, [name, isEdit, editingPlan, createPlan, updatePlan, closePlanModal, t])

  return (
    <Dialog
      open={createPlanModalOpen}
      onOpenChange={(open) => {
        if (!open)
          closePlanModal()
      }}
    >
      <DialogContent className="sm:w-[min(500px,95vw)]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('createPlan.editTitle') : t('createPlan.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 名称 */}
          <div className="space-y-2">
            <Label>{t('createPlan.name')}</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('createPlan.namePlaceholder')}
              maxLength={50}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={closePlanModal}
            disabled={isSubmitting}
            className="cursor-pointer"
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
            className="cursor-pointer"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? t('common.save') : t('common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreatePlanModal
