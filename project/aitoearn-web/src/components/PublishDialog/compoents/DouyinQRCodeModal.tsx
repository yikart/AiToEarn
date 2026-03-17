/**
 * 抖音扫码发布弹窗 - Douyin QR Code Publish Modal
 * 显示抖音发布链接的二维码，引导用户扫码发布
 */
'use client'

import { Smartphone } from 'lucide-react'
import { QRCode } from 'react-qrcode-logo'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface DouyinQRCodeModalProps {
  open: boolean
  permalink: string
  onClose: () => void
}

export function DouyinQRCodeModal({ open, permalink, onClose }: DouyinQRCodeModalProps) {
  const { t } = useTransClient('publish')

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="w-[95vw] max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            {t('douyin.scanToPublish')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* 二维码 */}
          <div className="p-4 bg-white rounded-lg shadow-sm">
            {permalink && (
              <QRCode value={permalink} size={450} quietZone={10} qrStyle="squares" eyeRadius={5} />
            )}
          </div>

          {/* 提示文字 */}
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-foreground">{t('douyin.scanInstruction')}</p>
            <p className="text-xs text-muted-foreground">{t('douyin.scanStep1')}</p>
            <p className="text-xs text-muted-foreground">{t('douyin.scanStep2')}</p>
          </div>

          {/* 关闭按钮 */}
          <Button onClick={onClose} variant="outline" className="w-full">
            {t('douyin.closeButton')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
