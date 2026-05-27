import { PLATFORM_ORIGINS, REQUIRED_PERMISSIONS, RuntimeAction } from './shared.js'

const EXTENSION_VERSION = '0.1.1'

const platformCookieUrls = {
  bilibili: ['https://www.bilibili.com'],
  douyin: ['https://www.douyin.com', 'https://creator.douyin.com'],
  facebook: ['https://www.facebook.com'],
  instagram: ['https://www.instagram.com'],
  kwai: ['https://www.kuaishou.com', 'https://cp.kuaishou.com'],
  linkedin: ['https://www.linkedin.com'],
  pinterest: ['https://www.pinterest.com'],
  threads: ['https://www.threads.net'],
  tiktok: ['https://www.tiktok.com'],
  twitter: ['https://x.com', 'https://twitter.com'],
  wxGzh: ['https://weixin.sogou.com', 'https://mp.weixin.qq.com'],
  wxSph: ['https://channels.weixin.qq.com'],
  xhs: ['https://www.xiaohongshu.com', 'https://creator.xiaohongshu.com', 'https://edith.xiaohongshu.com'],
  youtube: ['https://www.youtube.com'],
}

const platformTabMatchers = {
  bilibili: ['*://*.bilibili.com/*'],
  douyin: ['*://*.douyin.com/*', '*://creator.douyin.com/*'],
  facebook: ['*://*.facebook.com/*'],
  instagram: ['*://*.instagram.com/*'],
  kwai: ['*://*.kuaishou.com/*', '*://cp.kuaishou.com/*'],
  linkedin: ['*://*.linkedin.com/*'],
  pinterest: ['*://*.pinterest.com/*'],
  threads: ['*://*.threads.net/*'],
  tiktok: ['*://*.tiktok.com/*'],
  twitter: ['*://x.com/*', '*://*.twitter.com/*'],
  wxGzh: ['*://weixin.sogou.com/*', '*://*.weixin.qq.com/*'],
  wxSph: ['*://channels.weixin.qq.com/*'],
  xhs: ['*://*.xiaohongshu.com/*'],
  youtube: ['*://*.youtube.com/*'],
}

function normalizePlatform(platform) {
  if (platform === 'bilibili' || platform === 'BILIBILI')
    return 'bilibili'
  if (platform === 'xhs' || platform === 'Xhs')
    return 'xhs'
  if (platform === 'douyin' || platform === 'Douyin')
    return 'douyin'
  if (platform === 'kwai' || platform === 'Kwai' || platform === 'KWAI')
    return 'kwai'
  if (platform === 'facebook' || platform === 'Facebook')
    return 'facebook'
  if (platform === 'instagram' || platform === 'Instagram')
    return 'instagram'
  if (platform === 'linkedin' || platform === 'LinkedIn')
    return 'linkedin'
  if (platform === 'pinterest' || platform === 'Pinterest')
    return 'pinterest'
  if (platform === 'threads' || platform === 'Threads')
    return 'threads'
  if (platform === 'tiktok' || platform === 'Tiktok')
    return 'tiktok'
  if (platform === 'twitter' || platform === 'Twitter')
    return 'twitter'
  if (platform === 'wxGzh' || platform === 'WxGzh')
    return 'wxGzh'
  if (platform === 'wxSph' || platform === 'WxSph')
    return 'wxSph'
  if (platform === 'youtube' || platform === 'YouTube')
    return 'youtube'
  return platform
}

function getPlatformLabel(platform) {
  if (platform === 'bilibili')
    return 'B站'
  if (platform === 'xhs')
    return '小红书'
  if (platform === 'douyin')
    return '抖音'
  if (platform === 'kwai')
    return '快手'
  if (platform === 'facebook')
    return 'Facebook'
  if (platform === 'instagram')
    return 'Instagram'
  if (platform === 'linkedin')
    return 'LinkedIn'
  if (platform === 'pinterest')
    return 'Pinterest'
  if (platform === 'threads')
    return 'Threads'
  if (platform === 'tiktok')
    return 'TikTok'
  if (platform === 'twitter')
    return 'Twitter / X'
  if (platform === 'wxGzh')
    return '微信公众号'
  if (platform === 'wxSph')
    return '视频号'
  if (platform === 'youtube')
    return 'YouTube'
  return platform || '平台'
}

async function getAllGrantedPermissions() {
  const permissions = await chrome.permissions.getAll()
  return {
    origins: permissions.origins || [],
    permissions: permissions.permissions || [],
  }
}

async function checkPermission() {
  const granted = await chrome.permissions.contains({
    permissions: REQUIRED_PERMISSIONS,
  })
  const permissions = await getAllGrantedPermissions()
  return {
    granted,
    permissions: permissions.permissions,
    origins: permissions.origins,
  }
}

async function getCookiesForPlatform(platform) {
  const urls = platformCookieUrls[platform] || []
  const cookieMap = new Map()

  for (const url of urls) {
    const cookies = await chrome.cookies.getAll({ url })
    for (const cookie of cookies) {
      cookieMap.set(`${cookie.domain}:${cookie.path}:${cookie.name}`, cookie)
    }
  }

  return Array.from(cookieMap.values())
}

async function queryPlatformTabs(platform) {
  const matchers = platformTabMatchers[platform] || []
  const tabMap = new Map()

  for (const matcher of matchers) {
    const tabs = await chrome.tabs.query({ url: matcher })
    for (const tab of tabs) {
      if (tab.id)
        tabMap.set(tab.id, tab)
    }
  }

  return Array.from(tabMap.values())
}

function getTargetUrl(platform, params = {}) {
  const keyword = params.keyword?.trim()
  if (params.action === 'discoverByKeyword' && keyword) {
    if (platform === 'bilibili')
      return `https://search.bilibili.com/all?keyword=${encodeURIComponent(keyword)}`

    if (platform === 'xhs')
      return `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}&source=web_search_result_notes`

    if (platform === 'douyin')
      return `https://www.douyin.com/search/${encodeURIComponent(keyword)}?source=normal_search&type=general`

    if (platform === 'kwai')
      return `https://www.kuaishou.com/search/video?searchKey=${encodeURIComponent(keyword)}`

    if (platform === 'facebook')
      return `https://www.facebook.com/search/posts/?q=${encodeURIComponent(keyword)}`

    if (platform === 'instagram')
      return `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(keyword)}`

    if (platform === 'linkedin')
      return `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(keyword)}`

    if (platform === 'pinterest')
      return `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(keyword)}`

    if (platform === 'threads')
      return `https://www.threads.net/search?q=${encodeURIComponent(keyword)}`

    if (platform === 'tiktok')
      return `https://www.tiktok.com/search?q=${encodeURIComponent(keyword)}`

    if (platform === 'twitter')
      return `https://x.com/search?q=${encodeURIComponent(keyword)}&src=typed_query&f=live`

    if (platform === 'wxGzh')
      return `https://weixin.sogou.com/weixin?type=2&query=${encodeURIComponent(keyword)}`

    if (platform === 'wxSph')
      return `https://channels.weixin.qq.com/platform/search?query=${encodeURIComponent(keyword)}`

    if (platform === 'youtube')
      return `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}`
  }

  const workId = params.workId || params.authorUrl
  if (!workId)
    return ''

  if (/^https?:\/\//i.test(workId))
    return workId

  if (platform === 'xhs')
    return `https://www.xiaohongshu.com/explore/${encodeURIComponent(workId)}`

  if (platform === 'douyin')
    return `https://www.douyin.com/video/${encodeURIComponent(workId)}`

  if (platform === 'kwai')
    return `https://www.kuaishou.com/short-video/${encodeURIComponent(workId)}`

  if (platform === 'bilibili')
    return `https://www.bilibili.com/video/${encodeURIComponent(workId)}`

  if (platform === 'youtube')
    return `https://www.youtube.com/watch?v=${encodeURIComponent(workId)}`

  return ''
}

function tabMatchesWork(tab, workId) {
  if (!workId)
    return true
  if (!tab?.url)
    return false
  if (/^https?:\/\//i.test(workId))
    return tab.url === workId || tab.url.startsWith(workId)
  return tab.url.includes(workId)
}

function waitForTabComplete(tabId, timeoutMs = 15000) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener)
      resolve()
    }, timeoutMs)

    function listener(updatedTabId, changeInfo) {
      if (updatedTabId !== tabId || changeInfo.status !== 'complete')
        return
      clearTimeout(timeout)
      chrome.tabs.onUpdated.removeListener(listener)
      resolve()
    }

    chrome.tabs.onUpdated.addListener(listener)
  })
}

async function ensurePlatformTab(platform, params = {}) {
  const tabs = await queryPlatformTabs(platform)
  const workUrl = getTargetUrl(platform, params)
  const matchKey = params.workId || params.authorUrl || params.keyword
  const matchingTab = tabs.find(tab => tabMatchesWork(tab, matchKey))
  const tab = matchingTab || tabs.find(item => item.active) || tabs[0]

  if (tab?.id) {
    if (workUrl && !tabMatchesWork(tab, matchKey)) {
      await chrome.tabs.update(tab.id, { active: true, url: workUrl })
      await waitForTabComplete(tab.id)
    }
    return tab
  }

  if (!workUrl)
    return null

  const created = await chrome.tabs.create({ active: true, url: workUrl })
  if (created?.id)
    await waitForTabComplete(created.id)
  return created
}

async function readPlatformPageState(tabId, platform) {
  try {
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId },
      func: (targetPlatform) => {
        const text = document.body?.innerText || ''
        const title = document.title || ''
        const cookie = document.cookie || ''
        const nicknameCandidates = [
          '[class*="user"] [class*="name"]',
          '[class*="nickname"]',
          '[class*="avatar"] + *',
          'a[href*="/user/profile"]',
        ]

        let nickname = ''
        for (const selector of nicknameCandidates) {
          const element = document.querySelector(selector)
          const value = element?.textContent?.trim()
          if (value && value.length <= 40) {
            nickname = value
            break
          }
        }

        return {
          cookieNames: cookie.split(';').map(item => item.split('=')[0]?.trim()).filter(Boolean),
          href: location.href,
          isLoginWall: targetPlatform === 'xhs'
            ? /登录后查看搜索结果|手机号登录|获取验证码|扫码登录|登录后查看更多/.test(text)
            : /登录后查看|扫码登录|手机号登录|获取验证码|立即登录/.test(text),
          isLikelyLoggedIn: targetPlatform === 'xhs'
            ? /创作中心|发布笔记|消息|我|creator/i.test(text + title) && !/登录后查看搜索结果|手机号登录|获取验证码|扫码登录|登录后查看更多/.test(text)
            : targetPlatform === 'kwai'
              ? /创作者服务平台|创作者中心|消息|关注|推荐|我的|作品管理/i.test(text + title)
              : /创作者服务中心|消息|关注|推荐|我的/i.test(text + title),
          nickname,
          title,
        }
      },
      args: [platform],
    })
    return injection?.result || null
  }
  catch (error) {
    return {
      error: error?.message || '无法读取平台页面状态',
    }
  }
}

function pickCookie(cookies, names) {
  return cookies.find(cookie => names.includes(cookie.name))
}

const loginCookieConfig = {
  bilibili: {
    label: 'B站',
    sessionCookies: ['SESSDATA', 'bili_jct', 'DedeUserID'],
    uidCookies: ['DedeUserID'],
  },
  douyin: {
    label: '抖音',
    sessionCookies: ['sessionid', 'sessionid_ss', 'sid_tt', 'passport_csrf_token'],
    uidCookies: ['uid_tt', 'uid_tt_ss', 'passport_auth_status'],
  },
  facebook: {
    label: 'Facebook',
    sessionCookies: ['c_user', 'xs', 'fr'],
    uidCookies: ['c_user'],
  },
  instagram: {
    label: 'Instagram',
    sessionCookies: ['sessionid', 'ds_user_id', 'csrftoken'],
    uidCookies: ['ds_user_id'],
  },
  kwai: {
    label: '快手',
    sessionCookies: ['kuaishou.server.web_st', 'kuaishou.server.web_ph', 'did', 'userId'],
    uidCookies: ['userId', 'did'],
  },
  linkedin: {
    label: 'LinkedIn',
    sessionCookies: ['li_at', 'JSESSIONID', 'bcookie'],
    uidCookies: ['bcookie'],
  },
  pinterest: {
    label: 'Pinterest',
    sessionCookies: ['_pinterest_sess', 'csrftoken'],
    uidCookies: ['_auth'],
  },
  threads: {
    label: 'Threads',
    sessionCookies: ['sessionid', 'ds_user_id', 'csrftoken'],
    uidCookies: ['ds_user_id'],
  },
  tiktok: {
    label: 'TikTok',
    sessionCookies: ['sessionid', 'sessionid_ss', 'sid_tt', 'passport_csrf_token'],
    uidCookies: ['uid_tt', 'uid_tt_ss', 'passport_auth_status'],
  },
  twitter: {
    label: 'Twitter / X',
    sessionCookies: ['auth_token', 'ct0', 'twid'],
    uidCookies: ['twid'],
  },
  wxGzh: {
    label: '微信公众号',
    sessionCookies: ['slave_user', 'slave_sid', 'bizuin'],
    uidCookies: ['bizuin', 'slave_user'],
  },
  wxSph: {
    label: '视频号',
    sessionCookies: ['sessionid', 'wxuin', 'token'],
    uidCookies: ['wxuin'],
  },
  xhs: {
    label: '小红书',
    sessionCookies: [
      'web_session',
      'access-token-creator.xiaohongshu.com',
      'customer-sso-sid',
      'galaxy_creator_session_id',
    ],
    uidCookies: [
      'x-user-id-creator.xiaohongshu.com',
      'x-user-id-pro.xiaohongshu.com',
      'x-user-id-ad-market.xiaohongshu.com',
      'webId',
    ],
  },
  youtube: {
    label: 'YouTube',
    sessionCookies: ['LOGIN_INFO', 'SID', 'HSID', 'SSID', 'SAPISID'],
    uidCookies: ['VISITOR_INFO1_LIVE'],
  },
}

async function login(platformInput) {
  const platform = normalizePlatform(platformInput)
  const loginConfig = loginCookieConfig[platform]
  if (!loginConfig) {
    return {
      success: false,
      error: `暂不支持平台：${platformInput}`,
      code: 'UNSUPPORTED_PLATFORM',
    }
  }

  const cookies = await getCookiesForPlatform(platform)
  const tabs = await queryPlatformTabs(platform)
  const activeTab = tabs.find(tab => tab.active) || tabs[0]
  const pageState = activeTab?.id ? await readPlatformPageState(activeTab.id, platform) : null
  const session = pickCookie(cookies, loginConfig.sessionCookies)
  const userId = pickCookie(cookies, loginConfig.uidCookies)

  if (platform === 'xhs') {
    if (pageState?.isLoginWall || (!session && !pageState?.isLikelyLoggedIn)) {
      return {
        success: false,
        error: pageState?.isLoginWall
          ? '小红书搜索页要求登录，请先在打开的小红书页面完成登录'
          : '未检测到小红书登录态，请先登录小红书主页和创作者中心',
        code: 'XHS_NOT_LOGGED_IN',
        data: { tabs: tabs.map(tab => tab.url), cookieNames: cookies.map(cookie => cookie.name) },
      }
    }

    return {
      success: true,
      data: {
        account: pageState?.nickname || '小红书账号',
        cookieReady: Boolean(session),
        creatorReady: cookies.some(cookie => cookie.name.includes('creator')),
        nickname: pageState?.nickname || '小红书账号',
        platform: 'xhs',
        uid: userId?.value || session?.value?.slice(0, 16) || 'xhs-current-user',
      },
    }
  }

  if (pageState?.isLoginWall || (!session && !pageState?.isLikelyLoggedIn)) {
    return {
      success: false,
      error: pageState?.isLoginWall
        ? `${loginConfig.label}页面要求登录，请先在打开的${loginConfig.label}页面完成登录`
        : `未检测到${loginConfig.label}登录态，请先登录${loginConfig.label}页面`,
      code: `${platform.toUpperCase()}_NOT_LOGGED_IN`,
      data: { tabs: tabs.map(tab => tab.url), cookieNames: cookies.map(cookie => cookie.name) },
    }
  }

  return {
    success: true,
    data: {
      account: pageState?.nickname || `${loginConfig.label}账号`,
      cookieReady: Boolean(session),
      nickname: pageState?.nickname || `${loginConfig.label}账号`,
      platform,
      uid: userId?.value || session?.value?.slice(0, 16) || `${platform}-current-user`,
    },
  }
}

function buildPlatformUrl(platform, path) {
  if (/^https?:\/\//i.test(path))
    return path

  const origin = PLATFORM_ORIGINS[platform]
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`
}

async function platformRequest(platform, params = {}) {
  const normalizedPlatform = normalizePlatform(platform)
  const url = buildPlatformUrl(normalizedPlatform, params.path)
  const method = params.method || 'POST'
  const headers = {
    Accept: 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    ...params.headers,
  }

  const init = {
    credentials: 'include',
    headers,
    method,
  }

  if (params.data !== undefined && method !== 'GET') {
    init.body = JSON.stringify(params.data)
  }

  try {
    const response = await fetch(url, init)
    const contentType = response.headers.get('content-type') || ''
    const data = contentType.includes('application/json')
      ? await response.json()
      : await response.text()

    const shouldFallback = normalizedPlatform === 'xhs'
      && (params.path || '').includes('/comment/')
      && data
      && typeof data === 'object'
      && data.success === false

    if (response.ok && !shouldFallback) {
      return {
        data,
        status: response.status,
        success: true,
      }
    }

    const fallback = await fallbackPlatformRequest(normalizedPlatform, params, data)
    if (fallback)
      return fallback

    return {
      data,
      error: typeof data === 'string' ? data : data?.msg || data?.message,
      status: response.status,
      success: false,
    }
  }
  catch (error) {
    const fallback = await fallbackPlatformRequest(normalizedPlatform, params, error)
    if (fallback)
      return fallback

    return {
      error: error?.message || '平台请求失败',
      status: 0,
      success: false,
    }
  }
}

function toXhsCommentResponse(comments) {
  return {
    code: 0,
    data: {
      comments: comments.map((comment, index) => ({
        content: comment.content,
        create_time: comment.createTime || Date.now(),
        id: comment.id || `dom-comment-${index}`,
        ip_location: comment.ipLocation || '',
        like_count: String(comment.likeCount || 0),
        liked: false,
        show_tags: [],
        sub_comment_count: '0',
        sub_comment_cursor: '',
        sub_comment_has_more: false,
        sub_comments: [],
        user_info: {
          image: comment.user?.avatar || '',
          nickname: comment.user?.nickname || `客户${index + 1}`,
          user_id: comment.user?.id || `dom-user-${index}`,
          xsec_token: comment.user?.xsecToken || '',
        },
      })),
      cursor: '',
      has_more: false,
    },
    msg: comments.length > 0 ? '已通过页面执行器抓取评论' : '页面未识别到评论',
    success: comments.length > 0,
  }
}

async function fallbackPlatformRequest(platform, params = {}, originalError) {
  if (platform !== 'xhs')
    return null

  const path = params.path || ''

  if (path.includes('/comment/page')) {
    const requestUrl = buildPlatformUrl(platform, path)
    const noteId = new URL(requestUrl).searchParams.get('note_id')
    const scanResult = await runPlatformInteraction('xhs', {
      action: 'scanComments',
      count: params.count || 30,
      workId: noteId,
    })
    const data = toXhsCommentResponse(scanResult.comments || [])
    return {
      data,
      error: scanResult.success ? undefined : scanResult.error || scanResult.message || originalError?.message,
      status: scanResult.success ? 200 : 502,
      success: scanResult.success,
    }
  }

  if (path.includes('/comment/post')) {
    const commentResult = await runPlatformInteraction('xhs', {
      action: 'comment',
      content: params.data?.content,
      replyToCommentId: params.data?.target_comment_id,
      workId: params.data?.note_id,
    })
    return {
      data: {
        code: commentResult.success ? 0 : -1,
        data: {
          comment: {
            id: commentResult.commentId || `dom-comment-${Date.now()}`,
          },
        },
        msg: commentResult.message || commentResult.error || '页面评论执行完成',
        success: commentResult.success,
      },
      error: commentResult.success ? undefined : commentResult.error || commentResult.message,
      status: commentResult.success ? 200 : 502,
      success: commentResult.success,
    }
  }

  return null
}

async function runPlatformInteraction(platformInput, params = {}) {
  const platform = normalizePlatform(platformInput || params.platform || 'douyin')
  const tab = await ensurePlatformTab(platform, params)

  if (!tab?.id) {
    return {
      success: false,
      error: `未找到已打开的${getPlatformLabel(platform)}页面`,
      code: 'PLATFORM_TAB_NOT_FOUND',
    }
  }

  const response = await sendInteractionToTab(tab.id, params)
  return response || {
    success: false,
    error: '平台执行失败',
  }
}

async function runRemoteAutomation(params = {}) {
  if (!params.url || !/^https?:\/\//i.test(params.url)) {
    return {
      success: false,
      error: '远程页面自动化缺少有效 URL',
      code: 'REMOTE_URL_REQUIRED',
    }
  }

  if (!params.code || typeof params.code !== 'string') {
    return {
      success: false,
      error: '远程页面自动化缺少执行代码',
      code: 'REMOTE_CODE_REQUIRED',
    }
  }

  const timeout = Math.max(5000, Number(params.timeout || 45000))
  const startedAt = Date.now()
  const tab = await chrome.tabs.create({ active: true, url: params.url })
  if (!tab?.id) {
    return {
      success: false,
      error: '无法打开目标页面',
      code: 'REMOTE_TAB_CREATE_FAILED',
    }
  }

  await waitForTabComplete(tab.id, Math.min(timeout, 20000))

  try {
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      func: async (code) => {
        try {
          const runner = new Function(`return (async () => {\n${code}\n})()`)
          return {
            result: await runner(),
            success: true,
          }
        }
        catch (error) {
          return {
            error: error?.message || '页面执行失败',
            success: false,
          }
        }
      },
      args: [params.code],
    })

    const payload = injection?.result
    if (!payload?.success) {
      return {
        success: false,
        error: payload?.error || '页面执行失败',
        executionTime: Date.now() - startedAt,
      }
    }

    return {
      success: payload.result?.success !== false,
      message: payload.result?.message,
      result: payload.result,
      executionTime: Date.now() - startedAt,
    }
  }
  catch (error) {
    return {
      success: false,
      error: error?.message || '远程页面自动化执行失败',
      executionTime: Date.now() - startedAt,
    }
  }
}

async function sendInteractionToTab(tabId, params) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await chrome.tabs.sendMessage(tabId, {
        payload: params,
        source: 'jujing-extension',
        type: 'RUN_PLATFORM_INTERACTION',
      })
    }
    catch (error) {
      if (attempt === 0) {
        await chrome.scripting.executeScript({
          files: ['src/content-platform.js'],
          target: { tabId },
        })
      }
      await new Promise(resolve => setTimeout(resolve, 500))
      if (attempt === 2)
        throw error
    }
  }
  return null
}

async function handleMessage(message) {
  switch (message.action) {
    case RuntimeAction.CHECK_PERMISSION:
      return checkPermission()
    case RuntimeAction.GET_VERSION:
      return { version: EXTENSION_VERSION, name: '巨鲸网络智能获客助手' }
    case RuntimeAction.LOGIN:
      return login(message.payload?.platform)
    case RuntimeAction.XHS_REQUEST:
      return platformRequest('xhs', message.payload)
    case RuntimeAction.DOUYIN_REQUEST:
      return platformRequest('douyin', message.payload)
    case RuntimeAction.DOUYIN_INTERACTION:
      return runPlatformInteraction('douyin', message.payload)
    case RuntimeAction.DOUYIN_DIRECT_MESSAGE:
      return runPlatformInteraction('douyin', { ...message.payload, action: 'directMessage' })
    case RuntimeAction.UNIFIED_INTERACTION:
      return runPlatformInteraction(message.payload?.platform, message.payload)
    case RuntimeAction.REMOTE_AUTOMATION_RUN:
      return runRemoteAutomation(message.payload)
    case RuntimeAction.PUBLISH:
      return {
        success: false,
        error: '巨鲸插件 MVP 暂未接入内容发布；当前只作为客户雷达页面执行器使用，频道账号绑定请走官方授权',
        code: 'PUBLISH_NOT_ENABLED',
      }
    default:
      return {
        success: false,
        error: `未知插件动作：${message.action}`,
        code: 'UNKNOWN_ACTION',
      }
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message)
    .then(sendResponse)
    .catch((error) => {
      sendResponse({
        success: false,
        error: error?.message || '巨鲸插件后台异常',
        code: error?.code,
      })
    })
  return true
})
