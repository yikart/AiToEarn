'use client'

/**
 * 平台选择器组件
 * 支持动态平台列表，根据登录状态显示不同样式
 */

import type { PlatformInfo } from '../../useInteractive'
import type { SupportedPlatformType } from '@/store/plugin/plats/types'
import { message } from 'antd'
import Image from 'next/image'
import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import styles from './PlatformSelector.module.scss'

interface PlatformSelectorProps {
  /** 平台列表 */
  platforms: PlatformInfo[]
  /** 当前选中的平台 */
  currentPlatform: SupportedPlatformType | null
  /** 是否有任意平台已登录 */
  hasAnyLoggedIn: boolean
  /** 切换平台回调 */
  onSwitch: (platform: SupportedPlatformType) => boolean
  /** 去登录回调 */
  onGoLogin?: () => void
}

/**
 * 平台选择器组件
 */
function PlatformSelector({
  platforms,
  currentPlatform,
  hasAnyLoggedIn,
  onSwitch,
  onGoLogin,
}: PlatformSelectorProps) {
  const { t } = useTranslation('interactiveNew')
  const { t: tAccount } = useTranslation('account')

  /**
   * 处理平台点击
   */
  const handlePlatformClick = useCallback((platform: PlatformInfo) => {
    if (!platform.isLoggedIn) {
      message.warning(t('loginRequired'))
      return
    }
    onSwitch(platform.type)
  }, [onSwitch, t])

  return (
    <div className={styles.platformSelector}>
      <span className="platformSelector_label">{t('selectPlatform')}</span>
      <div className="platformSelector_list">
        {platforms.map(platform => (
          <div
            key={platform.type}
            className={`platformSelector_item ${
              currentPlatform === platform.type ? 'platformSelector_item-active' : ''
            } ${!platform.isLoggedIn ? 'platformSelector_item-disabled' : ''}`}
            onClick={() => handlePlatformClick(platform)}
          >
            <Image
              src={platform.icon}
              alt={platform.name}
              width={24}
              height={24}
              className="platformSelector_item_icon"
            />
            <span className="platformSelector_item_name">{tAccount(platform.name as any)}</span>
          </div>
        ))}
      </div>

      {/* 所有平台未登录提示 */}
      {!hasAnyLoggedIn && (
        <div className={styles.loginTip}>
          <span className="loginTip_icon">⚠️</span>
          <span className="loginTip_text">{t('allPlatformNotLogin')}</span>
          {onGoLogin && (
            <button className="loginTip_btn" onClick={onGoLogin}>
              {t('goLogin')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default memo(PlatformSelector)
