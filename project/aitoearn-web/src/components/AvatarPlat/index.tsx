import type { ForwardedRef } from 'react'
import type { SocialAccount } from '@/api/types/account.type'
import { forwardRef, memo } from 'react'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getOssUrl } from '@/utils/oss'
import styles from './avatarPlat.module.scss'

export interface IAvatarPlatRef {}

export interface IAvatarPlatProps {
  account?: Partial<SocialAccount>
  size?: 'large' | 'default' | 'small' | number
  className?: string
  width?: number
  avatarWidth?: number
  disabled?: boolean
  fallbackText?: string
}

const sizeClassMap: Record<string, string> = {
  large: 'h-10 w-10',
  default: 'h-8 w-8',
  small: 'h-6 w-6',
}

function getAvatar(url: string) {
  if (url?.includes('https://')) {
    return url
  }
  else {
    return `${getOssUrl(url)}`
  }
}

const AvatarPlat = memo(
  forwardRef(
    (
      { account, size = 'default', className, width, avatarWidth, disabled, fallbackText }: IAvatarPlatProps,
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

      const isNumberSize = typeof size === 'number' || typeof avatarWidth === 'number'
      const avatarSizePx = avatarWidth || (typeof size === 'number' ? size : undefined)
      const sizeClassName = isNumberSize ? '' : sizeClassMap[size as string] || sizeClassMap.default

      return (
        <>
          <div className={`${styles.avatarPlat} ${className} ${disabled ? styles.disabled : ''}`}>
            <Avatar
              className={sizeClassName}
              style={{
                ...(avatarSizePx ? { width: avatarSizePx, height: avatarSizePx } : {}),
                ...(disabled ? { opacity: 0.5 } : {}),
              }}
            >
              <AvatarImage src={getAvatar(account!.avatar!)} alt={account.nickname || ''} />
              <AvatarFallback className="text-xs">
                {fallbackText || account.nickname?.[0] || account.account?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <img
              src={plat.icon}
              style={
                !width
                  ? {
                      width: size === 'large' ? 16 : size === 'default' ? 12.5 : 10,
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
