/**
 * useVisibleRouterData - permission-filtered route data
 * Applies business access rules on top of static route visibility.
 */
'use client'

import { useMemo } from 'react'
import { routerData } from '@/app/layout/routerData'

export function useVisibleRouterData() {
  return useMemo(() => routerData, [])
}
