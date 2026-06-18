import type { StaticImageData } from 'next/image'
import { PlatType } from '@/app/config/platConfig'
import bilibiliIcon from '@/assets/svgs/plat/bilibili.svg'
import douyinIcon from '@/assets/svgs/plat/douyin.svg'
import facebookIcon from '@/assets/svgs/plat/facebook.svg'
import gzhIcon from '@/assets/svgs/plat/gzh.svg'
import instagramIcon from '@/assets/svgs/plat/instagram.svg'
import ksIcon from '@/assets/svgs/plat/ks.svg'
import linkedinIcon from '@/assets/svgs/plat/linkedin.svg'
import pinterestIcon from '@/assets/svgs/plat/pinterest.svg'
import threadsIcon from '@/assets/svgs/plat/threads.svg'
import tiktokIcon from '@/assets/svgs/plat/tiktok.svg'
import twitterIcon from '@/assets/svgs/plat/twitter.svg'
import wxSphIcon from '@/assets/svgs/plat/wx-sph.svg'
import xhsIcon from '@/assets/svgs/plat/xhs.svg'
import youtubeIcon from '@/assets/svgs/plat/youtube.svg'

type StaticPlatformIconAsset = string | StaticImageData

const STATIC_PLATFORM_ICON_MAP: Record<PlatType, StaticPlatformIconAsset> = {
  [PlatType.Tiktok]: tiktokIcon,
  [PlatType.Douyin]: douyinIcon,
  [PlatType.Xhs]: xhsIcon,
  [PlatType.WxSph]: wxSphIcon,
  [PlatType.KWAI]: ksIcon,
  [PlatType.YouTube]: youtubeIcon,
  [PlatType.BILIBILI]: bilibiliIcon,
  [PlatType.Twitter]: twitterIcon,
  [PlatType.WxGzh]: gzhIcon,
  [PlatType.Facebook]: facebookIcon,
  [PlatType.Instagram]: instagramIcon,
  [PlatType.Threads]: threadsIcon,
  [PlatType.Pinterest]: pinterestIcon,
  [PlatType.LinkedIn]: linkedinIcon,
}

function getStaticAssetSrc(asset: StaticPlatformIconAsset) {
  return typeof asset === 'string' ? asset : asset.src
}

export function getStaticPlatformIcon(platType?: PlatType | null) {
  if (!platType)
    return undefined

  return getStaticAssetSrc(STATIC_PLATFORM_ICON_MAP[platType])
}
