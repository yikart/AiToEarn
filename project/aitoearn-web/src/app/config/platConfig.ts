import type { StaticImageData } from 'next/image'
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

export enum PlatType {
  Tiktok = 'tiktok',
  Douyin = 'douyin',
  Xhs = 'xhs',
  WxSph = 'wxSph',
  KWAI = 'KWAI',
  YouTube = 'youtube',
  BILIBILI = 'bilibili',
  Twitter = 'twitter',
  WxGzh = 'wxGzh',
  Facebook = 'facebook',
  Instagram = 'instagram',
  Threads = 'threads',
  Pinterest = 'pinterest',
  LinkedIn = 'linkedin',
}

type PlatformIconAsset = string | StaticImageData

export interface AccountPlatInfo {
  name: string
  icon: string
  tips?: {
    account?: string
  }
}

function getIconSrc(asset: PlatformIconAsset) {
  return typeof asset === 'string' ? asset : asset.src
}

export const AccountPlatInfoMap = new Map<PlatType, AccountPlatInfo>([
  [PlatType.Tiktok, { name: 'TikTok', icon: getIconSrc(tiktokIcon) }],
  [PlatType.Douyin, { name: 'Douyin', icon: getIconSrc(douyinIcon) }],
  [PlatType.Xhs, { name: 'RedNote', icon: getIconSrc(xhsIcon) }],
  [PlatType.WxSph, { name: 'WeChat Channels', icon: getIconSrc(wxSphIcon) }],
  [PlatType.KWAI, { name: 'Kwai', icon: getIconSrc(ksIcon) }],
  [PlatType.YouTube, { name: 'YouTube', icon: getIconSrc(youtubeIcon) }],
  [PlatType.BILIBILI, { name: 'Bilibili', icon: getIconSrc(bilibiliIcon) }],
  [PlatType.Twitter, { name: 'X', icon: getIconSrc(twitterIcon) }],
  [PlatType.WxGzh, { name: 'WeChat Official Account', icon: getIconSrc(gzhIcon) }],
  [PlatType.Facebook, { name: 'Facebook', icon: getIconSrc(facebookIcon) }],
  [PlatType.Instagram, { name: 'Instagram', icon: getIconSrc(instagramIcon) }],
  [PlatType.Threads, { name: 'Threads', icon: getIconSrc(threadsIcon) }],
  [PlatType.Pinterest, { name: 'Pinterest', icon: getIconSrc(pinterestIcon) }],
  [PlatType.LinkedIn, { name: 'LinkedIn', icon: getIconSrc(linkedinIcon) }],
])

export const RegionSortedPlatInfoArr = Array.from(AccountPlatInfoMap.entries())

export function isPlatformAvailable(_platform: PlatType) {
  return true
}
