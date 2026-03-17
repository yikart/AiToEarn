/**
 * ShareModal - 分享对话弹窗组件
 * 用于选择消息、生成分享链接和导出长图
 */
'use client'

import type { TaskDetail } from '@/api/agent'
import { Copy, Link2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { agentApi } from '@/api/agent'
import { convertMessages } from '@/app/[lng]/chat/[taskId]/utils'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { PubType } from '@/app/config/publishConfig'
import { useTransClient } from '@/app/i18n/client'
import ChatMessage from '@/components/Chat/ChatMessage'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { useAccountStore } from '@/store/account'
import { useUserStore } from '@/store/user'
import { usePublishDialogStorageStore } from '../PublishDialog/usePublishDialogStorageStore'
import { generateImageFromMessages } from './generateShareImages'

interface ShareModalProps {
  taskId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}

// 有效期选项（秒）
const VALIDITY_OPTIONS = [
  { value: 86400, labelKey: 'validity1Day' },
  { value: 259200, labelKey: 'validity3Days' },
  { value: 604800, labelKey: 'validity7Days' },
  { value: 1296000, labelKey: 'validity15Days' },
  { value: 2592000, labelKey: 'validity30Days' },
]

export function ShareModal({ taskId, open = false, onOpenChange, trigger }: ShareModalProps) {
  const { t } = useTransClient('share')
  const router = useRouter()
  const [visible, setVisible] = useState(open)
  const [loading, setLoading] = useState(false)
  const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const user = useUserStore(s => s.userInfo)
  const { accountList, getAccountList } = useAccountStore()

  // 有效期状态（默认15天）
  const [validitySeconds, setValiditySeconds] = useState(1296000)

  // 分享链接状态
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [shareExpiresAt, setShareExpiresAt] = useState<string | null>(null)
  const [generatingLink, setGeneratingLink] = useState(false)

  // 图片生成状态
  const [generatingImage, setGeneratingImage] = useState(false)

  useEffect(() => {
    setVisible(open)
  }, [open])

  // 重置分享链接状态（当有效期改变时）
  useEffect(() => {
    setShareLink(null)
    setShareExpiresAt(null)
  }, [validitySeconds])

  useEffect(() => {
    if (!taskId || !visible)
      return

    const load = async () => {
      try {
        setLoading(true)
        const res = await agentApi.getTaskDetail(taskId)

        if (res?.data) {
          setTaskDetail(res.data)
          const converted = convertMessages(res.data.messages || [])
          const displayIds = converted.map(m => m.id)
          setSelectedIds(displayIds)
          setCollapsedIds(new Set(displayIds))
        }
        else {
          toast.error('Failed to load task detail: No data received')
        }
      }
      catch (err) {
        console.error('Failed to load task detail:', err)
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
        toast.error(`Failed to load task detail: ${errorMessage}`)
      }
      finally {
        setLoading(false)
      }
    }

    load()
  }, [taskId, visible])

  const messages = useMemo(() => {
    if (!taskDetail?.messages)
      return []
    return convertMessages(taskDetail.messages)
  }, [taskDetail?.messages])

  // 折叠状态
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id))
        next.delete(id)
      else next.add(id)
      return next
    })
  }

  const messageRefs = React.useRef<Map<string, HTMLDivElement>>(new Map())
  const [longIds, setLongIds] = useState<Set<string>>(new Set())
  // 测量完成标志，避免测量前后的高度突变导致抖动
  const [measured, setMeasured] = useState(false)

  React.useEffect(() => {
    setMeasured(false) // 重置测量状态
    const measure = () => {
      const next = new Set<string>()
      messageRefs.current.forEach((el, id) => {
        try {
          if (el && el.scrollHeight > 60)
            next.add(id)
        }
        catch {
          // ignore
        }
      })
      setLongIds(next)
      setMeasured(true) // 标记测量完成
    }

    const t = setTimeout(measure, 150)
    const ro = new ResizeObserver(measure)
    messageRefs.current.forEach((el) => {
      if (el)
        ro.observe(el)
    })
    window.addEventListener('resize', measure)
    return () => {
      clearTimeout(t)
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [messages])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id))
        return prev.filter(p => p !== id)
      return [...prev, id]
    })
  }, [])

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setVisible(open)
      onOpenChange?.(open)
      if (!open) {
        // 重置状态
        setShareLink(null)
        setShareExpiresAt(null)
      }
    },
    [onOpenChange],
  )

  // 生成分享链接
  const handleGenerateLink = useCallback(async () => {
    setGeneratingLink(true)
    try {
      const res = await agentApi.createPublicShare(taskId, validitySeconds)
      if (res?.data) {
        const baseUrl
          = typeof window !== 'undefined' ? window.location.origin : 'https://aitoearn.ai'
        const fullUrl = `${baseUrl}/chat?token=${res.data.token}`
        setShareLink(fullUrl)
        setShareExpiresAt(res.data.expiresAt)
        toast.success(t('linkCopied'))
        // 自动复制到剪贴板
        await navigator.clipboard.writeText(fullUrl)
      }
    }
    catch (err) {
      console.error('Failed to generate share link:', err)
      toast.error('Failed to generate share link')
    }
    finally {
      setGeneratingLink(false)
    }
  }, [taskId, validitySeconds, t])

  // 复制链接
  const handleCopyLink = useCallback(async () => {
    if (!shareLink)
      return
    try {
      await navigator.clipboard.writeText(shareLink)
      toast.success(t('linkCopied'))
    }
    catch {
      toast.error('Failed to copy link')
    }
  }, [shareLink, t])

  // Agent 分享（传递链接）
  const handleAgentShare = useCallback(async () => {
    let link = shareLink
    if (!link) {
      // 先生成链接
      setGeneratingLink(true)
      try {
        const res = await agentApi.createPublicShare(taskId, validitySeconds)
        if (res?.data) {
          const baseUrl
            = typeof window !== 'undefined' ? window.location.origin : 'https://aitoearn.ai'
          link = `${baseUrl}/chat?token=${res.data.token}`
          setShareLink(link)
          setShareExpiresAt(res.data.expiresAt)
        }
      }
      catch (err) {
        console.error('Failed to generate share link:', err)
        toast.error('Failed to generate share link')
        return
      }
      finally {
        setGeneratingLink(false)
      }
    }

    if (!link)
      return

    const payloadPrompt = `${t('agentSharePrompt')}\n\n${link}`
    const params = new URLSearchParams()
    params.set('aiGenerated', 'true')
    params.set('description', encodeURIComponent(payloadPrompt))

    handleOpenChange(false)
    router.push(`/?${params.toString()}`)
    toast.success(t('agentShareSaved'))
  }, [shareLink, taskId, validitySeconds, t, handleOpenChange, router])

  // 发布分享（传递链接）
  const handlePublishShare = useCallback(async () => {
    let link = shareLink
    if (!link) {
      // 先生成链接
      setGeneratingLink(true)
      try {
        const res = await agentApi.createPublicShare(taskId, validitySeconds)
        if (res?.data) {
          const baseUrl
            = typeof window !== 'undefined' ? window.location.origin : 'https://aitoearn.ai'
          link = `${baseUrl}/chat?token=${res.data.token}`
          setShareLink(link)
          setShareExpiresAt(res.data.expiresAt)
        }
      }
      catch (err) {
        console.error('Failed to generate share link:', err)
        toast.error('Failed to generate share link')
        return
      }
      finally {
        setGeneratingLink(false)
      }
    }

    if (!link)
      return

    try {
      usePublishDialogStorageStore.getState().clearPubData()

      if (!accountList || accountList.length === 0) {
        await getAccountList()
      }

      const candidates = (useAccountStore.getState().accountList || []).filter((acc) => {
        const plat = AccountPlatInfoMap.get(acc.type as any)
        return acc.status !== 0 && plat?.pubTypes?.has(PubType.ImageText)
      })

      if (!candidates || candidates.length === 0) {
        toast.error(t('noAvailablePublishAccounts'))
        return
      }

      const description = `${t('publishShareDescription')}\n\n${link}`
      const tags = ['aitoearn', 'agent']

      const params = new URLSearchParams()
      params.set('aiGenerated', 'true')
      params.set('description', encodeURIComponent(description))
      params.set('title', '')
      params.set('tags', encodeURIComponent(JSON.stringify(tags)))
      params.set('accountId', candidates[0].id)

      handleOpenChange(false)
      router.push(`/accounts?${params.toString()}`)
    }
    catch (e) {
      console.error(e)
      toast.error(t('publishShareFailed') || 'Failed to prepare publish')
    }
  }, [shareLink, taskId, validitySeconds, accountList, getAccountList, t, handleOpenChange, router])

  // 下载长图
  const handleDownloadImage = useCallback(async () => {
    if (!messages || messages.length === 0) {
      toast.error('No messages available')
      return
    }

    const selectedMessages = messages.filter(m => selectedIds.includes(m.id))
    if (selectedMessages.length === 0) {
      toast.error('Please select at least one message to share')
      return
    }

    // 确保有分享链接
    let link = shareLink
    let expiresAt = shareExpiresAt
    if (!link) {
      setGeneratingLink(true)
      try {
        const res = await agentApi.createPublicShare(taskId, validitySeconds)
        if (res?.data) {
          const baseUrl
            = typeof window !== 'undefined' ? window.location.origin : 'https://aitoearn.ai'
          link = `${baseUrl}/chat?token=${res.data.token}`
          expiresAt = res.data.expiresAt
          setShareLink(link)
          setShareExpiresAt(expiresAt)
        }
      }
      catch (err) {
        console.error('Failed to generate share link:', err)
        toast.error('Failed to generate share link')
        return
      }
      finally {
        setGeneratingLink(false)
      }
    }

    setGeneratingImage(true)
    try {
      const blobs = await generateImageFromMessages(selectedMessages, user?.name, {
        appTitle: t('appName'),
        appUrl: t('appUrl'),
        shareUrl: link || undefined,
        expiresAt: expiresAt || undefined,
      })
      if (!blobs || blobs.length === 0)
        throw new Error('No images were generated')

      // 直接下载
      for (let i = 0; i < blobs.length; i++) {
        const blob = blobs[i]
        const a = document.createElement('a')
        const url = URL.createObjectURL(blob)
        a.href = url
        a.download
          = blobs.length === 1
            ? `aitoearn_conversation_${taskId}.png`
            : `aitoearn_${taskId}_${i + 1}.png`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      }
      toast.success(t('download'))
    }
    catch (err) {
      console.error('Failed to generate images:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      toast.error(`Failed to generate images: ${errorMessage}`)
    }
    finally {
      setGeneratingImage(false)
    }
  }, [messages, selectedIds, user?.name, t, shareLink, shareExpiresAt, taskId, validitySeconds])

  const messageListContent = loading ? (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  ) : (
    messages.map((message) => {
      const isUser = message.role === 'user'
      const isSelected = selectedIds.includes(message.id)
      const isCollapsed = collapsedIds.has(message.id)
      const isLong
        = longIds.has(message.id)
          || !!(message.content && message.content.length > 60)
          || (message.medias && message.medias.length > 0)

      const checkbox = (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.checked) {
              setSelectedIds(prev => Array.from(new Set([...prev, message.id])))
            }
            else {
              setSelectedIds(prev => prev.filter(id => id !== message.id))
            }
          }}
          className="mt-1 h-4 w-4 cursor-pointer rounded border-border accent-primary"
        />
      )

      const onMessageClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement | null
        if (!target)
          return
        if (target.closest('a,button,input,textarea,select,video'))
          return
        toggleSelect(message.id)
      }

      return (
        <div key={message.id} className="relative">
          <div
            onClick={onMessageClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ')
                toggleSelect(message.id)
            }}
            className={cn(
              'flex items-start gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg transition-colors cursor-pointer',
              isSelected ? 'bg-muted/50 ring-1 ring-border/50' : 'bg-card hover:bg-muted/30',
            )}
            ref={(el) => {
              if (el)
                messageRefs.current.set(message.id, el as HTMLDivElement)
              else messageRefs.current.delete(message.id)
            }}
          >
            {!isUser && <div className="mt-1">{checkbox}</div>}

            <div className="flex-1 min-w-0">
              {/* 移动端不折叠，桌面端才应用折叠样式 */}
              <div
                className={cn(
                  measured && isLong && isCollapsed && 'md:max-h-10 md:overflow-hidden md:relative',
                )}
              >
                <ChatMessage
                  role={message.role === 'system' ? 'assistant' : message.role}
                  content={message.content}
                  medias={message.medias}
                  status={message.status}
                  errorMessage={message.errorMessage}
                  createdAt={message.createdAt}
                  steps={message.steps}
                  actions={message.actions}
                  publishFlows={message.publishFlows}
                  className="max-w-full"
                />
                {/* 渐变遮罩：移动端隐藏，桌面端显示 */}
                {measured && isLong && isCollapsed && (
                  <div className="hidden md:block absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background to-transparent" />
                )}
              </div>
            </div>

            {isUser && <div className="mt-1">{checkbox}</div>}
          </div>

          {/* 折叠按钮：移动端隐藏，桌面端显示 */}
          {measured && isLong && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toggleCollapse(message.id)
              }}
              title={isCollapsed ? t('showMore') : t('collapse')}
              className={cn(
                'hidden md:flex absolute top-3 z-20 w-9 h-9 items-center justify-center',
                'bg-background border border-border rounded-full shadow-sm',
                'hover:bg-muted/80 cursor-pointer transition-colors',
                isUser ? 'left-3' : 'right-3',
              )}
            >
              <span className="text-xs">{isCollapsed ? '▾' : '▴'}</span>
            </button>
          )}
        </div>
      )
    })
  )

  return (
    <Dialog open={visible} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      {/* 移动端全屏，桌面端正常弹窗 */}
      <DialogContent
        // 移动端禁用 backdrop-blur 避免性能问题导致抖动
        overlayClassName="backdrop-blur-none md:backdrop-blur-sm"
        className={cn(
          // 使用 flex 布局让内部 flex-1 正常工作
          'flex flex-col',
          // 移动端全屏：禁用所有动画避免抖动
          'inset-0 translate-x-0 translate-y-0 w-full h-[100svh] max-w-none rounded-none p-0 gap-0',
          'duration-0 animate-none',
          'data-[state=open]:zoom-in-0 data-[state=closed]:zoom-out-0',
          'data-[state=open]:slide-in-from-bottom-0 data-[state=closed]:slide-out-to-bottom-0',
          // 桌面端恢复正常弹窗样式和动画
          'md:inset-auto md:left-[50%] md:top-[50%] md:translate-x-[-50%] md:translate-y-[-50%]',
          'md:w-[95vw] md:max-w-5xl md:h-[85vh] md:max-h-[85vh] md:rounded-xl md:p-6',
          'md:duration-500 md:animate-in',
          'md:data-[state=open]:zoom-in-95 md:data-[state=closed]:zoom-out-95',
        )}
      >
        <DialogHeader className="p-4 md:p-0 md:pb-4 border-b md:border-b-0 shrink-0">
          <DialogTitle className="text-base md:text-lg">{t('title')}</DialogTitle>
          <DialogDescription className="text-xs md:text-sm">{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden [contain:strict]">
          {/* 左侧：消息选择区域 */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0 p-4 md:pr-4 [contain:layout]">
            {/* 操作按钮区域 - 移动端更紧凑 */}
            <div className="flex items-center justify-between gap-2 p-2 md:p-3 border rounded-lg bg-muted/30 mb-3 md:mb-4 shrink-0">
              <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allIds = messages.map(m => m.id)
                    setSelectedIds(allIds)
                  }}
                  className="cursor-pointer text-xs h-7 px-2 md:px-3"
                >
                  {t('selectAll')}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer text-xs h-7 px-2 md:px-3"
                    >
                      {t('selectRecent')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => {
                        const recentCount = Math.min(5, messages.length)
                        const recentIds = messages.slice(-recentCount).map(m => m.id)
                        setSelectedIds(recentIds)
                      }}
                    >
                      {t('recent5')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const recentCount = Math.min(10, messages.length)
                        const recentIds = messages.slice(-recentCount).map(m => m.id)
                        setSelectedIds(recentIds)
                      }}
                    >
                      {t('recent10')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const recentCount = Math.min(20, messages.length)
                        const recentIds = messages.slice(-recentCount).map(m => m.id)
                        setSelectedIds(recentIds)
                      }}
                    >
                      {t('recent20')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedIds([])}
                  className="cursor-pointer text-xs h-7 px-2 md:px-3"
                >
                  {t('clearSelection')}
                </Button>
              </div>

              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {selectedIds.length}
              </div>
            </div>

            {/* 消息列表 - 阻止滚动事件冒泡到 Radix 滚动锁定层 */}
            <div
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain border rounded-lg p-3 md:p-4 space-y-3 md:space-y-4"
              onWheel={e => e.stopPropagation()}
              onTouchMove={e => e.stopPropagation()}
            >
              {messageListContent}
            </div>
          </div>

          {/* 右侧：配置和操作区域 - 移动端底部固定 */}
          <div className="w-full md:w-72 shrink-0 border-t md:border-t-0 md:border-l bg-background p-4 md:overflow-y-auto">
            {/* 移动端：水平紧凑布局 */}
            <div className="md:hidden space-y-2">
              {/* 有效期 + 链接 一行 */}
              <div className="flex items-center gap-2">
                <Select
                  value={String(validitySeconds)}
                  onValueChange={v => setValiditySeconds(Number(v))}
                >
                  <SelectTrigger className="cursor-pointer h-8 text-xs flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VALIDITY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {t(opt.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* 复制链接按钮 - 使用主题色更明显 */}
                {shareLink ? (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleCopyLink}
                    className="cursor-pointer h-8 px-2.5 gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-xs">{t('copyLink')}</span>
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleGenerateLink}
                    loading={generatingLink}
                    className="cursor-pointer h-8 px-2.5 gap-1"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span className="text-xs">{t('copyLink')}</span>
                  </Button>
                )}
              </div>

              {/* 操作按钮 一行 */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAgentShare}
                  loading={generatingLink}
                  className="flex-1 cursor-pointer h-8 text-xs"
                >
                  {t('agentShare')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePublishShare}
                  loading={generatingLink}
                  className="flex-1 cursor-pointer h-8 text-xs"
                >
                  {t('publishShare')}
                </Button>
              </div>

              {/* 主操作按钮 一行 */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleDownloadImage}
                  disabled={selectedIds.length === 0}
                  loading={generatingImage || generatingLink}
                  className="flex-1 cursor-pointer h-9 text-xs"
                >
                  {generatingImage ? t('generating') : t('downloadImage')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleOpenChange(false)}
                  className="cursor-pointer h-9 px-3"
                >
                  {t('cancel')}
                </Button>
              </div>
            </div>

            {/* 桌面端：原有垂直布局 */}
            <div className="hidden md:flex md:flex-col md:gap-4 md:h-full">
              {/* 有效期选择 */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="text-sm font-medium">{t('validityLabel')}</div>
                <Select
                  value={String(validitySeconds)}
                  onValueChange={v => setValiditySeconds(Number(v))}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VALIDITY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {t(opt.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 分享链接 */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="text-sm font-medium flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  {t('shareLink')}
                </div>

                {shareLink ? (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground break-all bg-muted/50 p-2 rounded">
                      {shareLink}
                    </div>
                    {shareExpiresAt && (
                      <div className="text-xs text-muted-foreground">
                        {t('expiresAt')}
                        :
                        {new Date(shareExpiresAt).toLocaleString()}
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="w-full cursor-pointer"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {t('copyLink')}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateLink}
                    loading={generatingLink}
                    className="w-full cursor-pointer"
                  >
                    {generatingLink ? t('generatingLink') : t('copyLink')}
                  </Button>
                )}
              </div>

              {/* 分享方式 */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="text-sm font-medium">{t('shareActions')}</div>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAgentShare}
                    loading={generatingLink}
                    className="w-full cursor-pointer"
                  >
                    {t('agentShare')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePublishShare}
                    loading={generatingLink}
                    className="w-full cursor-pointer"
                  >
                    {t('publishShare')}
                  </Button>
                </div>
              </div>

              {/* 下载长图 */}
              <Button
                onClick={handleDownloadImage}
                disabled={selectedIds.length === 0}
                loading={generatingImage || generatingLink}
                className="w-full cursor-pointer"
              >
                {generatingImage ? t('generating') : t('downloadImage')}
              </Button>

              {/* 取消按钮 */}
              <Button
                variant="secondary"
                onClick={() => handleOpenChange(false)}
                className="w-full cursor-pointer"
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ShareModal
