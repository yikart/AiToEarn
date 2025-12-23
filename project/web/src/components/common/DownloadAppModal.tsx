/**
 * DownloadAppModal - App 下载提示弹窗组件
 * 用于提示用户下载对应的移动端应用，支持显示插件下载 Tab
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Download, Puzzle, Smartphone } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  zIndex = 1000,
  showPluginTab = false,
  defaultTab = 'app',
  pluginStatus = 'not_installed',
  onCheckPermission,
}: DownloadAppModalProps) {
  const { t: tPlugin } = useTransClient('plugin')
  const [activeTab, setActiveTab] = useState(defaultTab)

  // 多平台下载链接 - 统一跳转到下载页面
  const downloadPageUrl = 'https://docs.aitoearn.ai/en/downloads'

  /** 渲染 App 下载内容 */
  const renderAppContent = () => (
    <div className="flex items-center px-4 py-4">
      {/* 多平台下载按钮 */}
      <div className="w-full grid grid-cols-1 gap-3">
        <Button 
          onClick={() => window.open(downloadPageUrl, '_blank')} 
          variant="outline"
          className="w-full h-12 justify-start gap-3 text-left"
          size="lg"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
          </svg>
          <span className="flex-1">Windows</span>
          <Download className="h-4 w-4 text-muted-foreground" />
        </Button>
        
        <Button 
          onClick={() => window.open(downloadPageUrl, '_blank')} 
          variant="outline"
          className="w-full h-12 justify-start gap-3 text-left"
          size="lg"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          <span className="flex-1">macOS</span>
          <Download className="h-4 w-4 text-muted-foreground" />
        </Button>
        
        <Button 
          onClick={() => window.open(downloadPageUrl, '_blank')} 
          variant="outline"
          className="w-full h-12 justify-start gap-3 text-left"
          size="lg"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-1.45-.66-3.08-1.03-4.84-1.03-1.76 0-3.39.37-4.84 1.03L4.95 5.67c-.18-.28-.54-.37-.83-.22-.3.16-.42.54-.26.85L5.7 9.48C3.32 10.78 1.7 13 1.21 15.65h21.58C22.3 13 20.68 10.78 17.6 9.48M7 13.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1m10 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1"/>
            <path d="M5.5 17h1v5h-1zm12 0h1v5h-1zm-10 0h9v5h-9z"/>
          </svg>
          <span className="flex-1">Android</span>
          <Download className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
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
      footer={false}
      width={520}
      destroyOnClose
      zIndex={zIndex}
    >
      {renderAppContent()}
    </Modal>
  )
}
