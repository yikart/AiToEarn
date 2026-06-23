/**
 * douyinPublishSession - 抖音 H5 发布会话持久化 Store
 * Stores Douyin publish polling sessions for 10-minute recovery.
 */

import { createPersistStore } from '@/utils/storage/createPersistStore'

export const DOUYIN_PUBLISH_SESSION_TTL = 10 * 60 * 1000

export type DouyinPublishSessionStatus = 'idle' | 'polling' | 'published' | 'failed'
export type DouyinPublishSubmitType = 'auto' | 'manual'

export interface DouyinPublishSessionRecord {
  publishRecordId: string
  shortLink: string | null
  permalink: string | null
  status: DouyinPublishSessionStatus
  workLink?: string
  errorMsg?: string
  createdAt: number
  updatedAt: number
  expiresAt: number
  lastPolledAt?: number
  autoSubmittedAt?: number
  manualSubmittedAt?: number
}

interface DouyinPublishSessionState {
  records: Record<string, DouyinPublishSessionRecord>
}

function isExpired(record?: DouyinPublishSessionRecord | null) {
  return !record || record.expiresAt <= Date.now()
}

export const useDouyinPublishSessionStore = createPersistStore<DouyinPublishSessionState, {
  getSession: (sessionKey: string) => DouyinPublishSessionRecord | null
  setSession: (
    sessionKey: string,
    payload: Pick<DouyinPublishSessionRecord, 'publishRecordId'> & Partial<Omit<DouyinPublishSessionRecord, 'publishRecordId' | 'createdAt' | 'updatedAt' | 'expiresAt'>>,
  ) => DouyinPublishSessionRecord
  markPublished: (sessionKey: string, payload?: Partial<Pick<DouyinPublishSessionRecord, 'workLink' | 'errorMsg' | 'shortLink' | 'permalink'>>) => void
  markFailed: (sessionKey: string, errorMsg?: string) => void
  markPolling: (sessionKey: string, payload?: Partial<Pick<DouyinPublishSessionRecord, 'workLink' | 'errorMsg'>>) => void
  markSubmitted: (sessionKey: string, type: DouyinPublishSubmitType) => void
  clearSession: (sessionKey: string) => void
  clearExpiredSessions: () => void
}>(
  { records: {} },
  (set, get) => {
    const methods = {
      getSession(sessionKey: string) {
        const record = get().records[sessionKey]
        if (isExpired(record)) {
          if (record)
            methods.clearSession(sessionKey)
          return null
        }
        return record
      },
      setSession(sessionKey: string, payload: Pick<DouyinPublishSessionRecord, 'publishRecordId'> & Partial<Omit<DouyinPublishSessionRecord, 'publishRecordId' | 'createdAt' | 'updatedAt' | 'expiresAt'>>) {
        const now = Date.now()
        const current = get().records[sessionKey]
        const next: DouyinPublishSessionRecord = {
          publishRecordId: payload.publishRecordId,
          shortLink: payload.shortLink ?? current?.shortLink ?? null,
          permalink: payload.permalink ?? current?.permalink ?? null,
          status: payload.status ?? current?.status ?? 'polling',
          workLink: payload.workLink ?? current?.workLink,
          errorMsg: payload.errorMsg ?? current?.errorMsg,
          createdAt: current?.createdAt ?? now,
          updatedAt: now,
          expiresAt: now + DOUYIN_PUBLISH_SESSION_TTL,
          lastPolledAt: payload.lastPolledAt ?? current?.lastPolledAt,
          autoSubmittedAt: payload.autoSubmittedAt ?? current?.autoSubmittedAt,
          manualSubmittedAt: payload.manualSubmittedAt ?? current?.manualSubmittedAt,
        }
        set(state => ({
          records: {
            ...state.records,
            [sessionKey]: next,
          },
        }))
        return next
      },
      markPublished(sessionKey: string, payload?: Partial<Pick<DouyinPublishSessionRecord, 'workLink' | 'errorMsg' | 'shortLink' | 'permalink'>>) {
        const current = methods.getSession(sessionKey)
        if (!current)
          return
        methods.setSession(sessionKey, {
          publishRecordId: current.publishRecordId,
          status: 'published',
          shortLink: payload?.shortLink ?? current.shortLink,
          permalink: payload?.permalink ?? current.permalink,
          workLink: payload?.workLink ?? current.workLink,
          errorMsg: payload?.errorMsg,
        })
      },
      markFailed(sessionKey: string, errorMsg?: string) {
        const current = methods.getSession(sessionKey)
        if (!current)
          return
        methods.setSession(sessionKey, {
          publishRecordId: current.publishRecordId,
          status: 'failed',
          errorMsg,
        })
      },
      markPolling(sessionKey: string, payload?: Partial<Pick<DouyinPublishSessionRecord, 'workLink' | 'errorMsg'>>) {
        const current = methods.getSession(sessionKey)
        if (!current)
          return
        methods.setSession(sessionKey, {
          publishRecordId: current.publishRecordId,
          status: 'polling',
          workLink: payload?.workLink ?? current.workLink,
          errorMsg: payload?.errorMsg,
        })
      },
      markSubmitted(sessionKey: string, type: DouyinPublishSubmitType) {
        const current = methods.getSession(sessionKey)
        if (!current)
          return
        const now = Date.now()
        methods.setSession(sessionKey, {
          publishRecordId: current.publishRecordId,
          autoSubmittedAt: type === 'auto' ? now : current.autoSubmittedAt,
          manualSubmittedAt: type === 'manual' ? now : current.manualSubmittedAt,
        })
      },
      clearSession(sessionKey: string) {
        set((state) => {
          const next = { ...state.records }
          delete next[sessionKey]
          return { records: next }
        })
      },
      clearExpiredSessions() {
        set((state) => {
          const next = Object.fromEntries(
            Object.entries(state.records).filter(([, record]) => !isExpired(record)),
          )
          return { records: next }
        })
      },
    }

    return methods
  },
  {
    name: 'douyin-publish-session',
    version: 1,
  },
  'indexedDB',
)
