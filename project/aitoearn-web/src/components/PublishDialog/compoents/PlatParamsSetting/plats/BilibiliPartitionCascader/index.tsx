/**
 * BilibiliPartitionCascader - B站二级分区级联选择器
 */

'use client'

import type { ReactNode } from 'react'
import type { BiblPartItem } from '@/components/PublishDialog/publishDialog.type'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Check, ChevronRight, ChevronsUpDown, Loader2, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/utils/className'

interface BilibiliPartitionCascaderProps {
  partitions: BiblPartItem[]
  value?: number
  onValueChange: (value: number) => void
  placeholder: string
  searchPlaceholder: string
  emptyText: string
  loading?: boolean
  loadingText: string
  disabled?: boolean
  className?: string
}

interface SelectedPartition {
  parent: BiblPartItem
  child?: BiblPartItem
}

interface VirtualOptionListProps<T> {
  items: T[]
  estimateSize: number
  emptyText: string
  className?: string
  selectedIndex?: number
  resetKey?: string | number
  getItemKey: (item: T) => string | number
  renderItem: (item: T, index: number) => ReactNode
}

function matchesText(value: string | undefined, searchText: string) {
  return value?.toLocaleLowerCase().includes(searchText) ?? false
}

function matchesPartition(partition: BiblPartItem, searchText: string) {
  if (matchesText(partition.name, searchText) || matchesText(partition.description, searchText)) {
    return true
  }

  return partition.children.some((child) => {
    return matchesText(child.name, searchText) || matchesText(child.description, searchText)
  })
}

function findSelectedPartition(partitions: BiblPartItem[], value?: number): SelectedPartition | null {
  if (value === undefined)
    return null

  for (const partition of partitions) {
    const selectedChild = partition.children.find(child => child.id === value)
    if (selectedChild) {
      return {
        parent: partition,
        child: selectedChild,
      }
    }

    if (partition.id === value) {
      return {
        parent: partition,
      }
    }
  }

  return null
}

function VirtualOptionList<T>({
  items,
  estimateSize,
  emptyText,
  className,
  selectedIndex = -1,
  resetKey,
  getItemKey,
  renderItem,
}: VirtualOptionListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 8,
  })

  useEffect(() => {
    const scrollElement = parentRef.current
    if (!scrollElement)
      return

    scrollElement.scrollTop = 0
  }, [resetKey])

  useEffect(() => {
    if (selectedIndex < 0 || items.length === 0)
      return

    requestAnimationFrame(() => {
      virtualizer.scrollToIndex(selectedIndex, { align: 'center' })
    })
  }, [items.length, selectedIndex, virtualizer])

  const virtualItems = virtualizer.getVirtualItems()

  return (
    <div ref={parentRef} className={cn('h-[260px] overflow-y-auto overflow-x-hidden', className)}>
      {items.length === 0
        ? (
            <div className="flex h-full items-center justify-center px-3 text-center text-sm text-muted-foreground">
              {emptyText}
            </div>
          )
        : (
            <div
              className="relative w-full"
              style={{ height: `${virtualizer.getTotalSize()}px` }}
            >
              {virtualItems.map((virtualRow) => {
                const item = items[virtualRow.index]
                if (!item)
                  return null

                return (
                  <div
                    key={getItemKey(item)}
                    data-index={virtualRow.index}
                    className="absolute left-0 top-0 w-full px-1 py-0.5"
                    style={{ transform: `translateY(${virtualRow.start}px)` }}
                  >
                    {renderItem(item, virtualRow.index)}
                  </div>
                )
              })}
            </div>
          )}
    </div>
  )
}

export default function BilibiliPartitionCascader({
  partitions,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  loading = false,
  loadingText,
  disabled = false,
  className,
}: BilibiliPartitionCascaderProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [activeParentId, setActiveParentId] = useState<number>()
  const [renderChildrenList, setRenderChildrenList] = useState(false)
  const renderChildrenFrameRef = useRef<number | null>(null)

  const searchText = searchValue.trim().toLocaleLowerCase()

  const selectedPartition = useMemo(() => {
    return findSelectedPartition(partitions, value)
  }, [partitions, value])

  const selectedLabel = selectedPartition?.child
    ? `${selectedPartition.parent.name} / ${selectedPartition.child.name}`
    : selectedPartition?.parent.name

  const filteredParents = useMemo(() => {
    if (!searchText)
      return partitions

    return partitions.filter(partition => matchesPartition(partition, searchText))
  }, [partitions, searchText])

  const activeParent = useMemo(() => {
    if (filteredParents.length === 0)
      return undefined

    return filteredParents.find(partition => partition.id === activeParentId)
      ?? filteredParents.find(partition => partition.id === selectedPartition?.parent.id)
      ?? filteredParents[0]
  }, [activeParentId, filteredParents, selectedPartition?.parent.id])

  const visibleChildren = useMemo(() => {
    if (!activeParent)
      return []

    if (!searchText)
      return activeParent.children

    const parentMatchesSearch = matchesText(activeParent.name, searchText)
      || matchesText(activeParent.description, searchText)

    if (parentMatchesSearch)
      return activeParent.children

    return activeParent.children.filter((child) => {
      return matchesText(child.name, searchText) || matchesText(child.description, searchText)
    })
  }, [activeParent, searchText])

  const activeParentIndex = filteredParents.findIndex(partition => partition.id === activeParent?.id)
  const selectedChildIndex = visibleChildren.findIndex(child => child.id === value)

  useEffect(() => {
    return () => {
      if (renderChildrenFrameRef.current === null)
        return

      cancelAnimationFrame(renderChildrenFrameRef.current)
    }
  }, [])

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (nextOpen && loading)
      return

    if (renderChildrenFrameRef.current !== null) {
      cancelAnimationFrame(renderChildrenFrameRef.current)
      renderChildrenFrameRef.current = null
    }

    if (!nextOpen) {
      setSearchValue('')
      setRenderChildrenList(false)
      setOpen(false)
      return
    }

    setRenderChildrenList(false)
    setActiveParentId(selectedPartition?.parent.id ?? partitions[0]?.id)
    setOpen(true)

    renderChildrenFrameRef.current = requestAnimationFrame(() => {
      renderChildrenFrameRef.current = null
      setRenderChildrenList(true)
    })
  }, [loading, partitions, selectedPartition?.parent.id])

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={placeholder}
          disabled={disabled || loading}
          className={cn(
            'w-full justify-between font-normal h-8 cursor-pointer',
            !selectedLabel && 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate">{loading ? loadingText : selectedLabel || placeholder}</span>
          {loading
            ? <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-70" />
            : <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[min(430px,calc(100vw-2rem))] p-0"
        align="start"
        side="bottom"
        sideOffset={4}
        allowInnerScroll
        onOpenAutoFocus={(event) => {
          if (window.innerWidth < 768) {
            event.preventDefault()
          }
        }}
      >
        <div className="flex items-center border-b border-border px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={event => setSearchValue(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 border-0 px-0 shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="grid grid-cols-[minmax(112px,0.42fr)_minmax(0,1fr)] divide-x divide-border">
          <VirtualOptionList
            items={filteredParents}
            estimateSize={38}
            emptyText={emptyText}
            selectedIndex={activeParentIndex}
            resetKey={searchText}
            getItemKey={partition => partition.id}
            renderItem={partition => (
              <button
                type="button"
                className={cn(
                  'flex h-9 w-full cursor-pointer items-center justify-between rounded-sm px-2 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring',
                  activeParent?.id === partition.id && 'bg-accent text-accent-foreground',
                  selectedPartition?.parent.id === partition.id
                  && activeParent?.id !== partition.id
                  && 'text-primary',
                )}
                onClick={() => setActiveParentId(partition.id)}
              >
                <span className="truncate font-medium">{partition.name}</span>
                <ChevronRight className="ml-1 h-4 w-4 shrink-0 opacity-60" />
              </button>
            )}
          />

          {renderChildrenList
            ? (
                <VirtualOptionList
                  items={visibleChildren}
                  estimateSize={54}
                  emptyText={emptyText}
                  className="h-[260px]"
                  selectedIndex={selectedChildIndex}
                  resetKey={`${activeParent?.id ?? 'empty'}-${searchText}`}
                  getItemKey={partition => partition.id}
                  renderItem={(partition) => {
                    const isSelected = partition.id === value

                    return (
                      <button
                        type="button"
                        className={cn(
                          'flex w-full cursor-pointer items-start rounded-sm px-2 py-2 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring',
                          isSelected && 'bg-accent text-accent-foreground',
                        )}
                        onClick={() => {
                          onValueChange(partition.id)
                          setOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 mt-0.5 h-4 w-4 shrink-0',
                            isSelected ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{partition.name}</span>
                          {partition.description && (
                            <span
                              className={cn(
                                'mt-0.5 block truncate text-xs',
                                isSelected ? 'text-accent-foreground/75' : 'text-muted-foreground',
                              )}
                            >
                              {partition.description}
                            </span>
                          )}
                        </span>
                      </button>
                    )
                  }}
                />
              )
            : <div className="h-[260px]" />}
        </div>
      </PopoverContent>
    </Popover>
  )
}
