'use client'

import type { MutableRefObject } from 'react'
import type { ConfigSectionView } from '../types'
import { useCallback, useEffect, useRef, useState } from 'react'

function getSectionTop(container: HTMLElement, section: HTMLElement) {
  const containerRect = container.getBoundingClientRect()
  const sectionRect = section.getBoundingClientRect()
  return sectionRect.top - containerRect.top + container.scrollTop
}

export function useConfigSectionSpy(
  containerRef: MutableRefObject<HTMLDivElement | null>,
  sections: ConfigSectionView[],
) {
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? '')
  const rafRef = useRef<number | null>(null)
  const lockTimeoutRef = useRef<number | null>(null)
  const lockedSectionIdRef = useRef<string | null>(null)

  useEffect(() => {
    setActiveSectionId(sections[0]?.id ?? '')
  }, [sections])

  const updateActiveSection = useCallback(() => {
    const container = containerRef.current
    if (!container || lockedSectionIdRef.current)
      return

    const sectionElements = sections
      .map(section => container.querySelector<HTMLElement>(`[data-config-section-id="${section.id}"]`))
      .filter((element): element is HTMLElement => !!element)

    if (sectionElements.length === 0)
      return

    const checkpoint = container.scrollTop + 32
    const currentSection = sectionElements.reduce((current, element) => {
      const top = getSectionTop(container, element)
      if (top <= checkpoint)
        return element
      return current
    }, sectionElements[0])

    const sectionId = currentSection.dataset.configSectionId
    if (sectionId)
      setActiveSectionId(sectionId)
  }, [containerRef, sections])

  useEffect(() => {
    const container = containerRef.current
    if (!container)
      return

    const handleScroll = () => {
      if (rafRef.current !== null)
        cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(updateActiveSection)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    updateActiveSection()

    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (rafRef.current !== null)
        cancelAnimationFrame(rafRef.current)
      if (lockTimeoutRef.current !== null)
        window.clearTimeout(lockTimeoutRef.current)
    }
  }, [containerRef, updateActiveSection])

  const scrollToSection = useCallback((sectionId: string) => {
    const container = containerRef.current
    const target = container?.querySelector<HTMLElement>(`[data-config-section-id="${sectionId}"]`)
    if (!container || !target)
      return

    lockedSectionIdRef.current = sectionId
    setActiveSectionId(sectionId)

    if (lockTimeoutRef.current !== null)
      window.clearTimeout(lockTimeoutRef.current)

    container.scrollTo({
      top: Math.max(0, getSectionTop(container, target) - 12),
      behavior: 'smooth',
    })

    lockTimeoutRef.current = window.setTimeout(() => {
      lockedSectionIdRef.current = null
      updateActiveSection()
    }, 550)
  }, [containerRef, updateActiveSection])

  return { activeSectionId, scrollToSection }
}
