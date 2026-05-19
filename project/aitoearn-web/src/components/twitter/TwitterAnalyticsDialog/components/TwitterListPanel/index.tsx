import type { TwitterListPageLoader } from '../../types'
/**
 * TwitterListPanel - Twitter 列表资源面板
 * 展示 owned/followed/membership/pinned list 类接口结果。
 */
import type { TwitterList, TwitterPaginationMeta } from '@/api/types/twitter'
import { AlertCircle, List, Loader2, Lock, RefreshCw, Users } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/utils/format'

interface TwitterListPanelProps {
  title: string
  description?: string
  loadPage: TwitterListPageLoader
  reloadKey?: string
  emptyText?: string
  className?: string
}

export default function TwitterListPanel({
  title,
  description,
  loadPage,
  reloadKey,
  emptyText,
  className,
}: TwitterListPanelProps) {
  const { t } = useTransClient('account')
  const [items, setItems] = useState<TwitterList[]>([])
  const [meta, setMeta] = useState<TwitterPaginationMeta | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadPageRef = useRef(loadPage)
  const hasMore = Boolean(meta?.nextToken)

  useEffect(() => {
    loadPageRef.current = loadPage
  }, [loadPage])

  const fetchPage = useCallback(async (reset = false) => {
    if (loading)
      return
    if (!reset && !hasMore)
      return

    setLoading(true)
    setError('')
    if (reset) {
      setItems([])
      setMeta(undefined)
    }

    const paginationToken = reset ? undefined : meta?.nextToken
    const res = await loadPageRef.current(paginationToken)

    if (res?.code === 0 && res.data) {
      setItems(current => reset ? (res.data.data ?? []) : [...current, ...(res.data.data ?? [])])
      setMeta(res.data.meta)
    }
    else {
      setError(res?.message || t('twitter.loadFailed'))
    }
    setLoading(false)
  }, [hasMore, loading, meta?.nextToken, t])

  useEffect(() => {
    let cancelled = false

    async function loadInitial() {
      setLoading(true)
      setError('')
      setItems([])
      setMeta(undefined)

      const res = await loadPageRef.current()
      if (cancelled)
        return

      if (res?.code === 0 && res.data) {
        setItems(res.data.data ?? [])
        setMeta(res.data.meta)
      }
      else {
        setError(res?.message || t('twitter.loadFailed'))
      }
      setLoading(false)
    }

    loadInitial()

    return () => {
      cancelled = true
    }
  }, [reloadKey, t])

  const lastItemRef = useCallback((node: HTMLDivElement | null) => {
    if (loading)
      return
    if (observerRef.current)
      observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        fetchPage(false)
      }
    })

    if (node)
      observerRef.current.observe(node)
  }, [fetchPage, hasMore, loading])

  return (
    <section className={cn('flex h-full min-h-0 flex-col', className)}>
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => fetchPage(true)} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {t('twitter.refresh')}
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {items.length === 0 && loading && (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 rounded-md border border-border bg-muted/40" />
            ))}
          </div>
        )}

        {items.length === 0 && !loading && !error && (
          <div className="flex h-full min-h-[260px] items-center justify-center text-center text-sm text-muted-foreground">
            {emptyText || t('twitter.noLists')}
          </div>
        )}

        {items.length === 0 && !loading && error && (
          <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 text-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => fetchPage(true)}>
              {t('twitter.retry')}
            </Button>
          </div>
        )}

        {items.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((item, index) => {
              const isLast = index === items.length - 1
              return (
                <div
                  key={`${item.id}-${index}`}
                  ref={isLast ? lastItemRef : undefined}
                  className="rounded-md border border-border bg-background p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <List className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <h4 className="truncate text-sm font-semibold text-foreground">{item.name}</h4>
                        {item.private && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                      </div>
                      {item.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {formatNumber(item.memberCount ?? 0)}
                          {' '}
                          {t('twitter.members')}
                        </span>
                        <span>
                          {formatNumber(item.followerCount ?? 0)}
                          {' '}
                          {t('twitter.followers')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {items.length > 0 && loading && (
          <div className="flex items-center justify-center py-5">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </section>
  )
}
