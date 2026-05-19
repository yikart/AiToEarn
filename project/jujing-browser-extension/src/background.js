import { PLATFORM_ORIGINS, REQUIRED_PERMISSIONS, RuntimeAction } from './shared.js'

const EXTENSION_VERSION = '0.1.0'

const platformCookieUrls = {
  douyin: ['https://www.douyin.com', 'https://creator.douyin.com'],
  xhs: ['https://www.xiaohongshu.com', 'https://creator.xiaohongshu.com', 'https://edith.xiaohongshu.com'],
}

const platformTabMatchers = {
  douyin: ['*://*.douyin.com/*', '*://creator.douyin.com/*'],
  xhs: ['*://*.xiaohongshu.com/*'],
}

function normalizePlatform(platform) {
  if (platform === 'xhs' || platform === 'Xhs')
    return 'xhs'
  if (platform === 'douyin' || platform === 'Douyin')
    return 'douyin'
  return platform
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
    if (platform === 'xhs')
      return `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}&source=web_search_result_notes`

    if (platform === 'douyin')
      return `https://www.douyin.com/search/${encodeURIComponent(keyword)}?source=normal_search&type=general`
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
            : /登录后查看|扫码登录|手机号登录|获取验证码/.test(text),
          isLikelyLoggedIn: targetPlatform === 'xhs'
            ? /创作中心|发布笔记|消息|我|creator/i.test(text + title) && !/登录后查看搜索结果|手机号登录|获取验证码|扫码登录|登录后查看更多/.test(text)
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

async function login(platformInput) {
  const platform = normalizePlatform(platformInput)
  if (!['xhs', 'douyin'].includes(platform)) {
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

  if (platform === 'xhs') {
    const session = pickCookie(cookies, [
      'web_session',
      'access-token-creator.xiaohongshu.com',
      'customer-sso-sid',
      'galaxy_creator_session_id',
    ])
    const userId = pickCookie(cookies, [
      'x-user-id-creator.xiaohongshu.com',
      'x-user-id-pro.xiaohongshu.com',
      'x-user-id-ad-market.xiaohongshu.com',
      'webId',
    ])

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

  const session = pickCookie(cookies, ['sessionid', 'sessionid_ss', 'sid_tt', 'passport_csrf_token'])
  const uid = pickCookie(cookies, ['uid_tt', 'uid_tt_ss', 'passport_auth_status'])

  if (!session && !pageState?.isLikelyLoggedIn) {
    return {
      success: false,
      error: '未检测到抖音登录态，请先登录抖音或创作者中心',
      code: 'DOUYIN_NOT_LOGGED_IN',
      data: { tabs: tabs.map(tab => tab.url), cookieNames: cookies.map(cookie => cookie.name) },
    }
  }

  return {
    success: true,
    data: {
      account: pageState?.nickname || '抖音账号',
      cookieReady: Boolean(session),
      nickname: pageState?.nickname || '抖音账号',
      platform: 'douyin',
      uid: uid?.value || session?.value?.slice(0, 16) || 'douyin-current-user',
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
      error: `未找到已打开的${platform === 'xhs' ? '小红书' : '抖音'}页面`,
      code: 'PLATFORM_TAB_NOT_FOUND',
    }
  }

  const response = await sendInteractionToTab(tab.id, params)
  return response || {
    success: false,
    error: '平台执行失败',
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
    case RuntimeAction.PUBLISH:
      return {
        success: false,
        error: '巨鲸插件 MVP 暂未接入内容发布；当前优先支持客户雷达登录检测和评论链路',
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
