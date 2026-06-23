import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { usePublishDialogStorageStore } from '@/components/PublishDialog/usePublishDialogStorageStore'

const RESIZE_HANDLE_WIDTH = 10
const DEFAULT_DRAFT_RATIO = 0.52

interface DesktopPublishLayout {
  draftPanelWidth: number
  publishPanelWidth: number
}

interface DragState {
  startX: number
  startDraftWidth: number
  containerWidth: number
  latestLayout: DesktopPublishLayout
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getMinimumWidths(availableWidth: number) {
  const preferredDraftMin = 520
  const preferredPublishMin = 560
  const compactDraftMin = 320
  const compactPublishMin = 420

  if (availableWidth <= 0) {
    return {
      draftMin: 0,
      publishMin: 0,
    }
  }

  if (availableWidth >= preferredDraftMin + preferredPublishMin) {
    return {
      draftMin: preferredDraftMin,
      publishMin: preferredPublishMin,
    }
  }

  if (availableWidth >= compactDraftMin + compactPublishMin) {
    return {
      draftMin: compactDraftMin,
      publishMin: compactPublishMin,
    }
  }

  const draftMin = Math.floor(availableWidth * 0.45)

  return {
    draftMin,
    publishMin: Math.max(0, availableWidth - draftMin),
  }
}

function normalizeLayout(containerWidth: number, preferred?: Partial<DesktopPublishLayout>): DesktopPublishLayout {
  const availableWidth = Math.max(containerWidth - RESIZE_HANDLE_WIDTH, 0)
  const { draftMin, publishMin } = getMinimumWidths(availableWidth)
  const fallbackDraftWidth = Math.round(availableWidth * DEFAULT_DRAFT_RATIO)
  const maxDraftWidth = Math.max(draftMin, availableWidth - publishMin)
  const draftPanelWidth = clamp(
    preferred?.draftPanelWidth ?? fallbackDraftWidth,
    draftMin,
    maxDraftWidth,
  )

  return {
    draftPanelWidth,
    publishPanelWidth: Math.max(0, availableWidth - draftPanelWidth),
  }
}

export function useDesktopPublishLayout(): {
  containerRef: RefObject<HTMLDivElement>
  layout: DesktopPublishLayout | undefined
  resizeHandleWidth: number
  isDraftPanelOpen: boolean
  isResizing: boolean
  setDraftPanelOpen: (isOpen: boolean) => void
  handleResizeStart: (event: ReactPointerEvent<HTMLDivElement>) => void
} {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragStateRef = useRef<DragState | null>(null)
  const hasAppliedPersistedLayoutRef = useRef(false)
  const [containerWidth, setContainerWidth] = useState(() => {
    if (typeof window === 'undefined')
      return 0

    return window.innerWidth
  })
  const [layout, setLayout] = useState<DesktopPublishLayout>(() => {
    if (typeof window === 'undefined')
      return normalizeLayout(0)

    return normalizeLayout(window.innerWidth)
  })
  const [isResizing, setIsResizing] = useState(false)
  const [isRestoringLayout, setIsRestoringLayout] = useState(false)

  const {
    desktopLayout,
    setDesktopLayout,
    hydrated,
    isDesktopDraftPanelOpen,
    setDesktopDraftPanelOpen,
  } = usePublishDialogStorageStore(
    useShallow(state => ({
      desktopLayout: state.desktopLayout,
      setDesktopLayout: state.setDesktopLayout,
      hydrated: state._hasHydrated,
      isDesktopDraftPanelOpen: state.isDesktopDraftPanelOpen,
      setDesktopDraftPanelOpen: state.setDesktopDraftPanelOpen,
    })),
  )

  const isDraftPanelOpen = isDesktopDraftPanelOpen ?? true

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container)
      return

    const updateWidth = () => setContainerWidth(container.offsetWidth)
    updateWidth()

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? undefined
      : new ResizeObserver(updateWidth)
    resizeObserver?.observe(container)
    window.addEventListener('resize', updateWidth)

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updateWidth)
    }
  }, [])

  useLayoutEffect(() => {
    if (containerWidth <= 0 || dragStateRef.current)
      return

    const shouldApplyPersistedLayout = !hasAppliedPersistedLayoutRef.current && hydrated
    if (shouldApplyPersistedLayout) {
      hasAppliedPersistedLayoutRef.current = true
      setIsRestoringLayout(true)
    }

    setLayout(prev => normalizeLayout(containerWidth, shouldApplyPersistedLayout ? desktopLayout : prev))
  }, [containerWidth, desktopLayout, hydrated])

  useLayoutEffect(() => {
    if (!isRestoringLayout)
      return

    const animationFrameId = window.requestAnimationFrame(() => {
      setIsRestoringLayout(false)
    })

    return () => window.cancelAnimationFrame(animationFrameId)
  }, [isRestoringLayout])

  const handleResizeStart = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraftPanelOpen || !layout || containerWidth <= 0)
      return

    event.preventDefault()
    event.stopPropagation()

    dragStateRef.current = {
      startX: event.clientX,
      startDraftWidth: layout.draftPanelWidth,
      containerWidth,
      latestLayout: layout,
    }
    setIsResizing(true)

    const previousCursor = document.body.style.cursor
    const previousUserSelect = document.body.style.userSelect
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dragState = dragStateRef.current
      if (!dragState)
        return

      const nextLayout = normalizeLayout(dragState.containerWidth, {
        draftPanelWidth: dragState.startDraftWidth + moveEvent.clientX - dragState.startX,
      })
      dragState.latestLayout = nextLayout
      setLayout(nextLayout)
    }

    const handlePointerUp = () => {
      const nextLayout = dragStateRef.current?.latestLayout
      dragStateRef.current = null
      setIsResizing(false)
      document.body.style.cursor = previousCursor
      document.body.style.userSelect = previousUserSelect
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)

      if (nextLayout) {
        setDesktopLayout(nextLayout)
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }, [containerWidth, isDraftPanelOpen, layout, setDesktopLayout])

  return {
    containerRef,
    layout,
    resizeHandleWidth: RESIZE_HANDLE_WIDTH,
    isDraftPanelOpen,
    isResizing: isResizing || isRestoringLayout,
    setDraftPanelOpen: setDesktopDraftPanelOpen,
    handleResizeStart,
  }
}
