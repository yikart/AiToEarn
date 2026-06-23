import { AccountType } from '../enums/account-type.enum'

const DOMAIN_TO_ACCOUNT_TYPE: Record<string, AccountType> = {
  'tiktok.com': AccountType.TikTok,
  'm.tiktok.com': AccountType.TikTok,
  'vm.tiktok.com': AccountType.TikTok,
  'vt.tiktok.com': AccountType.TikTok,
  'youtube.com': AccountType.YouTube,
  'm.youtube.com': AccountType.YouTube,
  'youtu.be': AccountType.YouTube,
  'douyin.com': AccountType.Douyin,
  'v.douyin.com': AccountType.Douyin,
  'iesdouyin.com': AccountType.Douyin,
  'bilibili.com': AccountType.Bilibili,
  'm.bilibili.com': AccountType.Bilibili,
  'b23.tv': AccountType.Bilibili,
  'xiaohongshu.com': AccountType.RedNote,
  'xhslink.com': AccountType.RedNote,
  'twitter.com': AccountType.Twitter,
  'x.com': AccountType.Twitter,
  'mobile.twitter.com': AccountType.Twitter,
  't.co': AccountType.Twitter,
  'kuaishou.com': AccountType.Kwai,
  'v.kuaishou.com': AccountType.Kwai,
  'c.kuaishou.com': AccountType.Kwai,
  'pinterest.com': AccountType.Pinterest,
  'pin.it': AccountType.Pinterest,
  'instagram.com': AccountType.Instagram,
  'facebook.com': AccountType.Facebook,
  'm.facebook.com': AccountType.Facebook,
  'fb.watch': AccountType.Facebook,
  'threads.com': AccountType.Threads,
  'threads.net': AccountType.Threads,
  'linkedin.com': AccountType.LinkedIn,
  'channels.weixin.qq.com': AccountType.WeChatChannels,
  'mp.weixin.qq.com': AccountType.WeChatOfficial,
}

/**
 * 从 URL 中识别平台类型
 * @param workLink 作品链接
 * @returns 平台类型，无法识别时返回 null
 */
export function detectAccountTypeFromUrl(workLink: string): AccountType | null {
  try {
    const url = new URL(workLink)
    const hostname = url.hostname.replace(/^www\./, '')

    // 精确匹配
    if (DOMAIN_TO_ACCOUNT_TYPE[hostname]) {
      return DOMAIN_TO_ACCOUNT_TYPE[hostname]
    }

    // Pinterest 子域名匹配（如 br.pinterest.com）
    if (hostname.endsWith('.pinterest.com')) {
      return AccountType.Pinterest
    }

    return null
  }
  catch {
    return null
  }
}
