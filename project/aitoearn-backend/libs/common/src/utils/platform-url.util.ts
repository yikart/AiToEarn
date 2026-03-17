import { AccountType } from '../enums/account-type.enum'

const DOMAIN_TO_ACCOUNT_TYPE: Record<string, AccountType> = {
  'tiktok.com': AccountType.TIKTOK,
  'm.tiktok.com': AccountType.TIKTOK,
  'vm.tiktok.com': AccountType.TIKTOK,
  'vt.tiktok.com': AccountType.TIKTOK,
  'youtube.com': AccountType.YOUTUBE,
  'm.youtube.com': AccountType.YOUTUBE,
  'youtu.be': AccountType.YOUTUBE,
  'douyin.com': AccountType.Douyin,
  'v.douyin.com': AccountType.Douyin,
  'iesdouyin.com': AccountType.Douyin,
  'bilibili.com': AccountType.BILIBILI,
  'm.bilibili.com': AccountType.BILIBILI,
  'b23.tv': AccountType.BILIBILI,
  'xiaohongshu.com': AccountType.Xhs,
  'xhslink.com': AccountType.Xhs,
  'twitter.com': AccountType.TWITTER,
  'x.com': AccountType.TWITTER,
  'mobile.twitter.com': AccountType.TWITTER,
  't.co': AccountType.TWITTER,
  'kuaishou.com': AccountType.KWAI,
  'v.kuaishou.com': AccountType.KWAI,
  'c.kuaishou.com': AccountType.KWAI,
  'pinterest.com': AccountType.PINTEREST,
  'pin.it': AccountType.PINTEREST,
  'instagram.com': AccountType.INSTAGRAM,
  'facebook.com': AccountType.FACEBOOK,
  'm.facebook.com': AccountType.FACEBOOK,
  'fb.watch': AccountType.FACEBOOK,
  'threads.net': AccountType.THREADS,
  'linkedin.com': AccountType.LINKEDIN,
  'channels.weixin.qq.com': AccountType.WxSph,
  'mp.weixin.qq.com': AccountType.WxGzh,
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
      return AccountType.PINTEREST
    }

    return null
  }
  catch {
    return null
  }
}
