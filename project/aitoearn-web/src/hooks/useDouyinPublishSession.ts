/**
 * useDouyinPublishSession - 抖音发布会话轮询 Hook
 * 基于 publishRecordId 轮询发布结果，并支持 IndexedDB 恢复
 */

'use client'

import type { DouyinPublishSessionRecord } from '@/store/douyinPublishSession'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getPublishRecordDetailById } from '@/api/platforms/publish.api'
import { useDouyinPublishSessionStore } from '@/store/douyinPublishSession'

const DEFAULT_POLL_INTERVAL = 5000

function normalizeStatus(status: string | number | undefined) {
  return String(status ?? '').toLowerCase()
}

function isPublishedStatus(status: string | number | undefined) {
  const normalized = normalizeStatus(status)
  return normalized === '1' || normalized === 'published' || normalized === 'released'
}

function isFailedStatus(status: string | number | undefined) {
  const normalized = normalizeStatus(status)
  return normalized === '-1' || normalized === 'fail' || normalized === 'failed' || normalized === 'updated_failed'
}

interface UseDouyinPublishSessionOptions {
  sessionKey: string
  enabled?: boolean
  pollInterval?: number
  onPublished?: (session: DouyinPublishSessionRecord) => Promise<boolean | void> | boolean | void
}

export function useDouyinPublishSession({
  sessionKey,
  enabled = true,
  pollInterval = DEFAULT_POLL_INTERVAL,
  onPublished,
}: UseDouyinPublishSessionOptions) {
  const record = useDouyinPublishSessionStore(state => state.records[sessionKey])
  const [polling, setPolling] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const requestRef = useRef(false)
  const callbackRef = useRef(false)
  const activeRecordIdRef = useRef<string | null>(null)

  const session = useMemo(() => {
    if (!record || record.expiresAt <= Date.now())
      return null
    return record
  }, [record])

  const clearSession = useCallback(() => {
    useDouyinPublishSessionStore.getState().clearSession(sessionKey)
  }, [sessionKey])

  const createSession = useCallback((payload: {
    publishRecordId: string
    shortLink?: string | null
    permalink?: string | null
    status?: DouyinPublishSessionRecord['status']
    workLink?: string
    errorMsg?: string
  }) => {
    return useDouyinPublishSessionStore.getState().setSession(sessionKey, payload)
  }, [sessionKey])

  const markManualSubmitted = useCallback(() => {
    useDouyinPublishSessionStore.getState().markSubmitted(sessionKey, 'manual')
  }, [sessionKey])

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setPolling(false)
  }, [])

  const pollOnce = useCallback(async () => {
    const current = useDouyinPublishSessionStore.getState().getSession(sessionKey)
    if (!current?.publishRecordId || requestRef.current)
      return current

    const now = Date.now()
    if (current.lastPolledAt && now - current.lastPolledAt < pollInterval - 100)
      return current

    useDouyinPublishSessionStore.getState().setSession(sessionKey, {
      publishRecordId: current.publishRecordId,
      lastPolledAt: now,
    })

    requestRef.current = true
    try {
      const response = await getPublishRecordDetailById(current.publishRecordId)
      const data = response?.data
      if (!data) {
        useDouyinPublishSessionStore.getState().markPolling(sessionKey)
        return current
      }

      if (isPublishedStatus(data.status)) {
        if (!data.workLink) {
          useDouyinPublishSessionStore.getState().markPolling(sessionKey, {
            errorMsg: data.errorMsg,
          })
          return useDouyinPublishSessionStore.getState().getSession(sessionKey)
        }

        useDouyinPublishSessionStore.getState().markPublished(sessionKey, {
          workLink: data.workLink,
          errorMsg: data.errorMsg,
        })
        const latest = useDouyinPublishSessionStore.getState().getSession(sessionKey)
        let shouldStop = !onPublished

        if (latest?.manualSubmittedAt || latest?.autoSubmittedAt)
          shouldStop = true

        if (latest && onPublished && !latest.autoSubmittedAt && !latest.manualSubmittedAt && !callbackRef.current) {
          callbackRef.current = true
          try {
            const result = await onPublished(latest)
            if (result !== false) {
              useDouyinPublishSessionStore.getState().markSubmitted(sessionKey, 'auto')
              shouldStop = true
            }
            else {
              shouldStop = false
            }
          }
          finally {
            callbackRef.current = false
          }
        }

        if (shouldStop)
          stopPolling()

        return useDouyinPublishSessionStore.getState().getSession(sessionKey)
      }

      if (isFailedStatus(data.status)) {
        useDouyinPublishSessionStore.getState().markFailed(sessionKey, data.errorMsg)
        stopPolling()
        return useDouyinPublishSessionStore.getState().getSession(sessionKey)
      }

      useDouyinPublishSessionStore.getState().markPolling(sessionKey, {
        workLink: data.workLink,
        errorMsg: data.errorMsg,
      })
      return useDouyinPublishSessionStore.getState().getSession(sessionKey)
    }
    catch {
      return useDouyinPublishSessionStore.getState().getSession(sessionKey)
    }
    finally {
      requestRef.current = false
    }
  }, [onPublished, sessionKey, stopPolling])

  const startPolling = useCallback(() => {
    const current = useDouyinPublishSessionStore.getState().getSession(sessionKey)
    if (!enabled || !current || current.status === 'failed')
      return

    if (timerRef.current && activeRecordIdRef.current === current.publishRecordId)
      return

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    activeRecordIdRef.current = current.publishRecordId
    setPolling(true)
    void pollOnce()
    timerRef.current = setInterval(() => {
      void pollOnce()
    }, pollInterval)
  }, [enabled, pollInterval, pollOnce, sessionKey])

  useEffect(() => {
    useDouyinPublishSessionStore.getState().clearExpiredSessions()
  }, [])

  useEffect(() => {
    if (!enabled) {
      stopPolling()
      activeRecordIdRef.current = null
      return
    }

    if (!session) {
      stopPolling()
      activeRecordIdRef.current = null
      return
    }

    if (session.status === 'failed' || session.autoSubmittedAt || session.manualSubmittedAt) {
      stopPolling()
      activeRecordIdRef.current = null
      return
    }

    startPolling()
    return () => {
      stopPolling()
      activeRecordIdRef.current = null
    }
  }, [enabled, session?.publishRecordId, session?.status, session?.autoSubmittedAt, session?.manualSubmittedAt, startPolling, stopPolling])

  return {
    session,
    polling,
    createSession,
    clearSession,
    markManualSubmitted,
    pollOnce,
    startPolling,
    stopPolling,
  }
}
