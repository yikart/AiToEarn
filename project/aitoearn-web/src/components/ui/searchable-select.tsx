/**
 * SearchableSelect - 可搜索的下拉选择器组件
 * 基于 Command 和 Popover 封装，支持搜索过滤选项
 */

'use client'

import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react'
import * as React from 'react'

import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/utils/className'

export interface SearchableSelectOption {
  value: string
  label: string
  description?: string
  icon?: string
  color?: string
}

type SearchableSelectLoadingMode = 'trigger' | 'list'

export interface SearchableSelectProps {
  /** 选项列表 */
  options: SearchableSelectOption[]
  /** 当前选中的值 */
  value?: string
  /** 值改变时的回调 */
  onValueChange?: (value: string) => void
  /** 占位符文本 */
  placeholder?: string
  /** 搜索框占位符 */
  searchPlaceholder?: string
  /** 无结果时显示的文本 */
  emptyText?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 是否处于加载中 */
  loading?: boolean
  /** loading 展示位置：默认在触发器内，远程搜索时可展示在列表内 */
  loadingMode?: SearchableSelectLoadingMode
  /** 加载中文案 */
  loadingText?: string
  /** 受控搜索关键词 */
  searchValue?: string
  /** 搜索关键词变化回调，传入后可用于远程搜索 */
  onSearchChange?: (value: string) => void
  /** 是否启用 Command 内置过滤 */
  shouldFilter?: boolean
  /** 自定义类名 */
  className?: string
  /** 触发器高度，默认 h-8 */
  triggerClassName?: string
  /** 是否显示清除按钮 */
  clearable?: boolean
  /** 点击清除的回调 */
  onClear?: () => void
}

function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled = false,
  loading = false,
  loadingMode = 'trigger',
  loadingText,
  searchValue,
  onSearchChange,
  shouldFilter = true,
  className,
  triggerClassName,
  clearable,
  onClear,
}: SearchableSelectProps) {
  const { t } = useTransClient('common')
  const [open, setOpen] = React.useState(false)
  const [internalSearchValue, setInternalSearchValue] = React.useState('')

  // 使用传入的文本或国际化默认值
  const placeholderText = placeholder || t('select.placeholder')
  const searchPlaceholderText = searchPlaceholder || t('select.searchPlaceholder')
  const emptyTextDisplay = emptyText || t('select.noResults')
  const loadingTextDisplay = loadingText || t('actions.loading')
  const isListLoading = loading && loadingMode === 'list'
  const isTriggerLoading = loading && loadingMode === 'trigger'
  const isDisabled = disabled || isTriggerLoading
  const commandSearchValue = searchValue ?? internalSearchValue

  const handleSearchChange = React.useCallback((nextValue: string) => {
    if (searchValue === undefined) {
      setInternalSearchValue(nextValue)
    }
    onSearchChange?.(nextValue)
  }, [onSearchChange, searchValue])

  // 获取当前选中项
  const selectedOption = React.useMemo(() => {
    return options.find(option => option.value === value)
  }, [options, value])

  const selectedLabel = selectedOption?.label

  const listRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open || !selectedLabel)
      return
    // 等 DOM 渲染完成后再滚动
    requestAnimationFrame(() => {
      const listEl = listRef.current
      if (!listEl)
        return
      const selectedEl = listEl.querySelector(
        `[data-value="${CSS.escape(selectedLabel.toLowerCase())}"]`,
      ) as HTMLElement | null
      if (!selectedEl)
        return
      // 手动计算居中位置，避免 scrollIntoView 影响外层页面滚动
      listEl.scrollTop = selectedEl.offsetTop - listEl.clientHeight / 2 + selectedEl.clientHeight / 2
    })
  }, [open, selectedLabel])

  React.useEffect(() => {
    if (isTriggerLoading) {
      setOpen(false)
    }
  }, [isTriggerLoading])

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-busy={loading || undefined}
          disabled={isDisabled}
          className={cn(
            'w-full justify-between font-normal h-8 cursor-pointer',
            !value && 'text-muted-foreground',
            triggerClassName,
            className,
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            {selectedOption?.icon && (
              <img src={selectedOption.icon} alt="" className="w-5 h-5 rounded-sm object-contain shrink-0" />
            )}
            <span className="truncate" style={{ color: selectedOption?.color }}>
              {isTriggerLoading ? loadingTextDisplay : selectedLabel || placeholderText}
            </span>
          </div>
          {isTriggerLoading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-70" />
          ) : clearable && !isDisabled && onClear ? (
            <span
              role="button"
              className="ml-2 shrink-0 opacity-50 hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onClear()
              }}
              onPointerDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
            >
              <X className="h-4 w-4" />
            </span>
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] min-w-[200px] p-0"
        align="start"
        side="bottom"
        sideOffset={4}
        allowInnerScroll
        onOpenAutoFocus={(e) => {
          // 移动端不自动聚焦输入框，避免键盘弹出
          if (window.innerWidth < 768) {
            e.preventDefault()
          }
        }}
      >
        <Command
          value={selectedLabel ?? ''}
          shouldFilter={shouldFilter}
          filter={(value, search) => {
            // 自定义过滤逻辑，支持中文搜索
            if (value.toLowerCase().includes(search.toLowerCase()))
              return 1
            return 0
          }}
        >
          <CommandInput
            value={commandSearchValue}
            placeholder={searchPlaceholderText}
            className="h-9"
            onValueChange={handleSearchChange}
          />
          <CommandList ref={listRef} className="max-h-[40vh] md:max-h-[300px]">
            {isListLoading && (
              <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{loadingTextDisplay}</span>
              </div>
            )}
            {!isListLoading && <CommandEmpty>{emptyTextDisplay}</CommandEmpty>}
            <CommandGroup>
              {options.map(option => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onValueChange?.(option.value)
                    setOpen(false)
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 shrink-0',
                      value === option.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {option.icon && (
                    <img src={option.icon} alt="" className="w-5 h-5 rounded-sm object-contain shrink-0" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate" style={{ color: option.color }}>{option.label}</span>
                    {option.description && (
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    )}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

SearchableSelect.displayName = 'SearchableSelect'

export { SearchableSelect }
