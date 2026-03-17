/**
 * useInView - 元素可见性检测 Hook
 * 用于替代 GSAP ScrollTrigger
 */

'use client'

import { useEffect, useRef, useState } from 'react'

interface UseInViewOptions {
  /** 触发阈值，0-1 之间 */
  threshold?: number
  /** 根元素边距 */
  rootMargin?: string
  /** 是否只触发一次 */
  triggerOnce?: boolean
}

export function useInView<T extends HTMLElement = HTMLElement>(
  options: UseInViewOptions = {},
): [React.RefObject<T>, boolean] {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = false } = options
  const ref = useRef<T>(null!) // Non-null assertion for ref compatibility
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element)
      return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting
        setIsInView(inView)

        // 如果只触发一次且已在视口内，停止观察
        if (triggerOnce && inView) {
          observer.unobserve(element)
        }
      },
      { threshold, rootMargin },
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [threshold, rootMargin, triggerOnce])

  return [ref, isInView]
}
