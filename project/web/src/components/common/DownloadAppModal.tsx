/**
 * DownloadAppModal - App 下载提示弹窗组件
 * 用于提示用户下载对应的移动端应用，支持显示插件下载 Tab
 */

import { ApiOutlined, CheckOutlined, CopyOutlined, DownloadOutlined, MobileOutlined } from '@ant-design/icons'
import { Button, Space, Tabs, Typography } from 'antd'
import { toast } from '@/lib/toast'
import { Modal } from '@/components/ui/modal'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { QRCode } from 'react-qrcode-logo'
import { getMainAppDownloadUrlSync, MAIN_APP_DOWNLOAD_URL } from '@/app/config/appDownloadConfig'
import { useTransClient } from '@/app/i18n/client'
import { PluginDownloadContent } from '@/components/Plugin'
import logo from '@/assets/images/logo.png'

const { Text, Paragraph } = Typography

interface DownloadAppModalProps {
  visible: boolean
  onClose: () => void
  platform?: string // 平台名称，如"小红书"
  appName?: string // app名称
  downloadUrl?: string // 下载链接
  qrCodeUrl?: string // 二维码图片URL
  zIndex?: number // 弹窗层级
  // 插件相关配置
  showPluginTab?: boolean // 是否显示插件Tab
  defaultTab?: 'plugin' | 'app' // 默认显示哪个Tab
  pluginStatus?: 'not_installed' | 'no_permission' | 'ready' // 插件状态
  onCheckPermission?: () => void // 检查权限回调
}

/**
 * 下载App提示弹窗组件
 * 用于提示用户下载对应的移动端应用
 * 支持显示插件下载Tab（通过 showPluginTab 配置）
 */
const DownloadAppModal: React.FC<DownloadAppModalProps> = ({
  visible,
  onClose,
  platform = '',
  appName = 'Aitoearn App',
  downloadUrl,
  qrCodeUrl = '',
  zIndex = 1000,
  showPluginTab = false,
  defaultTab = 'app',
  pluginStatus = 'not_installed',
  onCheckPermission,
}) => {
  const { t } = useTransClient('common')
  const { t: tPlugin } = useTranslation('plugin')
  const [copySuccess, setCopySuccess] = useState(false)
  const [activeTab, setActiveTab] = useState(defaultTab)

  const handleDownload = () => {
    const linkToOpen = downloadUrl || getMainAppDownloadUrlSync()
    window.open(linkToOpen, '_blank')
  }

  const handleCopyLink = async () => {
    const linkToCopy = downloadUrl || getMainAppDownloadUrlSync()
    try {
      await navigator.clipboard.writeText(linkToCopy)
      setCopySuccess(true)
      toast.success(t('downloadApp.copySuccess' as any))
      setTimeout(() => setCopySuccess(false), 2000)
    }
    catch (error) {
      toast.error(t('downloadApp.copyFailed' as any))
    }
  }

  /**
   * 渲染插件Tab内容
   */
  const renderPluginContent = () => (
    <PluginDownloadContent
      pluginStatus={pluginStatus}
      onCheckPermission={onCheckPermission}
    />
  )

  /**
   * 渲染App下载Tab内容
   */
  const renderAppContent = () => (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      {/* App Logo */}
      <div style={{ marginBottom: '24px' }}>
        <img src={logo.src} alt="Aitoearn" style={{ width: 64, height: 64, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
      </div>

      {/* 标题 */}
      <Typography.Title level={4} style={{ marginBottom: '16px', color: '#1f2937' }}>
        Aitoearn
      </Typography.Title>

      {/* 描述 */}
      <Paragraph style={{ color: '#6b7280', marginBottom: '32px', fontSize: '14px', lineHeight: '1.6' }}>
        <span dangerouslySetInnerHTML={{ __html: t('downloadApp.operationDescription' as any, { platform }) }} />
      </Paragraph>

      {/* 二维码区域 */}
      <div style={{
        marginBottom: '32px',
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
      }}
      >
        {qrCodeUrl
          ? (
              <img
                src={qrCodeUrl}
                alt="QR Code"
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              />
            )
          : (
              <QRCode
                value={downloadUrl || getMainAppDownloadUrlSync()}
                size={200}
                logoImage={logo.src}
                logoWidth={20}
                logoHeight={20}
                logoPadding={5}
                logoPaddingStyle="square"
                logoOpacity={0.95}
                qrStyle="dots"
                eyeRadius={0}
                style={{ borderRadius: '8px' }}
              />
            )}
      </div>

      {/* 下载链接区域 */}
      <div style={{
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: '#f3f4f6',
        borderRadius: '8px',
        border: '1px solid #d1d5db',
      }}
      >
        <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>
          {t('downloadApp.downloadLink')}
        </Text>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
        >
          <Text
            style={{
              flex: 1,
              fontSize: '13px',
              wordBreak: 'break-all',
              textAlign: 'left',
            }}
          >
            {downloadUrl || getMainAppDownloadUrlSync()}
          </Text>
          <Button
            size="small"
            icon={copySuccess ? <CheckOutlined /> : <CopyOutlined />}
            onClick={handleCopyLink}
            type={copySuccess ? 'primary' : 'default'}
          >
            {copySuccess ? t('downloadApp.copied' as any) : t('downloadApp.copy' as any)}
          </Button>
        </div>
      </div>

      {/* 提示信息 */}
      <div style={{
        padding: '16px',
        backgroundColor: '#eff6ff',
        borderRadius: '8px',
        border: '1px solid #dbeafe',
      }}
      >
        <Text type="secondary" style={{ fontSize: '13px', color: '#1e40af' }}>
          {t('downloadApp.tip')}
        </Text>
      </div>

      {/* 下载按钮 */}
      {!showPluginTab && (
        <div style={{ marginTop: '24px' }}>
          <Button
            type="primary"
            size="large"
            icon={<DownloadOutlined />}
            onClick={handleDownload}
            block
          >
            {t('downloadApp.downloadNow' as any)}
          </Button>
        </div>
      )}
    </div>
  )

  // 如果显示插件Tab，使用Tab布局
  if (showPluginTab) {
    const tabItems = [
      {
        key: 'plugin',
        label: (
          <span>
            <ApiOutlined />
            {' '}
            {tPlugin('header.downloadPlugin')}
          </span>
        ),
        children: renderPluginContent(),
      },
      {
        key: 'app',
        label: (
          <span>
            <MobileOutlined />
            {' '}
            Download App
          </span>
        ),
        children: renderAppContent(),
      },
    ]

    return (
      <Modal
        title={activeTab === 'plugin' ? (pluginStatus === 'no_permission' ? tPlugin('status.installedNoPermission') : tPlugin('status.notInstalled')) : 'Download Aitoearn App'}
        open={visible}
        onCancel={onClose}
        footer={null}
        width={520}
        destroyOnClose
        zIndex={zIndex}
      >
        <Tabs
          activeKey={activeTab}
          onChange={key => setActiveTab(key as 'plugin' | 'app')}
          items={tabItems}
          centered
        />
      </Modal>
    )
  }

  // 不显示插件Tab，只显示App下载（向后兼容）
  return (
    <Modal
      title={(
        <Space>
          <img src={logo.src} alt="Aitoearn" style={{ width: 20, height: 20, borderRadius: 4 }} />
          <span>Download Aitoearn App</span>
        </Space>
      )}
      open={visible}
      onCancel={onClose}
      footer={(
        <>
          <Button onClick={onClose}>
            {t('downloadApp.close')}
          </Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleDownload}
          >
            {t('downloadApp.downloadNow' as any)}
          </Button>
        </>
      )}
      width={520}
      destroyOnClose
      zIndex={zIndex}
    >
      {renderAppContent()}
    </Modal>
  )
}

export default DownloadAppModal
