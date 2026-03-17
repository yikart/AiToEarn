/**
 * UploadProgress - 上传进度浮动面板
 * 显示批量上传的进度和状态
 */

'use client'

import type { UploadTask } from '../../albumStore'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, ChevronDown, ChevronUp, Loader2, X, XCircle } from 'lucide-react'
import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useAlbumStore } from '../../albumStore'

export function UploadProgress() {
  const { t } = useTransClient('material')
  const [isCollapsed, setIsCollapsed] = useState(false)

  const { uploadQueue, cancelUpload, clearCompletedUploads } = useAlbumStore(
    useShallow(state => ({
      uploadQueue: state.uploadQueue,
      cancelUpload: state.cancelUpload,
      clearCompletedUploads: state.clearCompletedUploads,
    })),
  )

  // 没有上传任务时不显示
  if (uploadQueue.length === 0) {
    return null
  }

  // 计算统计信息
  const completedCount = uploadQueue.filter(t => t.status === 'success').length
  const errorCount = uploadQueue.filter(t => t.status === 'error').length
  const uploadingCount = uploadQueue.filter(
    t => t.status === 'uploading' || t.status === 'pending',
  ).length
  const totalProgress = uploadQueue.reduce((acc, t) => acc + t.progress, 0) / uploadQueue.length

  // 获取任务状态图标
  const getStatusIcon = (task: UploadTask) => {
    switch (task.status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive shrink-0" />
      case 'uploading':
        return <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-4 right-4 z-50 w-80 bg-card border border-border rounded-lg shadow-xl overflow-hidden"
    >
      {/* 头部 */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-muted/50 cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          {uploadingCount > 0 && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
          <span className="font-medium text-sm">{t('mediaManagement.uploadProgress')}</span>
          <span className="text-xs text-muted-foreground">
            (
            {completedCount}
            /
            {uploadQueue.length}
            )
          </span>
        </div>
        <div className="flex items-center gap-1">
          {(completedCount > 0 || errorCount > 0) && (
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6"
              onClick={(e) => {
                e.stopPropagation()
                clearCompletedUploads()
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
          {isCollapsed ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* 总进度条 */}
      {!isCollapsed && uploadingCount > 0 && (
        <div className="px-4 py-2 border-b border-border">
          <Progress value={totalProgress} className="h-1" />
        </div>
      )}

      {/* 任务列表 */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto">
              {uploadQueue.map(task => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2 border-b border-border last:border-0',
                    task.status === 'error' && 'bg-destructive/5',
                  )}
                >
                  {getStatusIcon(task)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" title={task.fileName}>
                      {task.fileName}
                    </p>
                    {task.status === 'uploading' && (
                      <Progress value={task.progress} className="h-1 mt-1" />
                    )}
                    {task.status === 'error' && task.error && (
                      <p className="text-xs text-destructive mt-0.5">{task.error}</p>
                    )}
                  </div>
                  {task.status === 'uploading' && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {task.progress}
                      %
                    </span>
                  )}
                  {(task.status === 'pending' || task.status === 'uploading') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6 shrink-0"
                      onClick={() => cancelUpload(task.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
