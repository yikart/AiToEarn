/**
 * DownloadAppModal - App 下载提示弹窗组件
 * 用于提示用户下载对应的移动端应用，支持显示插件下载 Tab
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Check, Copy, Download, Puzzle, Smartphone } from 'lucide-react'
import { QRCode } from 'react-qrcode-logo'
import { toast } from '@/lib/toast'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getMainAppDownloadUrlSync } from '@/app/config/appDownloadConfig'
import { useTransClient } from '@/app/i18n/client'
import { PluginDownloadContent } from '@/components/Plugin/PluginDownloadContent'
import logo from '@/assets/images/logo.png'

interface DownloadAppModalProps {
  visible: boolean
  onClose: () => void
  /** 平台名称，如"小红书" */
  platform?: string
  /** app 名称 */
  appName?: string
  /** 下载链接 */
  downloadUrl?: string
  /** 二维码图片 URL */
  qrCodeUrl?: string
  /** 弹窗层级 */
  zIndex?: number
  /** 是否显示插件 Tab */
  showPluginTab?: boolean
  /** 默认显示哪个 Tab */
  defaultTab?: 'plugin' | 'app'
  /** 插件状态 */
  pluginStatus?: 'not_installed' | 'no_permission' | 'ready'
  /** 检查权限回调 */
  onCheckPermission?: () => void
}

/**
 * 下载 App 提示弹窗组件
 * 用于提示用户下载对应的移动端应用
 * 支持显示插件下载 Tab（通过 showPluginTab 配置）
 */
export default function DownloadAppModal({
  visible,
  onClose,
  platform = '',
  downloadUrl,
  qrCodeUrl = '',
  zIndex = 1000,
  showPluginTab = false,
  defaultTab = 'app',
  pluginStatus = 'not_installed',
  onCheckPermission,
}: DownloadAppModalProps) {
  const { t } = useTransClient('common')
  const { t: tPlugin } = useTransClient('plugin')
  const [copySuccess, setCopySuccess] = useState(false)
  const [activeTab, setActiveTab] = useState(defaultTab)

  const actualDownloadUrl = downloadUrl || getMainAppDownloadUrlSync()

  const handleDownload = () => {
    window.open(actualDownloadUrl, '_blank')
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(actualDownloadUrl)
      setCopySuccess(true)
      toast.success(t('downloadApp.copySuccess' as any))
      setTimeout(() => setCopySuccess(false), 2000)
    }
    catch {
      toast.error(t('downloadApp.copyFailed' as any))
    }
  }

  /** 渲染 App 下载内容 */
  const renderAppContent = () => (
    <div className="flex flex-col items-center px-4 py-6">
      {/* App Logo */}
      <div className="mb-6">
        <Image
          src={logo}
          alt="Aitoearn"
          width={64}
          height={64}
          className="rounded-2xl shadow-lg"
        />
      </div>

      {/* 标题 */}
      <h3 className="mb-4 text-xl font-semibold text-foreground">Aitoearn</h3>

      {/* 描述 */}
      <p
        className="mb-8 text-center text-sm leading-relaxed text-muted-foreground"
        dangerouslySetInnerHTML={{
          __html: t('downloadApp.operationDescription' as any, { platform }),
        }}
      />

      {/* 二维码区域 */}
      <div className="mb-8 rounded-xl border border-border bg-muted/50 p-5">
        {qrCodeUrl ? (
          <img
            src={qrCodeUrl}
            alt="QR Code"
            className="h-[200px] w-[200px] rounded-lg shadow-sm"
          />
        ) : (
          <QRCode
            value={actualDownloadUrl}
            size={200}
            logoImage={logo.src}
            logoWidth={20}
            logoHeight={20}
            logoPadding={5}
            logoPaddingStyle="square"
            logoOpacity={0.95}
            qrStyle="dots"
            eyeRadius={0}
          />
        )}
      </div>

      {/* 下载链接区域 */}
      <div className="mb-6 w-full rounded-lg border border-border bg-muted/30 p-4">
        <p className="mb-2 text-xs text-muted-foreground">
          {t('downloadApp.downloadLink')}
        </p>
        <div className="flex items-center justify-between gap-3">
          <span className="flex-1 break-all text-left text-sm text-foreground">
            {actualDownloadUrl}
          </span>
          <Button
            variant={copySuccess ? 'default' : 'outline'}
            size="sm"
            onClick={handleCopyLink}
            className="shrink-0"
          >
            {copySuccess ? (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5" />
                {t('downloadApp.copied' as any)}
              </>
            ) : (
              <>
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                {t('downloadApp.copy' as any)}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 提示信息 */}
      <div className="w-full rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
        <p className="text-center text-sm text-blue-700 dark:text-blue-400">
          {t('downloadApp.tip')}
        </p>
      </div>

      {/* 下载按钮（仅在不显示插件 Tab 时在内容区显示） */}
      {!showPluginTab && (
        <Button onClick={handleDownload} className="mt-6 w-full" size="lg">
          <Download className="mr-2 h-4 w-4" />
          {t('downloadApp.downloadNow' as any)}
        </Button>
      )}
    </div>
  )

  // 带插件 Tab 的布局
  if (showPluginTab) {
    const modalTitle =
      activeTab === 'plugin'
        ? pluginStatus === 'no_permission'
          ? tPlugin('status.installedNoPermission')
          : tPlugin('status.notInstalled')
        : 'Download Aitoearn App'

    return (
      <Modal
        title={modalTitle}
        open={visible}
        onCancel={onClose}
        footer={null}
        width={520}
        destroyOnClose
        zIndex={zIndex}
      >
        <Tabs
          value={activeTab}
          onValueChange={(value: string) => setActiveTab(value as 'plugin' | 'app')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plugin" className="gap-2">
              <Puzzle className="h-4 w-4" />
              {tPlugin('header.downloadPlugin')}
            </TabsTrigger>
            <TabsTrigger value="app" className="gap-2">
              <Smartphone className="h-4 w-4" />
              Download App
            </TabsTrigger>
          </TabsList>
          <TabsContent value="plugin" className="mt-4">
            <PluginDownloadContent
              pluginStatus={pluginStatus}
              onCheckPermission={onCheckPermission}
            />
          </TabsContent>
          <TabsContent value="app" className="mt-4">
            {renderAppContent()}
          </TabsContent>
        </Tabs>
      </Modal>
    )
  }

  // 不显示插件 Tab，只显示 App 下载（向后兼容）
  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <Image src={logo} alt="Aitoearn" width={20} height={20} className="rounded" />
          <span>Download Aitoearn App</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('downloadApp.close')}
          </Button>
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            {t('downloadApp.downloadNow' as any)}
          </Button>
        </div>
      }
      width={520}
      destroyOnClose
      zIndex={zIndex}
    >
      {renderAppContent()}
    </Modal>
  )
}
