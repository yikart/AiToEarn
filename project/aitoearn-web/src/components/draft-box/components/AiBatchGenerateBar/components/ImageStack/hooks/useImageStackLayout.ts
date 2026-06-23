import type { ImageStackLayoutState, UseImageStackLayoutParams } from '../types'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ITEM_WIDTH, PARENT_WIDTH } from '../utils/constants'
import { getExpandedContainerStyle } from '../utils/styles'

export function useImageStackLayout({
  totalMediaCount,
  showAddButton,
}: UseImageStackLayoutParams): ImageStackLayoutState {
  const [expanded, setExpanded] = useState(false)
  const hoverRef = useRef(false)
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearCollapseTimer = useCallback(() => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current)
      collapseTimerRef.current = null
    }
  }, [])

  useEffect(
    () => () => {
      clearCollapseTimer()
    },
    [clearCollapseTimer],
  )

  const isExpanded = totalMediaCount === 0 ? true : expanded

  const expandedContainerStyle = useMemo(() => {
    return getExpandedContainerStyle(totalMediaCount, showAddButton)
  }, [showAddButton, totalMediaCount])

  const containerLeft = useMemo(() => {
    return (PARENT_WIDTH - ITEM_WIDTH) / 2
  }, [])

  const handleContainerMouseEnter = useCallback(() => {
    hoverRef.current = true
    clearCollapseTimer()
  }, [clearCollapseTimer])

  const handleContainerMouseLeave = useCallback(() => {
    hoverRef.current = false
    if (totalMediaCount > 0) {
      clearCollapseTimer()
      collapseTimerRef.current = setTimeout(() => setExpanded(false), 300)
    }
  }, [clearCollapseTimer, totalMediaCount])

  const handleItemMouseEnter = useCallback(() => {
    if (!isExpanded)
      setExpanded(true)
  }, [isExpanded])

  return {
    isExpanded,
    expandedContainerStyle,
    containerLeft,
    setExpanded,
    clearCollapseTimer,
    handleContainerMouseEnter,
    handleContainerMouseLeave,
    handleItemMouseEnter,
  }
}
