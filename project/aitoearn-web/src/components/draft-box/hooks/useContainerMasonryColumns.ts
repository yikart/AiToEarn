/**
 * 容器宽度驱动的瀑布流列数计算
 * 用于嵌入面板场景，避免 react-masonry-css 只按屏幕宽度分列
 */

'use client'

import { useEffect, useRef, useState } from 'react'

const CONTAINER_MASONRY_BREAKPOINTS = [
  { minWidth: 1120, columns: 5 },
  { minWidth: 880, columns: 4 },
  { minWidth: 640, columns: 3 },
  { minWidth: 360, columns: 2 },
] as const

function getContainerMasonryColumns(width: number) {
  const matched = CONTAINER_MASONRY_BREAKPOINTS.find(item => width >= item.minWidth)
  return matched?.columns ?? 1
}

export function useContainerMasonryColumns(enabled: boolean) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [masonryColumns, setMasonryColumns] = useState(1)

  useEffect(() => {
    if (!enabled)
      return

    const container = containerRef.current
    if (!container)
      return

    const updateColumns = (width: number) => {
      setMasonryColumns(getContainerMasonryColumns(width))
    }

    updateColumns(container.offsetWidth)

    const resizeObserver = new ResizeObserver((entries) => {
      const [entry] = entries
      if (!entry)
        return

      updateColumns(entry.contentRect.width)
    })

    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [enabled])

  return { containerRef, masonryColumns }
}
