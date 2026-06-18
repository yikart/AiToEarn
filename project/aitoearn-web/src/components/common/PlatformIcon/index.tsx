'use client'

import type { PlatType } from '@/app/config/platConfig'
import type { OssImageProps } from '@/components/common/OssImage'
import { OssImage } from '@/components/common/OssImage'
import { usePlatformInfo } from '@/hooks/usePlatformMetadata'
import { getStaticPlatformIcon } from '@/store/platformMetadata/staticIcons'

type PlatformIconProps = Omit<OssImageProps, 'src' | 'alt'> & {
  platform?: PlatType | null
  src?: string
  alt?: string
}

export function PlatformIcon({ platform, src, alt, width = 20, height = 20, ...props }: PlatformIconProps) {
  const platformInfo = usePlatformInfo(platform)
  const imageSrc = src ?? platformInfo?.icon ?? getStaticPlatformIcon(platform)

  if (!imageSrc)
    return null

  return (
    <OssImage
      {...props}
      src={imageSrc}
      alt={alt ?? platformInfo?.name ?? platform ?? 'platform'}
      width={width}
      height={height}
      thumbnailWidth={typeof width === 'number' ? width : undefined}
      thumbnailHeight={typeof height === 'number' ? height : undefined}
    />
  )
}

export default PlatformIcon
