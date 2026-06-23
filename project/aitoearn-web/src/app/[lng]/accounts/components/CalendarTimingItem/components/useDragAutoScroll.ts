import type { XYCoord } from 'react-dnd'
import { useEffect, useRef } from 'react'

const SCROLL_EDGE_THRESHOLD = 96
const MAX_SCROLL_SPEED = 24

function isScrollableElement(element: Element): element is HTMLElement {
  if (!(element instanceof HTMLElement)) {
    return false
  }

  const style = window.getComputedStyle(element)
  const canScrollY = /auto|scroll|overlay/.test(style.overflowY)
  return canScrollY && element.scrollHeight > element.clientHeight + 1
}

function findScrollableParent(element: Element | null) {
  let current: Element | null = element

  while (current && current !== document.body) {
    if (isScrollableElement(current)) {
      return current
    }
    current = current.parentElement
  }

  return null
}

function findScrollContainer(clientOffset: XYCoord) {
  const elements = document.elementsFromPoint(clientOffset.x, clientOffset.y)

  for (const element of elements) {
    const scrollableParent = findScrollableParent(element)
    if (scrollableParent) {
      return scrollableParent
    }
  }

  const mainContent = document.getElementById('main-content')
  if (mainContent && isScrollableElement(mainContent)) {
    return mainContent
  }

  return null
}

function getScrollDelta(container: HTMLElement, pointerY: number) {
  const rect = container.getBoundingClientRect()
  const distanceToTop = pointerY - rect.top
  const distanceToBottom = rect.bottom - pointerY

  if (distanceToTop < SCROLL_EDGE_THRESHOLD && container.scrollTop > 0) {
    const ratio = (SCROLL_EDGE_THRESHOLD - Math.max(0, distanceToTop)) / SCROLL_EDGE_THRESHOLD
    return -Math.ceil(MAX_SCROLL_SPEED * ratio)
  }

  const maxScrollTop = container.scrollHeight - container.clientHeight
  if (distanceToBottom < SCROLL_EDGE_THRESHOLD && container.scrollTop < maxScrollTop) {
    const ratio = (SCROLL_EDGE_THRESHOLD - Math.max(0, distanceToBottom)) / SCROLL_EDGE_THRESHOLD
    return Math.ceil(MAX_SCROLL_SPEED * ratio)
  }

  return 0
}

export function useDragAutoScroll(enabled: boolean, clientOffset: XYCoord | null) {
  const frameRef = useRef<number | null>(null)
  const clientOffsetRef = useRef<XYCoord | null>(clientOffset)

  useEffect(() => {
    clientOffsetRef.current = clientOffset
  }, [clientOffset])

  useEffect(() => {
    if (!enabled) {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      return
    }

    const scroll = () => {
      const latestClientOffset = clientOffsetRef.current
      if (latestClientOffset) {
        const scrollContainer = findScrollContainer(latestClientOffset)
        if (scrollContainer) {
          const scrollDelta = getScrollDelta(scrollContainer, latestClientOffset.y)
          if (scrollDelta !== 0) {
            scrollContainer.scrollTop += scrollDelta
          }
        }
      }

      frameRef.current = requestAnimationFrame(scroll)
    }

    frameRef.current = requestAnimationFrame(scroll)

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [enabled])
}
