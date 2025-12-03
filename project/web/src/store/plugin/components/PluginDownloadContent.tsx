/**
 * 插件下载内容组件（可复用）
 * 用于在不同弹框中显示插件下载或授权内容
 */

'use client'

import {
  ApiOutlined,
  ChromeOutlined,
  ExclamationCircleOutlined,
  GithubOutlined,
} from '@ant-design/icons'
import { Button, Space, Spin, Typography } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PLUGIN_DOWNLOAD_LINKS } from '../constants'
import { usePluginStore } from '../store'

const { Paragraph } = Typography

/**
 * 组件属性
 */
export interface PluginDownloadContentProps {
  /** 插件状态 */
  pluginStatus: 'not_installed' | 'no_permission' | 'ready'

  /** 检查权限回调 */
  onCheckPermission?: () => void | Promise<void>
}

/**
 * 插件下载内容组件
 */
export function PluginDownloadContent({
  pluginStatus,
  onCheckPermission,
}: PluginDownloadContentProps) {
  const { t } = useTranslation('plugin')
  const init = usePluginStore(state => state.init)
  const [checkingPermission, setCheckingPermission] = useState(false)

  const handleCheckPermission = async () => {
    setCheckingPermission(true)
    try {
      if (onCheckPermission) {
        await onCheckPermission()
      }
      else {
        await init()
      }
    }
    finally {
      setCheckingPermission(false)
    }
  }

  // 已安装但未授权
  if (pluginStatus === 'no_permission') {
    return (
      <Spin spinning={checkingPermission}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ marginBottom: '24px' }}>
            <ExclamationCircleOutlined style={{ fontSize: 64, color: '#faad14' }} />
          </div>
          <Typography.Title level={4} style={{ marginBottom: '16px', color: '#1f2937' }}>
            {t('header.permissionRequired')}
          </Typography.Title>
          <Paragraph style={{ color: '#6b7280', marginBottom: '32px', fontSize: '14px', lineHeight: '1.6' }}>
            {t('header.permissionDescription')}
          </Paragraph>
          <Button
            type="primary"
            size="large"
            loading={checkingPermission}
            onClick={handleCheckPermission}
          >
            {t('header.checkPermission')}
          </Button>
        </div>
      </Spin>
    )
  }

  // 未安装
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ marginBottom: '24px' }}>
        <ApiOutlined style={{ fontSize: 64, color: '#667eea' }} />
      </div>
      <Typography.Title level={4} style={{ marginBottom: '16px', color: '#1f2937' }}>
        {t('header.downloadPlugin')}
      </Typography.Title>
      <Paragraph style={{ color: '#6b7280', marginBottom: '32px', fontSize: '14px', lineHeight: '1.6' }}>
        {t('header.downloadDescription')}
      </Paragraph>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* <Button */}
        {/*  type="primary" */}
        {/*  size="large" */}
        {/*  icon={<ChromeOutlined />} */}
        {/*  href={PLUGIN_DOWNLOAD_LINKS.chrome} */}
        {/*  target="_blank" */}
        {/*  block */}
        {/* > */}
        {/*  {t('header.chromeWebStore')} */}
        {/* </Button> */}
        <Button
          size="large"
          icon={<GithubOutlined />}
          href={PLUGIN_DOWNLOAD_LINKS.github}
          target="_blank"
          block
        >
          {t('header.githubRelease')}
        </Button>
      </Space>
    </div>
  )
}
