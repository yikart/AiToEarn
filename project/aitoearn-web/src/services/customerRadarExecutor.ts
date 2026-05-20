import type {
  CustomerRadarExecutionLog,
  CustomerRadarPlatform,
  CustomerRadarPlatformCapability,
  CustomerRadarProfile,
  CustomerRadarSocialAccount,
  CustomerReplyCandidate,
} from '@/api/customerRadar'
import { PlatType } from '@/app/config/platConfig'
import { ensurePluginBridge, waitForPluginBridge } from '@/store/plugin/bridge'
import type { CommentItem } from '@/store/plugin/plats/types'
import { platformManager } from '@/store/plugin/plats/manager'

const platformMap: Partial<Record<CustomerRadarPlatform, PlatType>> = {
  douyin: PlatType.Douyin,
  xhs: PlatType.Xhs,
}

const outboundRiskTerms = ['AI', 'ai', '测试', '自动化', '机器人', '主动获客工具']
const noisyKeywordSignalPattern = /相关搜索|登录后查看搜索结果|手机号登录|获取验证码|扫码登录|沪ICP备|营业执照/

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

function hasPlugin() {
  return Boolean(ensurePluginBridge())
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
    available: false,
    canPublishComment: false,
    canScanComments: false,
    canSendDirectMessage: false,
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

const demoOwnedPostComments: CommentItem[] = [
  {
    id: 'demo-owned-comment-1',
    content: '你们这个 AI 获客是怎么收费的？适合刚开业的小店吗？',
    createTime: Date.now(),
    hasMoreReplies: false,
    ipLocation: '杭州',
    isAuthor: false,
    isLiked: false,
    likeCount: 3,
    origin: {},
    replies: [],
    replyCount: 0,
    user: {
      avatar: '',
      id: 'demo-user-1',
      nickname: '刚开业的小店主',
    },
  },
  {
    id: 'demo-owned-comment-2',
    content: '可以帮我看看小红书账号为什么一直没人咨询吗？',
    createTime: Date.now(),
    hasMoreReplies: false,
    ipLocation: '苏州',
    isAuthor: false,
    isLiked: false,
    likeCount: 5,
    origin: {},
    replies: [],
    replyCount: 0,
    user: {
      avatar: '',
      id: 'demo-user-2',
      nickname: '门店运营小陈',
    },
  },
]

export interface ScanOwnedPostCommentsInput {
  count?: number
  platform: Extract<CustomerRadarPlatform, 'xhs' | 'douyin'>
  workId: string
  xsecToken?: string
}

export interface KeywordDiscoverySignal {
  author: string
  authorId?: string
  commentContent: string
  keyword: string
  platform: Extract<CustomerRadarPlatform, 'xhs' | 'douyin'>
  sourceTitle: string
  sourceUrl: string
  workId?: string
}

export interface ScanKeywordDiscoveryInput {
  count?: number
  excludedWords?: string[]
  keyword: string
  platform: Extract<CustomerRadarPlatform, 'xhs' | 'douyin'>
}

interface KeywordDiscoveryPluginResult {
  items?: Partial<KeywordDiscoverySignal>[]
  keyword?: string
  message?: string
  success?: boolean
}

const demoKeywordSignals: KeywordDiscoverySignal[] = [
  {
    author: '同城新店主',
    authorId: 'demo-keyword-user-1',
    commentContent: '新店开业一个月，小红书发了不少但没人咨询，想知道怎么找到同城客户。',
    keyword: '开业引流',
    platform: 'xhs',
    sourceTitle: '新店开业到底怎么做小红书才有咨询？',
    sourceUrl: 'https://www.xiaohongshu.com/search_result?keyword=%E5%BC%80%E4%B8%9A%E5%BC%95%E6%B5%81',
    workId: 'demo-keyword-note-1',
  },
  {
    author: '门店运营阿南',
    authorId: 'demo-keyword-user-2',
    commentContent: '每天发内容但没有转化，不知道评论区哪些人是真客户。',
    keyword: '小红书运营',
    platform: 'xhs',
    sourceTitle: '门店账号发内容没有转化怎么办',
    sourceUrl: 'https://www.xiaohongshu.com/search_result?keyword=%E5%B0%8F%E7%BA%A2%E4%B9%A6%E8%BF%90%E8%90%A5',
    workId: 'demo-keyword-note-2',
  },
]

function createXhsSearchUrl(keyword: string) {
  return `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}&source=web_search_result_notes`
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
    .filter(item => item.sourceUrl.includes('/explore/') || item.sourceUrl.includes('/video/') || item.sourceUrl.includes('/discovery/item/'))
    .filter(item => !input.excludedWords?.some(word => item.commentContent.includes(word) || item.sourceTitle.includes(word)))
}

export function getCustomerRadarPlatformCapabilities(
  platforms: CustomerRadarPlatform[],
): CustomerRadarPlatformCapability[] {
  const pluginReady = hasPlugin()

  return platforms.map((platform) => {
    if (platform === 'xhs') {
      return {
        platform,
        available: pluginReady,
        canPublishComment: pluginReady,
        canScanComments: pluginReady,
        canSendDirectMessage: false,
        note: pluginReady
          ? '小红书本地执行器可用：可抓评论、可评论作品/回复评论。'
          : '本地执行器未接入，真实抓取和发布小红书评论会进入安全演练；频道登录态请以频道管理为准。',
      }
    }

    if (platform === 'douyin') {
      return {
        platform,
        available: pluginReady,
        canPublishComment: pluginReady,
        canScanComments: false,
        canSendDirectMessage: pluginReady,
        note: pluginReady
          ? '抖音本地执行器可发布评论/私信，但评论列表抓取仍需补齐。'
          : '本地执行器未接入；抖音评论列表抓取仍需开发，频道登录态请以频道管理为准。',
      }
    }

    return {
      platform,
      available: false,
      canPublishComment: false,
      canScanComments: false,
      canSendDirectMessage: false,
      note: `${platform} 暂未接入评论扫描和触达执行器。`,
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
        '未检测到本地页面执行器，真实抓取和发布不可用；当前任务会进入安全演练。',
      )),
      logs: [
        createLog('warning', '本地执行器未接入', '当前页面没有检测到本地页面执行器；频道账号登录态不受影响，真实抓取/发布会进入安全演练。'),
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
        '原版插件权限未完整授权',
        `已检测到原版插件并继续启用关键词获客页面执行能力；频道账号登录态仍以频道管理为准。已授权权限：${permission.permissions?.join('、') || '无'}`,
      ))
    }
  }
  catch (error) {
    permissionLogs.push(createLog(
      'warning',
      '原版插件权限检查未返回',
      `${error instanceof Error ? error.message : '本地执行器权限检查异常'}；关键词获客会继续优先尝试原版插件页面执行能力。`,
    ))
  }

  const capabilities = getCustomerRadarPlatformCapabilities(profile.platforms)
  const logs: CustomerRadarExecutionLog[] = [
    createLog(
      'success',
      '本地执行器握手完成',
      `已确认原版/本地页面执行器注入成功；真实平台动作会复用频道账号登录态，不再由执行器单独登录。`,
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
      hasPlugin() ? '本地执行器已检测' : '本地执行器未接入',
      hasPlugin()
        ? `已检测 ${capabilities.length} 个平台，其中 ${scanReadyCount} 个支持评论扫描，${publishReadyCount} 个支持发布评论。`
        : '当前本地 Web 页面未检测到本地执行器，任务会进入安全演练；频道账号登录态以频道管理为准。',
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
      log: createLog('error', '缺少笔记 ID', '请先填写自己的小红书笔记 ID，再抓取评论。'),
      success: false,
    }
  }

  if (input.platform === 'douyin') {
    return {
      comments: [],
      log: createLog('warning', '抖音评论抓取待开发', '抖音当前已有评论/私信发布能力，但评论列表抓取还没有接入，所以先从小红书自己笔记评论开始。'),
      success: false,
    }
  }

  const plugin = await waitForPluginBridge(6000)

  if (!plugin) {
    return {
      comments: demoOwnedPostComments,
      log: createLog('warning', '本地执行器未接入，使用样例评论', '当前页面没有检测到本地执行器，已载入本地样例评论用于验证流程；真实抓取需要本地执行器在线。'),
      success: true,
    }
  }

  try {
    const response = await platformManager.getCommentList(PlatType.Xhs, {
      count: input.count || 20,
      workId: input.workId,
      xsecToken: input.xsecToken,
    })

    if (!response.success) {
      return {
        comments: [],
        log: createLog('error', '小红书评论抓取失败', response.message || '本地执行器返回抓取失败。'),
        success: false,
      }
    }

    return {
      comments: response.comments,
      log: createLog('success', '已抓取小红书评论', `从自己的笔记抓取到 ${response.comments.length} 条评论。`),
      success: true,
    }
  }
  catch (error) {
    return {
      comments: [],
      log: createLog('error', '小红书评论抓取异常', error instanceof Error ? error.message : '未知抓取异常'),
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

  if (input.platform === 'douyin') {
    return {
      log: createLog('warning', '抖音搜索采集待加固', '抖音当前已有评论/私信发布能力，关键词搜索采集先从小红书真实链路开始。'),
      signals: [] as KeywordDiscoverySignal[],
      success: false,
    }
  }

  const plugin = await waitForPluginBridge(6000)

  if (!plugin) {
    const fallbackSignals = demoKeywordSignals
      .filter(item => !input.excludedWords?.some(word => item.commentContent.includes(word) || item.sourceTitle.includes(word)))
      .slice(0, input.count || 8)

    return {
      log: createLog('warning', '本地执行器未接入，使用关键词样例线索', `当前页面没有检测到本地执行器，已用“${keyword}”样例线索验证关键词获客流程。`),
      signals: fallbackSignals.map(item => ({ ...item, keyword })),
      success: true,
    }
  }

  try {
    let result: KeywordDiscoveryPluginResult | undefined

    if (input.platform === 'xhs' && plugin.remoteAutomationRun) {
      const remoteResult = await plugin.remoteAutomationRun<KeywordDiscoveryPluginResult>({
        code: createXhsKeywordDiscoveryScript(keyword, input.count || 8),
        needScreenshot: false,
        timeout: 45000,
        url: createXhsSearchUrl(keyword),
      })

      if (!remoteResult.success && !remoteResult.result) {
        throw new Error(remoteResult.error || remoteResult.message || '原版插件关键词采集失败')
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
      log: createLog('warning', '模拟发布回复', '本地执行器未接入，已按本地演示流程写入客户记忆；真实平台没有收到评论。'),
      skipped: true,
      success: true,
    }
  }

  if (!mappedPlatform || !platformManager.isSupported(mappedPlatform)) {
    return {
      log: createLog('error', '平台执行器缺失', `${candidate.platform} 暂未接入评论发布执行器。`),
      success: false,
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
