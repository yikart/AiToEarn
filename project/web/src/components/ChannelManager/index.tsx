/**
 * ChannelManager - 频道管理弹窗组件
 *
 * 功能描述：
 * - 空间和频道融合管理界面
 * - 支持添加空间、编辑空间、删除空间、空间排序
 * - 支持删除频道
 * - 完全使用全局account store数据
 */

'use client'

import { useCallback, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UnifiedChannelSpaceList } from './components/UnifiedChannelSpaceList'

interface ChannelManagerProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ChannelManager({
  open: controlledOpen,
  onOpenChange,
}: ChannelManagerProps) {
  const { t } = useTransClient('account')
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = controlledOpen ?? internalOpen

  // 使用useCallback优化关闭函数
  const handleClose = useCallback(() => {
    if (onOpenChange) {
      onOpenChange(false)
    } else {
      setInternalOpen(false)
    }
  }, [onOpenChange])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[700px] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {t('channelManager.title', '我的频道')}
          </DialogTitle>
          <DialogDescription>
            {t('channelManager.description', '管理您的频道和空间分组')}
          </DialogDescription>
        </DialogHeader>

        {/* 统一的空间和频道管理列表 */}
        <div className="flex-1 min-h-0">
          <UnifiedChannelSpaceList />
        </div>
      </DialogContent>
    </Dialog>
  )
}

// 导出store hook
export { useChannelManagerStore } from './channelStore'

// 默认导出
export default ChannelManager
