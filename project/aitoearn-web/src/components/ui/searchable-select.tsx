/**
 * SearchableSelect - 可搜索的下拉选择器组件
 * 基于 Command 和 Popover 封装，支持搜索过滤选项
 */

'use client'

import { Check, ChevronsUpDown, X } from 'lucide-react'
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
import { cn } from '@/lib/utils'

export interface SearchableSelectOption {
  value: string
  label: string
  icon?: string
}

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
  className,
  triggerClassName,
  clearable,
  onClear,
}: SearchableSelectProps) {
  const { t } = useTransClient('common')
  const [open, setOpen] = React.useState(false)

  // 使用传入的文本或国际化默认值
  const placeholderText = placeholder || t('select.placeholder')
  const searchPlaceholderText = searchPlaceholder || t('select.searchPlaceholder')
  const emptyTextDisplay = emptyText || t('select.noResults')

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

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
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
            <span className="truncate">{selectedLabel || placeholderText}</span>
          </div>
          {clearable && !disabled && onClear ? (
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
        onOpenAutoFocus={(e) => {
          // 移动端不自动聚焦输入框，避免键盘弹出
          if (window.innerWidth < 768) {
            e.preventDefault()
          }
        }}
      >
        <Command
          value={selectedLabel ?? ''}
          filter={(value, search) => {
            // 自定义过滤逻辑，支持中文搜索
            if (value.toLowerCase().includes(search.toLowerCase()))
              return 1
            return 0
          }}
        >
          <CommandInput placeholder={searchPlaceholderText} className="h-9" />
          <CommandList ref={listRef} className="max-h-[40vh] md:max-h-[300px]">
            <CommandEmpty>{emptyTextDisplay}</CommandEmpty>
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
                  <span className="truncate">{option.label}</span>
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
