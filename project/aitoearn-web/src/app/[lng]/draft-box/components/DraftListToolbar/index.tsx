/**
 * DraftListToolbar - 草稿列表工具栏
 * 搜索栏 + 批量/条件删除按钮 | 批量模式：全选 + 已选数 + 取消
 */

'use client'

import type { MaterialListFilters } from '@/api/material'
import lodash from 'lodash'
import { Search, Trash2 } from 'lucide-react'
import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useDraftBoxStore } from '@/app/[lng]/draft-box/draftBoxStore'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'

const DraftListToolbar = memo(() => {
  const { t } = useTransClient('brandPromotion')

  const {
    batchMode,
    selectedMaterialIds,
    materials,
    materialsFilter,
  } = useDraftBoxStore(
    useShallow(state => ({
      batchMode: state.batchMode,
      selectedMaterialIds: state.selectedMaterialIds,
      materials: state.materials,
      materialsFilter: state.materialsFilter,
    })),
  )

  const setMaterialsFilter = useDraftBoxStore(state => state.setMaterialsFilter)
  const enterBatchMode = useDraftBoxStore(state => state.enterBatchMode)
  const exitBatchMode = useDraftBoxStore(state => state.exitBatchMode)
  const selectAllLoadedMaterials = useDraftBoxStore(state => state.selectAllLoadedMaterials)
  const deselectAllMaterials = useDraftBoxStore(state => state.deselectAllMaterials)
  const openConditionalDeleteDialog = useDraftBoxStore(state => state.openConditionalDeleteDialog)

  const [searchValue, setSearchValue] = useState(materialsFilter.title || '')

  const debouncedSetFilter = useMemo(
    () => lodash.debounce((filter: MaterialListFilters) => {
      setMaterialsFilter(filter)
    }, 500),
    [setMaterialsFilter],
  )

  // 清理 debounce
  const debouncedRef = useRef(debouncedSetFilter)
  debouncedRef.current = debouncedSetFilter

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
    const { materialsFilter } = useDraftBoxStore.getState()
    debouncedRef.current({
      ...materialsFilter,
      title: value || undefined,
    })
  }, [])

  const allSelected = materials.length > 0 && selectedMaterialIds.length === materials.length

  const handleToggleSelectAll = useCallback(() => {
    if (allSelected) {
      deselectAllMaterials()
    }
    else {
      selectAllLoadedMaterials()
    }
  }, [allSelected, deselectAllMaterials, selectAllLoadedMaterials])

  if (batchMode) {
    return (
      <div className="flex items-center gap-3 mb-4">
        <div data-testid="draftbox-select-all-checkbox" className="flex items-center gap-2 cursor-pointer" onClick={handleToggleSelectAll}>
          <Checkbox checked={allSelected} />
          <span className="text-sm">{t('draftManage.selectAll')}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {t('draftManage.selectedCount', { count: selectedMaterialIds.length })}
        </span>
        <div className="flex-1" />
        <Button data-testid="draftbox-batch-cancel-btn" variant="ghost" size="sm" onClick={exitBatchMode} className="cursor-pointer">
          {t('draftManage.cancel')}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
      {/* 第一行：搜索框 */}
      <div className="relative w-full sm:max-w-[300px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          data-testid="draftbox-search-input"
          value={searchValue}
          onChange={handleSearchChange}
          placeholder={t('draftManage.searchPlaceholder')}
          className="pl-9 h-9"
        />
      </div>
      {/* 第二行：按钮组 */}
      <div className="flex items-center gap-3 flex-wrap sm:ml-auto">
        <Button
          data-testid="draftbox-batch-mode-btn"
          variant="outline"
          size="sm"
          onClick={enterBatchMode}
          className="cursor-pointer gap-1.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {t('draftManage.batchDelete')}
        </Button>
        <Button
          data-testid="draftbox-conditional-delete-btn"
          variant="outline"
          size="sm"
          onClick={openConditionalDeleteDialog}
          className="cursor-pointer gap-1.5"
        >
          {t('draftManage.conditionalDelete')}
        </Button>

      </div>
    </div>
  )
})

DraftListToolbar.displayName = 'DraftListToolbar'

export { DraftListToolbar }
