/**
 * PlanListItem - 更多面板中的计划列表项
 * 显示计划名称、选中状态、编辑/删除操作
 */

'use client'

import type { PromotionPlan } from '../../../brandPromotionStore/types'
import { Check, Pencil, Trash2 } from 'lucide-react'
import { useTransClient } from '@/app/i18n/client'
import { cn } from '@/lib/utils'

interface PlanListItemProps {
  plan: PromotionPlan
  isSelected: boolean
  onSelect: (planId: string) => void
  onEdit: (plan: PromotionPlan) => void
  onDelete: (plan: PromotionPlan) => void
}

function PlanListItem({
  plan,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: PlanListItemProps) {
  const { t } = useTransClient('brandPromotion')

  return (
    <div
      className={cn(
        'flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors',
        'hover:bg-accent',
        isSelected && 'bg-accent',
      )}
      onClick={() => onSelect(plan.id)}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {isSelected && (
          <Check className="h-4 w-4 text-primary shrink-0" />
        )}
        <span className={cn(
          'text-sm truncate',
          isSelected && 'font-medium text-primary',
        )}
        >
          {plan.name || plan.title}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-2">
        <button
          className="p-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(plan)
          }}
          title={t('planTab.editPlan')}
        >
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <button
          className="p-1.5 rounded-md hover:bg-destructive/10 cursor-pointer transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(plan)
          }}
          title={t('planTab.deletePlan')}
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
        </button>
      </div>
    </div>
  )
}

export default PlanListItem
