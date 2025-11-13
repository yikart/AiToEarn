import type { AvatarSize } from 'antd/es/avatar/AvatarContext'
import type { ForwardedRef } from 'react'
import type { SocialAccount } from '@/api/types/account.type'
import { Avatar } from 'antd'
import { forwardRef, memo } from 'react'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { OSS_URL } from '@/constant'
import styles from './avatarPlat.module.scss'

export interface IAvatarPlatRef {}

export interface IAvatarPlatProps {
  account?: SocialAccount
  size?: AvatarSize
  className?: string
  width?: number
  avatarWidth?: number
  disabled?: boolean
}

function getAvatar(url: string) {
  if (url?.includes('https://')) {
    return url
  }
  else {
    return `${OSS_URL}/${url}`
  }
}

const AvatarPlat = memo(
  forwardRef(
    (
      {
        account,
        size = 'default',
        className,
        width,
        avatarWidth,
        disabled,
      }: IAvatarPlatProps,
      ref: ForwardedRef<IAvatarPlatRef>,
    ) => {
      // 添加防护检查
      if (!account || !account.type) {
        console.warn('AvatarPlat: account or account.type is undefined', account)
        return null
      }

      const plat = AccountPlatInfoMap.get(account.type)
      if (!plat) {
        console.warn('AvatarPlat: platform not found for type', account.type)
        return null
      }

      return (
        <>
          <div className={`${styles.avatarPlat} ${className} ${disabled ? styles.disabled : ''}`}>
            <Avatar
              src={getAvatar(account.avatar)}
              size={avatarWidth || size}
              style={disabled ? { opacity: 0.5 } : undefined}
            />
            <img
              src={plat.icon}
              style={
                !width
                  ? {
                      width:
                        size === 'large' ? 16 : size === 'default' ? 12.5 : 10,
                      opacity: disabled ? 0.5 : 1,
                    }
                  : {
                      width,
                      opacity: disabled ? 0.5 : 1,
                    }
              }
            />
          </div>
        </>
      )
    },
  ),
)

export default AvatarPlat
