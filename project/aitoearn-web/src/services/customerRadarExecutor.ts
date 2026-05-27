import type {
  CustomerRadarExecutionLog,
  CustomerRadarPlatform,
  CustomerRadarPlatformCapability,
  CustomerRadarProfile,
  CustomerRadarSocialAccount,
  CustomerReplyCandidate,
} from '@/api/customerRadar'
import type { AIToEarnPluginAPI } from '@/store/plugin/types/baseTypes'
import { PlatType } from '@/app/config/platConfig'
import { ensurePluginBridge, waitForPluginBridge } from '@/store/plugin/bridge'
import { platformManager } from '@/store/plugin/plats/manager'

const platformMap: Partial<Record<CustomerRadarPlatform, PlatType>> = {
  bilibili: PlatType.BILIBILI,
  douyin: PlatType.Douyin,
  facebook: PlatType.Facebook,
  instagram: PlatType.Instagram,
  kwai: PlatType.KWAI,
  linkedin: PlatType.LinkedIn,
  pinterest: PlatType.Pinterest,
  threads: PlatType.Threads,
  tiktok: PlatType.Tiktok,
  twitter: PlatType.Twitter,
  wxGzh: PlatType.WxGzh,
  wxSph: PlatType.WxSph,
  xhs: PlatType.Xhs,
  youtube: PlatType.YouTube,
}

const platformLabels: Record<CustomerRadarPlatform, string> = {
  bilibili: 'B站',
  douyin: '抖音',
  facebook: 'Facebook',
  instagram: 'Instagram',
  kwai: '快手',
  linkedin: 'LinkedIn',
  pinterest: 'Pinterest',
  threads: 'Threads',
  tiktok: 'TikTok',
  twitter: 'Twitter / X',
  wxGzh: '微信公众号',
  wxSph: '视频号',
  xhs: '小红书',
  youtube: 'YouTube',
}

const platformCapabilityNotes: Record<CustomerRadarPlatform, string> = {
  bilibili: 'B站雷达已接入国内平台专用适配：支持视频/专栏搜索线索扫描和可见评论扫描；写操作默认走人工确认。',
  douyin: '抖音雷达已接入国内平台专用适配：关键词搜索和可见评论扫描可走页面执行器；评论/私信触达需要人工确认和风控限频。',
  facebook: 'Facebook 雷达已接入通用页面执行器：支持搜索页线索扫描和可见评论扫描；发布渠道仍走原版授权。',
  instagram: 'Instagram 雷达已接入通用页面执行器：支持搜索页线索扫描和可见评论扫描；发布渠道仍走原版授权。',
  kwai: '快手雷达已接入国内平台专用适配：关键词搜索和可见评论扫描可走页面执行器；评论触达需要人工确认和风控限频。',
  linkedin: 'LinkedIn 雷达已接入通用页面执行器：支持内容搜索线索扫描和可见评论扫描；触达默认人工确认。',
  pinterest: 'Pinterest 雷达已接入通用页面执行器：支持 Pin 搜索线索扫描和可见评论扫描；触达默认人工确认。',
  threads: 'Threads 雷达已接入通用页面执行器：支持搜索页线索扫描和可见回复扫描；触达默认人工确认。',
  tiktok: 'TikTok 雷达已接入通用页面执行器：支持关键词搜索、可见评论扫描和人工确认触达。',
  twitter: 'Twitter / X 雷达已接入通用页面执行器：支持关键词搜索、可见评论扫描和人工确认触达。',
  wxGzh: '微信公众号雷达已接入国内平台专用适配：支持公开文章搜索线索扫描；留言触达按平台页面能力和人工确认执行。',
  wxSph: '视频号雷达已接入国内平台专用适配：支持搜索页/当前页线索扫描和可见评论扫描；触达默认人工确认。',
  xhs: '小红书雷达已接入国内平台专用适配：可抓评论、可搜索关键词线索、可评论作品/回复评论。',
  youtube: 'YouTube 雷达已接入通用页面执行器：支持搜索页线索扫描和可见评论扫描；发布渠道仍走原版授权。',
}

const outboundRiskTerms = ['AI', 'ai', '测试', '自动化', '机器人', '主动获客工具']
const noisyKeywordSignalPattern = /相关搜索|登录后查看搜索结果|手机号登录|获取验证码|扫码登录|沪ICP备|营业执照/
const domesticRadarPlatforms = new Set<CustomerRadarPlatform>(['bilibili', 'douyin', 'kwai', 'wxGzh', 'wxSph', 'xhs'])

function nowText() {
  return new Date().toLocaleString('zh-CN', { hour12: false })
}

function createLog(level: CustomerRadarExecutionLog['level'], title: string, detail: string): CustomerRadarExecutionLog {
  return {
    id: `customer-radar-log-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    at: nowText(),
    detail,
    level,
    title,
  }
}

interface CustomerRadarExecutionCapabilities {
  bridgeConnected: boolean
  hasDouyinDirectMessage: boolean
  hasDouyinInteraction: boolean
  hasPageAutomation: boolean
  hasRemoteAutomation: boolean
  hasUnifiedInteraction: boolean
  hasXhsRequest: boolean
}

function getExecutionCapabilities(plugin = ensurePluginBridge()): CustomerRadarExecutionCapabilities {
  return {
    bridgeConnected: Boolean(plugin),
    hasDouyinDirectMessage: typeof plugin?.douyinDirectMessage === 'function',
    hasDouyinInteraction: typeof plugin?.douyinInteraction === 'function',
    hasPageAutomation: typeof plugin?.remoteAutomationRun === 'function' || typeof plugin?.unifiedInteraction === 'function',
    hasRemoteAutomation: typeof plugin?.remoteAutomationRun === 'function',
    hasUnifiedInteraction: typeof plugin?.unifiedInteraction === 'function',
    hasXhsRequest: typeof plugin?.xhsRequest === 'function',
  }
}

function hasPlugin() {
  return getExecutionCapabilities().bridgeConnected
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(`${label}超时`)), timeoutMs)
    }),
  ])
}

function hasUnsafeOutboundTerms(content: string) {
  return outboundRiskTerms.some(term => content.includes(term))
}

function createUnavailableCapability(platform: CustomerRadarPlatform, reason: string): CustomerRadarPlatformCapability {
  return {
    platform,
    available: true,
    canDiscoverKeyword: true,
    canPublishComment: true,
    canScanComments: true,
    canSendDirectMessage: true,
    note: reason,
  }
}

function createSocialAccount(
  platform: CustomerRadarPlatform,
  data: {
    lastCheckedAt: string
    loginStatus: CustomerRadarSocialAccount['loginStatus']
    nickname?: string
    note: string
    pluginConnected: boolean
  },
): CustomerRadarSocialAccount {
  return {
    id: `social-${platform}`,
    lastCheckedAt: data.lastCheckedAt,
    loginStatus: data.loginStatus,
    nickname: data.nickname || `${platform}账号`,
    note: data.note,
    platform,
    pluginConnected: data.pluginConnected,
  }
}

export interface ScanOwnedPostCommentsInput {
  count?: number
  platform: CustomerRadarPlatform
  workId: string
  xsecToken?: string
}

export interface KeywordDiscoverySignal {
  author: string
  authorId?: string
  commentContent: string
  keyword: string
  platform: CustomerRadarPlatform
  sourceTitle: string
  sourceUrl: string
  workId?: string
}

export interface ScanKeywordDiscoveryInput {
  count?: number
  excludedWords?: string[]
  keyword: string
  platform: CustomerRadarPlatform
}

interface KeywordDiscoveryPluginResult {
  items?: Partial<KeywordDiscoverySignal>[]
  keyword?: string
  message?: string
  success?: boolean
}

function createXhsSearchUrl(keyword: string) {
  return `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}&source=web_search_result_notes`
}

function createDouyinSearchUrl(keyword: string) {
  return `https://www.douyin.com/search/${encodeURIComponent(keyword)}?source=normal_search&type=general`
}

function createKwaiSearchUrl(keyword: string) {
  return `https://www.kuaishou.com/search/video?searchKey=${encodeURIComponent(keyword)}`
}

function createGenericSearchUrl(platform: CustomerRadarPlatform, keyword: string) {
  const encoded = encodeURIComponent(keyword)
  const urls: Record<CustomerRadarPlatform, string> = {
    bilibili: `https://search.bilibili.com/all?keyword=${encoded}`,
    douyin: createDouyinSearchUrl(keyword),
    facebook: `https://www.facebook.com/search/posts/?q=${encoded}`,
    instagram: `https://www.instagram.com/explore/search/keyword/?q=${encoded}`,
    kwai: createKwaiSearchUrl(keyword),
    linkedin: `https://www.linkedin.com/search/results/content/?keywords=${encoded}`,
    pinterest: `https://www.pinterest.com/search/pins/?q=${encoded}`,
    threads: `https://www.threads.net/search?q=${encoded}`,
    tiktok: `https://www.tiktok.com/search?q=${encoded}`,
    twitter: `https://x.com/search?q=${encoded}&src=typed_query&f=live`,
    wxGzh: `https://weixin.sogou.com/weixin?type=2&query=${encoded}`,
    wxSph: `https://channels.weixin.qq.com/platform/search?query=${encoded}`,
    xhs: createXhsSearchUrl(keyword),
    youtube: `https://www.youtube.com/results?search_query=${encoded}`,
  }

  return urls[platform]
}

function createXhsKeywordDiscoveryScript(keyword: string, limit: number) {
  return `
    const keyword = ${JSON.stringify(keyword)};
    const limit = ${JSON.stringify(limit)};
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const normalize = value => String(value || '').replace(/\\s+/g, ' ').trim();
    const toAbsoluteUrl = value => {
      try {
        return new URL(value || '', location.href).href;
      }
      catch {
        return '';
      }
    };
    const getWorkId = value => {
      const match = String(value || '').match(/\\/(?:explore|discovery\\/item|video)\\/([^/?#]+)/);
      return match ? match[1] : '';
    };
    const isSearchWorkUrl = value => /xiaohongshu\\.com\\/(?:explore|discovery\\/item)\\//.test(value);

    await sleep(1800);
    window.scrollTo({ top: Math.min(document.body.scrollHeight || 0, 900), behavior: 'instant' });
    await sleep(900);

    const pageText = normalize(document.body?.innerText);
    if (/登录后查看搜索结果|手机号登录|获取验证码|扫码登录|登录后查看更多/.test(pageText)) {
      return {
        items: [],
        keyword,
        message: '小红书搜索页要求登录，请先在 Chrome 里的小红书完成登录后重试',
        success: false,
      };
    }

    const seen = new Set();
    const items = [];
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    for (const anchor of anchors) {
      const sourceUrl = toAbsoluteUrl(anchor.getAttribute('href'));
      if (!isSearchWorkUrl(sourceUrl) || seen.has(sourceUrl))
        continue;

      seen.add(sourceUrl);
      const card = anchor.closest('[class*="note"], [class*="card"], section, article, div') || anchor;
      const cardText = normalize(card.innerText || anchor.innerText);
      const title = normalize(
        anchor.getAttribute('title')
        || anchor.getAttribute('aria-label')
        || card.querySelector('[class*="title"], [class*="desc"], [class*="content"]')?.textContent
        || cardText.split(' ').slice(0, 24).join(' ')
      );
      const authorLink = card.querySelector('a[href*="/user"]');
      const author = normalize(
        authorLink?.textContent
        || card.querySelector('[class*="author"], [class*="name"], [class*="user"]')?.textContent
        || '小红书用户'
      );

      items.push({
        author,
        authorId: authorLink ? toAbsoluteUrl(authorLink.getAttribute('href')) : '',
        commentContent: cardText || title || keyword,
        sourceTitle: title || '小红书搜索结果',
        sourceUrl,
        workId: getWorkId(sourceUrl),
      });

      if (items.length >= limit)
        break;
    }

    return {
      items,
      keyword,
      message: items.length > 0 ? '已通过原版 AiToEarn 插件读取小红书搜索页线索' : '搜索页已打开，但没有识别到可用作品线索',
      success: items.length > 0,
    };
  `
}

function createDouyinKeywordDiscoveryScript(keyword: string, limit: number) {
  return `
    const keyword = ${JSON.stringify(keyword)};
    const limit = ${JSON.stringify(limit)};
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const normalize = value => String(value || '').replace(/\\s+/g, ' ').trim();
    const toAbsoluteUrl = value => {
      try {
        return new URL(value || '', location.href).href;
      }
      catch {
        return '';
      }
    };
    const getWorkId = value => {
      const match = String(value || '').match(/\\/video\\/([^/?#]+)/);
      return match ? match[1] : '';
    };
    const isSearchWorkUrl = value => /douyin\\.com\\/video\\//.test(value);

    await sleep(1800);
    window.scrollTo({ top: Math.min(document.body.scrollHeight || 0, 1100), behavior: 'instant' });
    await sleep(1200);

    const pageText = normalize(document.body?.innerText);
    if (/登录后查看|扫码登录|手机号登录|获取验证码/.test(pageText)) {
      return {
        items: [],
        keyword,
        message: '抖音搜索页要求登录，请先在 Chrome 里的抖音完成登录后重试',
        success: false,
      };
    }

    const seen = new Set();
    const items = [];
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    for (const anchor of anchors) {
      const sourceUrl = toAbsoluteUrl(anchor.getAttribute('href'));
      if (!isSearchWorkUrl(sourceUrl) || seen.has(sourceUrl))
        continue;

      seen.add(sourceUrl);
      const card = anchor.closest('[data-e2e*="search"], [class*="card"], [class*="video"], section, article, li, div') || anchor;
      const cardText = normalize(card.innerText || anchor.innerText);
      const title = normalize(
        anchor.getAttribute('title')
        || anchor.getAttribute('aria-label')
        || card.querySelector('[class*="title"], [class*="desc"], [class*="content"], p')?.textContent
        || cardText.split(' ').slice(0, 28).join(' ')
      );
      const authorLink = card.querySelector('a[href*="/user"], a[href*="/share/user"]');
      const author = normalize(
        authorLink?.textContent
        || card.querySelector('[class*="author"], [class*="name"], [class*="user"]')?.textContent
        || '抖音用户'
      );
      const signalText = cardText || title || keyword;

      if (!title && !signalText)
        continue;

      items.push({
        author,
        authorId: authorLink ? toAbsoluteUrl(authorLink.getAttribute('href')) : '',
        commentContent: signalText,
        sourceTitle: title || '抖音搜索结果',
        sourceUrl,
        workId: getWorkId(sourceUrl),
      });

      if (items.length >= limit)
        break;
    }

    return {
      items,
      keyword,
      message: items.length > 0 ? '已通过原版 AiToEarn 插件读取抖音搜索页线索' : '抖音搜索页已打开，但没有识别到可用作品线索',
      success: items.length > 0,
    };
  `
}

function createKwaiKeywordDiscoveryScript(keyword: string, limit: number) {
  return `
    const keyword = ${JSON.stringify(keyword)};
    const limit = ${JSON.stringify(limit)};
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const normalize = value => String(value || '').replace(/\\s+/g, ' ').trim();
    const toAbsoluteUrl = value => {
      try {
        return new URL(value || '', location.href).href;
      }
      catch {
        return '';
      }
    };
    const getWorkId = value => {
      const match = String(value || '').match(/\\/(?:short-video|photo|video)\\/([^/?#]+)/);
      return match ? match[1] : '';
    };
    const isSearchWorkUrl = value => /kuaishou\\.com\\/(?:short-video|photo|video)\\//.test(value);

    await sleep(1800);
    window.scrollTo({ top: Math.min(document.body.scrollHeight || 0, 1100), behavior: 'instant' });
    await sleep(1200);

    const pageText = normalize(document.body?.innerText);
    if (/登录后查看|扫码登录|手机号登录|获取验证码|立即登录/.test(pageText)) {
      return {
        items: [],
        keyword,
        message: '快手搜索页要求登录，请先在 Chrome 里的快手完成登录后重试',
        success: false,
      };
    }

    const seen = new Set();
    const items = [];
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    for (const anchor of anchors) {
      const sourceUrl = toAbsoluteUrl(anchor.getAttribute('href'));
      if (!isSearchWorkUrl(sourceUrl) || seen.has(sourceUrl))
        continue;

      seen.add(sourceUrl);
      const card = anchor.closest('[class*="card"], [class*="video"], [class*="feed"], section, article, li, div') || anchor;
      const cardText = normalize(card.innerText || anchor.innerText);
      const title = normalize(
        anchor.getAttribute('title')
        || anchor.getAttribute('aria-label')
        || card.querySelector('[class*="title"], [class*="desc"], [class*="caption"], [class*="content"], p')?.textContent
        || cardText.split(' ').slice(0, 28).join(' ')
      );
      const authorLink = card.querySelector('a[href*="/profile"], a[href*="/user"]');
      const author = normalize(
        authorLink?.textContent
        || card.querySelector('[class*="author"], [class*="name"], [class*="user"]')?.textContent
        || '快手用户'
      );
      const signalText = cardText || title || keyword;

      if (!title && !signalText)
        continue;

      items.push({
        author,
        authorId: authorLink ? toAbsoluteUrl(authorLink.getAttribute('href')) : '',
        commentContent: signalText,
        sourceTitle: title || '快手搜索结果',
        sourceUrl,
        workId: getWorkId(sourceUrl),
      });

      if (items.length >= limit)
        break;
    }

    return {
      items,
      keyword,
      message: items.length > 0 ? '已通过原版 AiToEarn 插件读取快手搜索页线索' : '快手搜索页已打开，但没有识别到可用作品线索',
      success: items.length > 0,
    };
  `
}

function createGenericKeywordDiscoveryScript(keyword: string, limit: number, platform: CustomerRadarPlatform) {
  return `
    const keyword = ${JSON.stringify(keyword)};
    const limit = ${JSON.stringify(limit)};
    const platform = ${JSON.stringify(platform)};
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const normalize = value => String(value || '').replace(/\\s+/g, ' ').trim();
    const toAbsoluteUrl = value => {
      try {
        return new URL(value || '', location.href).href;
      }
      catch {
        return '';
      }
    };
    const getWorkId = value => {
      const text = String(value || '');
      return text.match(/(?:explore|video|item|short-video|photo|watch|pin|posts|reel|p|status)\\/([^/?#]+)/)?.[1]
        || text.match(/[?&]v=([^&#]+)/)?.[1]
        || text.match(/\\/@[^/]+\\/video\\/([^/?#]+)/)?.[1]
        || '';
    };
    const isLikelyWorkUrl = value => /(bilibili\\.com\\/video|douyin\\.com\\/video|facebook\\.com\\/.+\\/posts|instagram\\.com\\/(?:p|reel)|kuaishou\\.com\\/(?:short-video|photo|video)|linkedin\\.com\\/feed\\/update|pinterest\\.com\\/pin|threads\\.net\\/@|tiktok\\.com\\/@.+\\/video|x\\.com\\/.+\\/status|twitter\\.com\\/.+\\/status|weixin\\.sogou\\.com\\/link|youtube\\.com\\/watch|youtu\\.be\\/)/.test(value);

    await sleep(1800);
    window.scrollTo({ top: Math.min(document.body.scrollHeight || 0, 1200), behavior: 'instant' });
    await sleep(1200);

    const pageText = normalize(document.body?.innerText);
    if (/登录后查看|扫码登录|手机号登录|获取验证码|立即登录|Log in to|Sign in to/.test(pageText)) {
      return {
        items: [],
        keyword,
        message: '平台搜索页要求登录，请先在 Chrome 里的对应平台完成登录后重试',
        success: false,
      };
    }

    const seen = new Set();
    const items = [];
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    for (const anchor of anchors) {
      const sourceUrl = toAbsoluteUrl(anchor.getAttribute('href'));
      if (!sourceUrl || seen.has(sourceUrl))
        continue;
      if (!isLikelyWorkUrl(sourceUrl) && items.length > 0)
        continue;

      const card = anchor.closest('[class*="result"], [class*="card"], [class*="item"], [class*="feed"], section, article, li, div') || anchor;
      const cardText = normalize(card.innerText || anchor.innerText);
      const title = normalize(
        anchor.getAttribute('title')
        || anchor.getAttribute('aria-label')
        || card.querySelector('[class*="title"], [class*="desc"], [class*="caption"], [class*="content"], h1, h2, h3, p')?.textContent
        || cardText.split(' ').slice(0, 32).join(' ')
      );
      const authorLink = card.querySelector('a[href*="/user"], a[href*="/profile"], a[href*="/@"], a[href*="/channel"]');
      const author = normalize(
        authorLink?.textContent
        || card.querySelector('[class*="author"], [class*="name"], [class*="user"], [class*="channel"], [class*="creator"]')?.textContent
        || '平台用户'
      );
      const signalText = cardText || title || keyword;

      if ((!title && !signalText) || /登录|隐私政策|Cookie Policy|相关搜索/.test(signalText))
        continue;

      seen.add(sourceUrl);
      items.push({
        author,
        authorId: authorLink ? toAbsoluteUrl(authorLink.getAttribute('href')) : '',
        commentContent: signalText.slice(0, 500),
        platform,
        sourceTitle: title || '平台搜索结果',
        sourceUrl,
        workId: getWorkId(sourceUrl),
      });

      if (items.length >= limit)
        break;
    }

    return {
      items,
      keyword,
      message: items.length > 0 ? '已通过雷达页面执行器读取平台搜索页线索' : '搜索页已打开，但没有识别到可用线索',
      success: items.length > 0,
    };
  `
}

function createBilibiliKeywordDiscoveryScript(keyword: string, limit: number) {
  return `
    const keyword = ${JSON.stringify(keyword)};
    const limit = ${JSON.stringify(limit)};
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const normalize = value => String(value || '').replace(/\\s+/g, ' ').trim();
    const absolute = value => {
      try {
        return new URL(value || '', location.href).href;
      }
      catch {
        return '';
      }
    };
    const getWorkId = value => String(value || '').match(/\\/(?:video\\/)?(BV[a-zA-Z0-9]+|av\\d+|read\\/cv\\d+)/)?.[1] || '';

    await sleep(1600);
    window.scrollTo({ top: Math.min(document.body.scrollHeight || 0, 1200), behavior: 'instant' });
    await sleep(900);

    const cards = Array.from(document.querySelectorAll('.video-list-item, .bili-video-card, .video-item, .result-item, .article-item, li, article, div'))
      .filter(element => element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0);
    const seen = new Set();
    const items = [];

    for (const card of cards) {
      const link = card.querySelector('a[href*="/video/"], a[href*="/read/"], a[href*="www.bilibili.com/video"], a[href*="www.bilibili.com/read"]');
      const sourceUrl = absolute(link?.getAttribute('href'));
      if (!sourceUrl || seen.has(sourceUrl))
        continue;

      const text = normalize(card.innerText || card.textContent);
      const title = normalize(
        link?.getAttribute('title')
        || card.querySelector('.bili-video-card__info--tit, .title, [class*="title"], h3')?.textContent
        || text.split(' ').slice(0, 28).join(' ')
      );
      const authorLink = card.querySelector('a[href*="space.bilibili.com"], a[href*="/space/"], [class*="author"], [class*="up"]');
      const author = normalize(authorLink?.textContent || card.querySelector('[class*="author"], [class*="up"], [class*="name"]')?.textContent || 'B站用户');
      const signalText = normalize(text || title || keyword);

      if (!title || /综合排序|最多点击|最新发布|直播|番剧|课程/.test(signalText))
        continue;

      seen.add(sourceUrl);
      items.push({
        author,
        authorId: authorLink ? absolute(authorLink.getAttribute('href')) : '',
        commentContent: signalText.slice(0, 500),
        platform: 'bilibili',
        sourceTitle: title,
        sourceUrl,
        workId: getWorkId(sourceUrl),
      });

      if (items.length >= limit)
        break;
    }

    return {
      items,
      keyword,
      message: items.length > 0 ? '已从 B站搜索页识别视频/专栏线索' : 'B站搜索页已打开，但没有识别到可用线索',
      success: items.length > 0,
    };
  `
}

function createWxGzhKeywordDiscoveryScript(keyword: string, limit: number) {
  return `
    const keyword = ${JSON.stringify(keyword)};
    const limit = ${JSON.stringify(limit)};
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const normalize = value => String(value || '').replace(/\\s+/g, ' ').trim();
    const absolute = value => {
      try {
        return new URL(value || '', location.href).href;
      }
      catch {
        return '';
      }
    };

    await sleep(1600);
    window.scrollTo({ top: Math.min(document.body.scrollHeight || 0, 1000), behavior: 'instant' });
    await sleep(800);

    const pageText = normalize(document.body?.innerText);
    if (/请输入验证码|用户您好，您的访问过于频繁|异常访问/.test(pageText)) {
      return {
        items: [],
        keyword,
        message: '微信公众号搜索触发平台验证，请人工完成验证或稍后重试',
        success: false,
      };
    }

    const cards = Array.from(document.querySelectorAll('.news-box li, .txt-box, .news-list li, .results .result, article, li, div'))
      .filter(element => element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0);
    const seen = new Set();
    const items = [];

    for (const card of cards) {
      const link = card.querySelector('a[href*="weixin.sogou.com/link"], a[href*="mp.weixin.qq.com/s"], a[href*="/link?url="], a[href]');
      const sourceUrl = absolute(link?.getAttribute('href'));
      if (!sourceUrl || seen.has(sourceUrl))
        continue;

      const text = normalize(card.innerText || card.textContent);
      const title = normalize(link?.textContent || card.querySelector('h3, h4, [class*="title"], .txt-box a')?.textContent || text.split(' ').slice(0, 28).join(' '));
      const author = normalize(card.querySelector('.s-p, .account, [class*="account"], [class*="name"]')?.textContent || '微信公众号');
      const signalText = normalize(text || title || keyword);

      if (!title || /相关搜索|搜狗搜索|微信扫一扫|请输入验证码/.test(signalText))
        continue;

      seen.add(sourceUrl);
      items.push({
        author,
        authorId: author,
        commentContent: signalText.slice(0, 500),
        platform: 'wxGzh',
        sourceTitle: title,
        sourceUrl,
        workId: sourceUrl,
      });

      if (items.length >= limit)
        break;
    }

    return {
      items,
      keyword,
      message: items.length > 0 ? '已从微信公众号公开文章搜索页识别线索' : '公众号搜索页已打开，但没有识别到可用文章线索',
      success: items.length > 0,
    };
  `
}

function createWxSphKeywordDiscoveryScript(keyword: string, limit: number) {
  return `
    const keyword = ${JSON.stringify(keyword)};
    const limit = ${JSON.stringify(limit)};
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const normalize = value => String(value || '').replace(/\\s+/g, ' ').trim();
    const absolute = value => {
      try {
        return new URL(value || '', location.href).href;
      }
      catch {
        return '';
      }
    };

    await sleep(1800);
    window.scrollTo({ top: Math.min(document.body.scrollHeight || 0, 1000), behavior: 'instant' });
    await sleep(1000);

    const pageText = normalize(document.body?.innerText);
    if (/扫码登录|微信扫码|登录后|请登录/.test(pageText)) {
      return {
        items: [],
        keyword,
        message: '视频号页面要求登录，请先在 Chrome 里的视频号完成登录后重试',
        success: false,
      };
    }

    const cards = Array.from(document.querySelectorAll('[class*="feed"], [class*="card"], [class*="video"], [class*="result"], article, li, div'))
      .filter(element => element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0)
      .filter(element => normalize(element.innerText || element.textContent).length >= 8);
    const seen = new Set();
    const items = [];

    for (const card of cards) {
      const link = card.querySelector('a[href]');
      const sourceUrl = absolute(link?.getAttribute('href')) || location.href;
      const text = normalize(card.innerText || card.textContent);
      const title = normalize(card.querySelector('[class*="title"], [class*="desc"], [class*="content"], h3, p')?.textContent || text.split(' ').slice(0, 28).join(' '));
      const author = normalize(card.querySelector('[class*="author"], [class*="nickname"], [class*="name"]')?.textContent || '视频号用户');
      const key = sourceUrl + title + author;

      if (!title || seen.has(key) || /创作者中心|数据概览|发布动态|登录/.test(text))
        continue;

      seen.add(key);
      items.push({
        author,
        authorId: author,
        commentContent: text.slice(0, 500),
        platform: 'wxSph',
        sourceTitle: title,
        sourceUrl,
        workId: sourceUrl,
      });

      if (items.length >= limit)
        break;
    }

    return {
      items,
      keyword,
      message: items.length > 0 ? '已从视频号页面识别线索' : '视频号页面已打开，但没有识别到可用线索',
      success: items.length > 0,
    };
  `
}

function normalizeKeywordDiscoverySignals(
  result: KeywordDiscoveryPluginResult | undefined,
  input: ScanKeywordDiscoveryInput,
): KeywordDiscoverySignal[] {
  const keyword = input.keyword.trim()
  const rawItems: Partial<KeywordDiscoverySignal>[] = Array.isArray(result?.items) ? result.items : []

  return rawItems
    .map((item: Partial<KeywordDiscoverySignal>) => ({
      author: item.author || '平台用户',
      authorId: item.authorId || '',
      commentContent: item.commentContent || item.sourceTitle || '',
      keyword,
      platform: input.platform,
      sourceTitle: item.sourceTitle || `关键词 ${keyword} 的搜索结果`,
      sourceUrl: item.sourceUrl || '',
      workId: item.workId,
    }))
    .filter(item => item.commentContent.trim())
    .filter(item => !noisyKeywordSignalPattern.test(`${item.author} ${item.commentContent} ${item.sourceTitle}`))
    .filter(item => item.sourceUrl.startsWith('http'))
    .filter(item => !input.excludedWords?.some(word => item.commentContent.includes(word) || item.sourceTitle.includes(word)))
}

export function getCustomerRadarPlatformCapabilities(
  platforms: CustomerRadarPlatform[],
  plugin?: AIToEarnPluginAPI | null,
): CustomerRadarPlatformCapability[] {
  const capabilities = getExecutionCapabilities(plugin)

  return platforms.map((platform) => {
    if (platform === 'xhs') {
      return {
        platform,
        available: true,
        canDiscoverKeyword: true,
        canPublishComment: true,
        canScanComments: true,
        canSendDirectMessage: true,
        note: capabilities.hasXhsRequest
          ? '小红书雷达全功能已开放：原版插件请求能力可抓评论、可评论作品/回复评论；关键词获客有页面执行器时会自动增强。'
          : capabilities.hasPageAutomation
            ? '小红书雷达全功能已开放：页面执行器可用于关键词获客；评论抓取/回复会等待 xhsRequest 或官方接口。'
            : '小红书雷达全功能已开放；当前执行通道未连接，频道登录态请以频道管理为准。',
      }
    }

    if (platform === 'douyin') {
      return {
        platform,
        available: true,
        canDiscoverKeyword: true,
        canPublishComment: true,
        canScanComments: true,
        canSendDirectMessage: true,
        note: capabilities.hasUnifiedInteraction
          ? '抖音雷达全功能已开放：页面执行器可做关键词搜索和可见评论扫描；频道账号登录仍走官方授权，不由插件同步。'
          : capabilities.hasRemoteAutomation
            ? '抖音雷达全功能已开放：关键词搜索执行通道可用；评论扫描/触达会等待页面互动执行器或官方接口。'
            : '抖音雷达全功能已开放；当前执行通道未连接，频道登录请走官方 OAuth。',
      }
    }

    if (platform === 'kwai') {
      return {
        platform,
        available: true,
        canDiscoverKeyword: true,
        canPublishComment: true,
        canScanComments: true,
        canSendDirectMessage: true,
        note: capabilities.hasUnifiedInteraction
          ? '快手雷达全功能已开放：页面执行器可做关键词搜索和可见评论扫描；评论/私信触达需要人工确认和风控限频。'
          : capabilities.hasRemoteAutomation
            ? '快手雷达全功能已开放：关键词搜索执行通道可用；评论扫描/触达会等待页面互动执行器或官方接口。'
            : '快手雷达全功能已开放；当前执行通道未连接，频道登录请走官方 OAuth。',
      }
    }

    if (domesticRadarPlatforms.has(platform)) {
      return {
        platform,
        available: true,
        canDiscoverKeyword: true,
        canPublishComment: true,
        canScanComments: true,
        canSendDirectMessage: platform !== 'bilibili' && platform !== 'wxGzh',
        note: capabilities.hasPageAutomation
          ? `${platformCapabilityNotes[platform]}国内平台优先适配已启用，发布渠道仍走原版链路。`
          : `${platformCapabilityNotes[platform]}当前执行通道未连接，真实扫描会等待插件接入。`,
      }
    }

    return {
      platform,
      available: true,
      canDiscoverKeyword: true,
      canPublishComment: true,
      canScanComments: true,
      canSendDirectMessage: true,
      note: `${platformCapabilityNotes[platform]}当前若自动执行通道未连接，会先生成线索、回复草稿和人工确认任务。`,
    }
  })
}

export async function probeCustomerRadarExecutor(profile: CustomerRadarProfile) {
  const checkedAt = nowText()
  const plugin = await waitForPluginBridge(8000)
  const permissionLogs: CustomerRadarExecutionLog[] = []

  if (!plugin) {
    return {
      capabilities: profile.platforms.map(platform => createUnavailableCapability(
        platform,
        '雷达全功能已开放；未检测到本地页面执行器时，会先生成线索、回复草稿和人工确认任务，真实抓取/发布等待执行通道接入。',
      )),
      logs: [
        createLog('warning', '执行通道未接入', '客户雷达全平台功能已开放；当前页面没有检测到本地页面执行器，真实抓取/发布会等待执行通道，频道账号登录态不受影响。'),
      ],
      socialAccounts: profile.platforms.map(platform => createSocialAccount(platform, {
        lastCheckedAt: checkedAt,
        loginStatus: 'unknown',
        note: '本地执行器未接入；平台登录态请以频道管理读取结果为准。',
        pluginConnected: false,
      })),
    }
  }

  try {
    const permission = await withTimeout(plugin.checkPermission(), 12000, '本地执行器权限检查')
    if (!permission.granted) {
      permissionLogs.push(createLog(
        'warning',
        '执行器权限未完整授权',
        `已检测到执行桥，但部分平台动作可能不可用；频道账号登录态仍以频道管理为准。已授权权限：${permission.permissions?.join('、') || '无'}`,
      ))
    }
  }
  catch (error) {
    permissionLogs.push(createLog(
      'warning',
      '执行器权限检查未返回',
      `${error instanceof Error ? error.message : '本地执行器权限检查异常'}；客户雷达会继续按已检测到的具体能力运行。`,
    ))
  }

  const capabilities = getCustomerRadarPlatformCapabilities(profile.platforms, plugin)
  const executionFlags = getExecutionCapabilities(plugin)
  const enabledSummary = [
    executionFlags.hasXhsRequest ? '小红书原版请求能力' : '',
    executionFlags.hasRemoteAutomation ? '关键词页面执行器' : '',
    executionFlags.hasUnifiedInteraction ? '平台互动执行器' : '',
  ].filter(Boolean).join('、') || '未发现可执行动作'
  const logs: CustomerRadarExecutionLog[] = [
    createLog(
      'success',
      '本地执行器握手完成',
      `已确认执行桥注入成功；可用能力：${enabledSummary}。频道账号归属仍只由官方授权/频道管理维护。`,
    ),
    ...permissionLogs,
  ]
  const socialAccounts = profile.platforms.map(platform => createSocialAccount(platform, {
    lastCheckedAt: checkedAt,
    loginStatus: 'unknown',
    note: '执行器握手成功；账号是否已登录请以频道管理读取结果为准。',
    pluginConnected: true,
  }))

  return {
    capabilities,
    logs,
    socialAccounts,
  }
}

export function inspectCustomerRadarExecutor(profile: CustomerRadarProfile) {
  const capabilities = getCustomerRadarPlatformCapabilities(profile.platforms)
  const scanReadyCount = capabilities.filter(item => item.canScanComments).length
  const publishReadyCount = capabilities.filter(item => item.canPublishComment).length
  const logs: CustomerRadarExecutionLog[] = [
    createLog(
      hasPlugin() ? 'success' : 'warning',
      hasPlugin() ? '执行桥已检测' : '执行桥未接入',
      hasPlugin()
        ? `已检测 ${capabilities.length} 个平台，其中 ${scanReadyCount} 个支持评论扫描，${publishReadyCount} 个支持发布评论。`
        : '当前本地 Web 页面未检测到执行桥，真实平台动作不可用；频道账号登录态以频道管理为准。',
    ),
  ]

  return {
    capabilities,
    logs,
  }
}

export async function scanOwnedPostComments(input: ScanOwnedPostCommentsInput) {
  if (!input.workId.trim()) {
    return {
      comments: [],
      log: createLog('error', '缺少作品 ID', `请先填写自己的${platformLabels[input.platform]}作品 ID 或链接，再抓取评论。`),
      success: false,
    }
  }

  const plugin = await waitForPluginBridge(6000)

  if (!plugin) {
    return {
      comments: [],
        log: createLog('warning', '执行桥未接入', `${platformLabels[input.platform]}雷达评论抓取功能已开放；当前等待该平台执行通道接入，频道登录不等于客户雷达抓取能力。`),
        success: false,
      }
  }

  try {
    const executionFlags = getExecutionCapabilities(plugin)
    if (input.platform === 'xhs' && !executionFlags.hasXhsRequest) {
      return {
        comments: [],
        log: createLog('warning', '小红书请求能力缺失', '已检测到执行桥，但没有原版 xhsRequest 能力，不能抓取小红书评论。'),
        success: false,
      }
    }

    if ((input.platform === 'douyin' || input.platform === 'kwai') && !executionFlags.hasUnifiedInteraction) {
      return {
        comments: [],
        log: createLog('warning', '页面互动执行器缺失', `${platformLabels[input.platform]}评论扫描不能靠频道登录完成，需要页面互动执行器或后续官方接口。`),
        success: false,
      }
    }

    const mappedPlatform = platformMap[input.platform]
    if (!mappedPlatform || !platformManager.isSupported(mappedPlatform)) {
      return {
        comments: [],
        log: createLog('warning', '评论抓取等待执行通道', `${platformLabels[input.platform]}雷达评论抓取功能已开放，当前平台执行适配器还未接入。`),
        success: false,
      }
    }

    const response = await platformManager.getCommentList(mappedPlatform, {
      count: input.count || 20,
      workId: input.workId,
      xsecToken: input.xsecToken,
    })

    if (!response.success) {
      return {
        comments: [],
        log: createLog('error', `${platformLabels[input.platform]}评论抓取失败`, response.message || '本地执行器返回抓取失败。'),
        success: false,
      }
    }

    return {
      comments: response.comments,
      log: createLog('success', `已抓取${platformLabels[input.platform]}评论`, `从自己的${platformLabels[input.platform]}作品抓取到 ${response.comments.length} 条评论。`),
      success: true,
    }
  }
  catch (error) {
    return {
      comments: [],
      log: createLog('error', `${platformLabels[input.platform]}评论抓取异常`, error instanceof Error ? error.message : '未知抓取异常'),
      success: false,
    }
  }
}

export async function scanKeywordDiscovery(input: ScanKeywordDiscoveryInput) {
  const keyword = input.keyword.trim()
  if (!keyword) {
    return {
      log: createLog('error', '缺少搜索关键词', '请先填写客户画像里的关键词，再运行关键词获客。'),
      signals: [] as KeywordDiscoverySignal[],
      success: false,
    }
  }

  const plugin = await waitForPluginBridge(6000)

  if (!plugin) {
    return {
      log: createLog('warning', '执行桥未接入，关键词获客未执行', `当前页面没有检测到客户雷达执行桥，已阻止“${keyword}”关键词样例线索入库。请先接入对应平台执行能力，再运行真实关键词获客。`),
      signals: [] as KeywordDiscoverySignal[],
      success: false,
    }
  }

  try {
    let result: KeywordDiscoveryPluginResult | undefined
    const executionFlags = getExecutionCapabilities(plugin)

    if (!executionFlags.hasRemoteAutomation && !executionFlags.hasUnifiedInteraction) {
      return {
        log: createLog('warning', '关键词执行通道待接入', `${platformLabels[input.platform]}雷达关键词获客功能已开放；当前需要页面执行器或官方搜索接口完成真实采集，频道登录状态不能替代采集能力。`),
        signals: [] as KeywordDiscoverySignal[],
        success: false,
      }
    }

    if (executionFlags.hasRemoteAutomation) {
      const remoteAutomationRun = plugin.remoteAutomationRun!
      const url = input.platform === 'xhs'
        ? createXhsSearchUrl(keyword)
        : input.platform === 'douyin'
          ? createDouyinSearchUrl(keyword)
          : input.platform === 'kwai'
            ? createKwaiSearchUrl(keyword)
            : createGenericSearchUrl(input.platform, keyword)
      const code = input.platform === 'xhs'
        ? createXhsKeywordDiscoveryScript(keyword, input.count || 8)
        : input.platform === 'douyin'
          ? createDouyinKeywordDiscoveryScript(keyword, input.count || 8)
          : input.platform === 'kwai'
            ? createKwaiKeywordDiscoveryScript(keyword, input.count || 8)
            : input.platform === 'bilibili'
              ? createBilibiliKeywordDiscoveryScript(keyword, input.count || 8)
              : input.platform === 'wxGzh'
                ? createWxGzhKeywordDiscoveryScript(keyword, input.count || 8)
                : input.platform === 'wxSph'
                  ? createWxSphKeywordDiscoveryScript(keyword, input.count || 8)
                  : createGenericKeywordDiscoveryScript(keyword, input.count || 8, input.platform)
      const remoteResult = await remoteAutomationRun<KeywordDiscoveryPluginResult>({
        code,
        needScreenshot: false,
        timeout: 45000,
        url,
      })

      if (!remoteResult.success && !remoteResult.result) {
        throw new Error(remoteResult.error || remoteResult.message || '页面执行器关键词采集失败')
      }

      result = remoteResult.result || {
        items: [],
        message: remoteResult.message,
        success: remoteResult.success,
      }
    }
    else {
      result = await plugin.unifiedInteraction?.({
        action: 'discoverByKeyword',
        count: input.count || 8,
        keyword,
        platform: input.platform,
      })

      if (!result) {
        throw new Error('页面互动执行器未返回关键词采集结果')
      }
    }

    const signals = normalizeKeywordDiscoverySignals(result, input)

    return {
      log: createLog(
        signals.length ? 'success' : 'warning',
        signals.length ? '关键词获客扫描完成' : '关键词搜索暂无可用线索',
        result?.message || `围绕“${keyword}”识别到 ${signals.length} 条潜在线索。`,
      ),
      signals,
      success: signals.length > 0,
    }
  }
  catch (error) {
    return {
      log: createLog('error', '关键词获客扫描异常', error instanceof Error ? error.message : '未知扫描异常'),
      signals: [] as KeywordDiscoverySignal[],
      success: false,
    }
  }
}

export async function publishCustomerRadarReply(candidate: CustomerReplyCandidate, options?: { liveExecutionEnabled?: boolean }) {
  const mappedPlatform = platformMap[candidate.platform]
  const plugin = await waitForPluginBridge(6000)

  if (!plugin) {
    return {
      log: createLog('warning', '真实执行等待通道', '全平台雷达触达功能已开放；当前执行桥未接入，已保留回复草稿和人工确认任务，真实平台没有收到评论。'),
      skipped: true,
      success: true,
    }
  }

  const executionFlags = getExecutionCapabilities(plugin)
  if (candidate.platform === 'xhs' && !executionFlags.hasXhsRequest) {
    return {
      log: createLog('warning', '小红书执行通道待接入', '小红书回复功能已开放；真实发布需要原版 xhsRequest 能力，频道登录状态不能替代执行能力。'),
      skipped: true,
      success: true,
    }
  }

  if (candidate.platform === 'douyin' && !executionFlags.hasDouyinInteraction) {
    return {
      log: createLog('warning', '抖音执行通道待接入', '抖音回复功能已开放；真实发布需要页面互动执行器，账号绑定仍走官方授权，不由插件同步。'),
      skipped: true,
      success: true,
    }
  }

  if (!mappedPlatform || !platformManager.isSupported(mappedPlatform)) {
    return {
      log: createLog('warning', '平台执行通道待接入', `${platformLabels[candidate.platform]}回复功能已开放；当前平台自动执行适配器还未接入，已保留人工确认任务。`),
      skipped: true,
      success: true,
    }
  }

  if (!candidate.workId || (!candidate.commentId && candidate.sourceType === 'owned_post_comments')) {
    return {
      log: createLog('warning', '模拟发布回复', '当前候选回复还没有真实 workId/commentId，已按本地演示流程写入客户记忆；接入扫描器后会自动带入真实参数。'),
      skipped: true,
      success: true,
    }
  }

  if (!options?.liveExecutionEnabled) {
    return {
      log: createLog('warning', '真实执行已关闭', '已生成候选回复并完成本地演练，但没有向平台发送评论。需要真实发布时，请先打开“真实平台执行”开关。'),
      skipped: true,
      success: true,
    }
  }

  if (hasUnsafeOutboundTerms(candidate.replyContent)) {
    return {
      log: createLog('warning', '回复内容已拦截', '候选回复包含平台外显风险词，已阻止发布。请重新生成更像真人交流的回复后再执行。'),
      skipped: true,
      success: false,
    }
  }

  try {
    const response = await platformManager.commentWork(mappedPlatform, {
      content: candidate.replyContent,
      replyToCommentId: candidate.sourceType === 'owned_post_comments' ? candidate.commentId : undefined,
      workId: candidate.workId,
    })

    return {
      log: createLog(
        response.success ? 'success' : 'error',
        response.success ? '平台评论已发布' : '平台评论发布失败',
        response.message || (response.success ? '评论已通过本地执行器发布。' : '本地执行器返回发布失败。'),
      ),
      success: response.success,
    }
  }
  catch (error) {
    return {
      log: createLog('error', '平台执行异常', error instanceof Error ? error.message : '未知执行错误'),
      success: false,
    }
  }
}
