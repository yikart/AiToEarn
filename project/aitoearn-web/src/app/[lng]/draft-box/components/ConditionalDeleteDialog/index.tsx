/**
 * ConditionalDeleteDialog - 按条件删除草稿弹窗
 * 外层控制渲染，内层使用 hooks（避免 useTransClient 动态加载闪烁）
 */

'use client'

import type { MaterialListFilters } from '@/api/material'
import lodash from 'lodash'
import { Loader2 } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { apiGetMaterialList } from '@/api/material'
import { usePlanDetailStore } from '@/app/[lng]/brand-promotion/planDetailStore'
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
import { NumberInput } from '@/components/ui/number-input'
import { toast } from '@/lib/toast'

// 外层：控制渲染时机
const ConditionalDeleteDialog = memo(() => {
  const open = usePlanDetailStore(state => state.conditionalDeleteDialogOpen)
  const closeDialog = usePlanDetailStore(state => state.closeConditionalDeleteDialog)

  if (!open)
    return null

  return (
    <ConditionalDeleteDialogContent onOpenChange={(v) => {
      if (!v)
        closeDialog()
    }}
    />
  )
})

ConditionalDeleteDialog.displayName = 'ConditionalDeleteDialog'

// 内层：使用 hooks
const ConditionalDeleteDialogContent = memo(({ onOpenChange }: { onOpenChange: (open: boolean) => void }) => {
  const { t } = useTransClient('brandPromotion')

  const currentPlan = usePlanDetailStore(state => state.currentPlan)
  const filterDeleteMaterials = usePlanDetailStore(state => state.filterDeleteMaterials)

  const [title, setTitle] = useState('')
  const [useCount, setUseCount] = useState<number | undefined>()
  const [matchCount, setMatchCount] = useState<number | null>(null)
  const [querying, setQuerying] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const hasCondition = title.trim() !== '' || useCount !== undefined

  // 构建筛选条件
  const buildFilters = useCallback((): MaterialListFilters => {
    const filters: MaterialListFilters = {}
    if (title.trim())
      filters.title = title.trim()
    if (useCount !== undefined)
      filters.useCount = useCount
    return filters
  }, [title, useCount])

  // debounce 查询匹配数量
  const queryMatchCount = useMemo(
    () => lodash.debounce(async (groupId: string, filters: MaterialListFilters) => {
      if (!filters.title && filters.useCount === undefined) {
        setMatchCount(null)
        setQuerying(false)
        return
      }
      setQuerying(true)
      try {
        const res = await apiGetMaterialList(groupId, 1, 0, filters)
        setMatchCount(res?.data?.total ?? 0)
      }
      catch {
        setMatchCount(null)
      }
      finally {
        setQuerying(false)
      }
    }, 500),
    [],
  )

  useEffect(() => {
    if (!currentPlan)
      return
    const filters = buildFilters()
    if (!filters.title && filters.useCount === undefined) {
      setMatchCount(null)
      return
    }
    setQuerying(true)
    queryMatchCount(currentPlan.id, filters)
  }, [title, useCount, currentPlan, buildFilters, queryMatchCount])

  // 清理 debounce
  useEffect(() => {
    return () => {
      queryMatchCount.cancel()
    }
  }, [queryMatchCount])

  const handleDelete = useCallback(async () => {
    if (!hasCondition || matchCount === 0)
      return
    setDeleting(true)
    try {
      const conditions = buildFilters()
      const success = await filterDeleteMaterials(conditions)
      if (success) {
        toast.success(t('draftManage.conditionalDeleteSuccess'))
      }
      else {
        toast.error(t('draftManage.conditionalDeleteFailed'))
      }
    }
    finally {
      setDeleting(false)
    }
  }, [hasCondition, matchCount, buildFilters, filterDeleteMaterials, t])

  const deleteDisabled = !hasCondition || matchCount === 0 || matchCount === null || deleting

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent data-testid="draftbox-cond-delete-dialog" className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{t('draftManage.conditionalDeleteTitle')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{t('draftManage.conditionTitle')}</Label>
            <Input
              data-testid="draftbox-cond-title-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t('draftManage.conditionTitlePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('draftManage.conditionUseCount')}</Label>
            <NumberInput
              data-testid="draftbox-cond-usecount-input"
              value={useCount}
              onValueChange={v => setUseCount(v)}
              decimalScale={0}
              allowNegative={false}
              placeholder={t('draftManage.conditionUseCountPlaceholder')}
            />
          </div>

          <div data-testid="draftbox-cond-match-count" className="rounded-md bg-muted p-3 text-sm">
            {!hasCondition && (
              <span className="text-muted-foreground">{t('draftManage.setConditionHint')}</span>
            )}
            {hasCondition && querying && (
              <span className="text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t('draftManage.matchCountLoading')}
              </span>
            )}
            {hasCondition && !querying && matchCount !== null && (
              <span className={matchCount > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                {t('draftManage.matchCount', { count: matchCount })}
              </span>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="cursor-pointer">
            {t('draftManage.cancel')}
          </Button>
          <Button
            data-testid="draftbox-cond-delete-confirm-btn"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteDisabled}
            className="cursor-pointer gap-1.5"
          >
            {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('common.delete')}
            {matchCount !== null && matchCount > 0 && ` (${matchCount})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})

ConditionalDeleteDialogContent.displayName = 'ConditionalDeleteDialogContent'

export { ConditionalDeleteDialog }
