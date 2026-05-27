(() => {
  const markerKey = 'jujingPlatformBridgeReady'
  if (document.documentElement.dataset[markerKey])
    return

  document.documentElement.dataset[markerKey] = 'true'

  function detectPlatform() {
    const host = location.hostname
    if (host.includes('xiaohongshu'))
      return 'xhs'
    if (host.includes('douyin'))
      return 'douyin'
    if (host.includes('kuaishou'))
      return 'kwai'
    if (host.includes('bilibili'))
      return 'bilibili'
    if (host.includes('facebook'))
      return 'facebook'
    if (host.includes('instagram'))
      return 'instagram'
    if (host.includes('linkedin'))
      return 'linkedin'
    if (host.includes('pinterest'))
      return 'pinterest'
    if (host.includes('threads'))
      return 'threads'
    if (host.includes('tiktok'))
      return 'tiktok'
    if (host === 'x.com' || host.includes('twitter'))
      return 'twitter'
    if (host.includes('sogou') || host.includes('mp.weixin.qq.com'))
      return 'wxGzh'
    if (host.includes('channels.weixin.qq.com'))
      return 'wxSph'
    if (host.includes('youtube'))
      return 'youtube'
    return 'unknown'
  }

  const platform = detectPlatform()

  const sleep = ms => new Promise(resolve => window.setTimeout(resolve, ms))

  function normalizeText(text) {
    return String(text || '').replace(/\s+/g, ' ').trim()
  }

  function getAbsoluteUrl(href) {
    if (!href)
      return ''
    try {
      return new URL(href, location.origin).toString()
    }
    catch {
      return ''
    }
  }

  function extractWorkIdFromUrl(url) {
    const value = String(url || '')
    return value.match(/(?:explore|video|item|short-video|photo|search_result|watch|pin|posts|reel|p|status)\/([^/?#]+)/)?.[1]
      || value.match(/[?&]v=([^&#]+)/)?.[1]
      || value.match(/\/@[^/]+\/video\/([^/?#]+)/)?.[1]
      || ''
  }

  function isNoiseText(text) {
    const value = normalizeText(text)
    if (!value)
      return true

    return /^(相关搜索|全部|图文|视频|用户|筛选|综合|发现|直播|发布|通知|登录|创作中心|业务合作|Home|Explore|Search|Notifications|Messages|Log in|Sign in|Subscribe)$/.test(value)
      || /登录后查看搜索结果|手机号登录|获取验证码|扫码登录|用户协议|隐私政策|Log in to|Sign in to|Accept all cookies|Cookie Policy/.test(value)
      || /沪ICP备|营业执照|增值电信业务经营许可证|互联网药品信息服务资格证书/.test(value)
  }

  function visible(element) {
    if (!element)
      return false
    const rect = element.getBoundingClientRect()
    const style = window.getComputedStyle(element)
    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
  }

  function findFirst(selectors, root = document) {
    for (const selector of selectors) {
      const elements = Array.from(root.querySelectorAll(selector))
      const match = elements.find(visible)
      if (match)
        return match
    }
    return null
  }

  function findButtonByText(words) {
    const elements = Array.from(document.querySelectorAll('button, [role="button"], a, div, span'))
    return elements.find((element) => {
      if (!visible(element))
        return false
      const text = normalizeText(element.textContent)
      return text && words.some(word => text === word || text.includes(word))
    })
  }

  function setNativeValue(element, value) {
    if (!element)
      return false

    element.focus()

    if (element.isContentEditable) {
      element.textContent = value
      element.dispatchEvent(new InputEvent('input', { bubbles: true, data: value, inputType: 'insertText' }))
      element.dispatchEvent(new Event('change', { bubbles: true }))
      return true
    }

    const prototype = Object.getPrototypeOf(element)
    const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value')
    if (descriptor?.set)
      descriptor.set.call(element, value)
    else
      element.value = value

    element.dispatchEvent(new InputEvent('input', { bubbles: true, data: value, inputType: 'insertText' }))
    element.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  }

  async function waitForElement(selectors, timeoutMs = 8000) {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      const element = findFirst(selectors)
      if (element)
        return element
      await sleep(250)
    }
    return null
  }

  function extractCommentFromContainer(container, index) {
    const text = normalizeText(container.innerText || container.textContent)
    if (!text || text.length < 2)
      return null

    const lines = text.split(/\n+/).map(normalizeText).filter(Boolean)
    const nicknameElement = findFirst([
      '[class*="name"]',
      '[class*="author"]',
      '[class*="channel"]',
      '[class*="creator"]',
      'a[href*="/user"]',
      'a[href*="/user/profile"]',
      'a[href*="/user/"]',
      'a[href*="/@"]',
      'a[href*="/channel/"]',
      'a[href*="/profile"]',
    ], container)
    const nickname = normalizeText(nicknameElement?.textContent) || lines[0] || `客户${index + 1}`
    const contentElement = findFirst([
      '[class*="content"]',
      '[class*="Content"]',
      '[class*="text"]',
      '[class*="Text"]',
      '[data-e2e*="comment"] span',
      'p',
    ], container)
    let content = normalizeText(contentElement?.textContent)
    if (!content || content === nickname) {
      content = lines
        .filter(line => line !== nickname)
        .filter(line => !/^(回复|点赞|分享|举报|作者|刚刚|\d+|展开|收起)/.test(line))
        .join(' ')
    }

    content = normalizeText(content)
    if (!content || content.length < 2)
      return null

    return {
      content: content.slice(0, 500),
      createTime: Date.now(),
      id: container.getAttribute('data-id') || container.getAttribute('id') || `visible-comment-${Date.now()}-${index}`,
      ipLocation: '',
      likeCount: 0,
      platform,
      user: {
        avatar: container.querySelector('img')?.src || '',
        id: container.querySelector('a[href*="/user"]')?.getAttribute('href') || `visible-user-${index}`,
        nickname: nickname.slice(0, 60),
      },
    }
  }

  function scanVisibleComments(limit = 30) {
    const selectors = [
      '[class*="comment-item"]',
      '[class*="CommentItem"]',
      '[class*="commentItem"]',
      '[data-e2e*="comment"]',
      'li[class*="comment"]',
      'div[class*="comment"]',
    ]
    const candidates = selectors.flatMap(selector => Array.from(document.querySelectorAll(selector)))
    const unique = Array.from(new Set(candidates))
      .filter(visible)
      .filter(element => normalizeText(element.innerText || element.textContent).length >= 4)
      .filter(element => (element.innerText || element.textContent || '').length <= 1200)

    const comments = []
    for (const element of unique) {
      const comment = extractCommentFromContainer(element, comments.length)
      if (!comment)
        continue
      if (comments.some(item => item.content === comment.content && item.user.nickname === comment.user.nickname))
        continue
      comments.push(comment)
      if (comments.length >= limit)
        break
    }

    return comments
  }

  function extractAuthorFromCard(card, index) {
    const authorElement = findFirst([
      '[class*="author"]',
      '[class*="user"]',
      '[class*="name"]',
      '[class*="channel"]',
      '[class*="creator"]',
      'a[href*="/user"]',
      'a[href*="/user/profile"]',
      'a[href*="/@"]',
      'a[href*="/channel/"]',
      'a[href*="/profile"]',
    ], card)
    return normalizeText(authorElement?.textContent) || `潜在客户${index + 1}`
  }

  function extractTitleFromCard(card) {
    const titleElement = findFirst([
      '[class*="title"]',
      '[class*="desc"]',
      '[class*="caption"]',
      '[class*="content"]',
      'a[href*="/explore"]',
      'a[href*="/video"]',
      'a[href*="/short-video"]',
      'a[href*="/photo"]',
      'a[href*="/watch"]',
      'a[href*="/pin/"]',
      'a[href*="/posts/"]',
      'a[href*="/reel/"]',
      'a[href*="/p/"]',
      'a[href*="/status/"]',
      'a[href*="/article/"]',
      'a[href*="/read/"]',
      'h1',
      'h2',
      'p',
    ], card)
    const title = normalizeText(titleElement?.textContent)
    if (title)
      return title.slice(0, 120)

    return normalizeText(card.innerText || card.textContent).slice(0, 120)
  }

  function extractXhsSearchNoteCard(card, index) {
    const hiddenExploreLink = card.querySelector('a[href*="/explore/"]')
    const titleLink = card.querySelector('a.title, [class*="title"]')
    const authorLink = card.querySelector('a.author, a[href*="/user/profile"], [class*="author"]')
    const title = normalizeText(titleLink?.textContent)
    const authorName = normalizeText(card.querySelector('.card-bottom-wrapper .name, a.author .name, div.name')?.textContent)
      || normalizeText(authorLink?.textContent).replace(/\s*(\d{2}-\d{2}|20\d{2}-\d{2}-\d{2})\s*$/, '')
      || `潜在客户${index + 1}`
    const sourceUrl = getAbsoluteUrl(hiddenExploreLink?.getAttribute('href'))
    const workId = extractWorkIdFromUrl(sourceUrl)

    if (!sourceUrl || !workId || !title || isNoiseText(title) || isNoiseText(authorName))
      return null

    const text = normalizeText(card.innerText || card.textContent)
    if (/相关搜索|query-note|rec-query/.test(`${card.className || ''} ${text}`))
      return null

    return {
      author: authorName.slice(0, 60),
      authorId: getAbsoluteUrl(card.querySelector('a[href*="/user/profile"]')?.getAttribute('href')),
      commentContent: `笔记《${title}》来自 ${authorName}，搜索页显示为关键词相关内容。`,
      sourceTitle: title.slice(0, 120),
      sourceUrl,
      workId,
    }
  }

  function extractBilibiliSearchCard(card, index) {
    const link = card.querySelector('a[href*="/video/"], a[href*="/read/"]')
    const sourceUrl = getAbsoluteUrl(link?.getAttribute('href'))
    const title = normalizeText(
      link?.getAttribute('title')
      || link?.textContent
      || card.querySelector('.bili-video-card__info--tit, .title, [class*="title"], h3')?.textContent
    )
    const authorLink = card.querySelector('a[href*="space.bilibili.com"], a[href*="/space/"], [class*="author"], [class*="up"]')
    const author = normalizeText(authorLink?.textContent || card.querySelector('[class*="author"], [class*="up"], [class*="name"]')?.textContent)
      || `B站用户${index + 1}`
    const text = normalizeText(card.innerText || card.textContent)

    if (!sourceUrl || !title || isNoiseText(title) || /综合排序|最多点击|最新发布/.test(text))
      return null

    return {
      author: author.slice(0, 60),
      authorId: getAbsoluteUrl(authorLink?.getAttribute('href')),
      commentContent: text.slice(0, 500) || `B站内容《${title}》来自 ${author}`,
      sourceTitle: title.slice(0, 120),
      sourceUrl,
      workId: extractWorkIdFromUrl(sourceUrl),
    }
  }

  function extractWxGzhSearchCard(card, index) {
    const link = card.querySelector('a[href*="weixin.sogou.com/link"], a[href*="mp.weixin.qq.com/s"], a[href*="/link?url="], a[href]')
    const sourceUrl = getAbsoluteUrl(link?.getAttribute('href'))
    const text = normalizeText(card.innerText || card.textContent)
    const title = normalizeText(link?.textContent || card.querySelector('h3, h4, [class*="title"], .txt-box a')?.textContent)
    const author = normalizeText(card.querySelector('.s-p, .account, [class*="account"], [class*="name"]')?.textContent)
      || `公众号${index + 1}`

    if (!sourceUrl || !title || /相关搜索|搜狗搜索|微信扫一扫|请输入验证码/.test(text))
      return null

    return {
      author: author.slice(0, 60),
      authorId: author,
      commentContent: text.slice(0, 500) || `公众号文章《${title}》来自 ${author}`,
      sourceTitle: title.slice(0, 120),
      sourceUrl,
      workId: sourceUrl,
    }
  }

  function extractWxSphVisibleCard(card, index) {
    const text = normalizeText(card.innerText || card.textContent)
    const link = card.querySelector('a[href]')
    const sourceUrl = getAbsoluteUrl(link?.getAttribute('href')) || location.href
    const title = normalizeText(card.querySelector('[class*="title"], [class*="desc"], [class*="content"], h3, p')?.textContent)
      || text.split(' ').slice(0, 24).join(' ')
    const author = normalizeText(card.querySelector('[class*="author"], [class*="nickname"], [class*="name"]')?.textContent)
      || `视频号用户${index + 1}`

    if (!title || text.length < 8 || /创作者中心|数据概览|发布动态|登录/.test(text))
      return null

    return {
      author: author.slice(0, 60),
      authorId: author,
      commentContent: text.slice(0, 500),
      sourceTitle: title.slice(0, 120),
      sourceUrl,
      workId: sourceUrl,
    }
  }

  function scanVisibleWorks(keyword = '', limit = 10) {
    if (platform === 'xhs') {
      const noteCards = Array.from(document.querySelectorAll('section.note-item'))
        .filter(visible)
        .map((card, index) => extractXhsSearchNoteCard(card, index))
        .filter(Boolean)

      const uniqueNotes = []
      for (const item of noteCards) {
        if (uniqueNotes.some(note => note.workId === item.workId || note.sourceUrl === item.sourceUrl))
          continue
        uniqueNotes.push(item)
        if (uniqueNotes.length >= limit)
          break
      }

      if (uniqueNotes.length)
        return uniqueNotes
    }

    if (platform === 'bilibili') {
      const items = Array.from(document.querySelectorAll('.video-list-item, .bili-video-card, .video-item, .result-item, .article-item, li, article, div'))
        .filter(visible)
        .map((card, index) => extractBilibiliSearchCard(card, index))
        .filter(Boolean)
      const uniqueItems = []
      for (const item of items) {
        if (uniqueItems.some(existing => existing.sourceUrl === item.sourceUrl))
          continue
        uniqueItems.push(item)
        if (uniqueItems.length >= limit)
          break
      }
      if (uniqueItems.length)
        return uniqueItems
    }

    if (platform === 'wxGzh') {
      const items = Array.from(document.querySelectorAll('.news-box li, .txt-box, .news-list li, .results .result, article, li, div'))
        .filter(visible)
        .map((card, index) => extractWxGzhSearchCard(card, index))
        .filter(Boolean)
      const uniqueItems = []
      for (const item of items) {
        if (uniqueItems.some(existing => existing.sourceUrl === item.sourceUrl))
          continue
        uniqueItems.push(item)
        if (uniqueItems.length >= limit)
          break
      }
      if (uniqueItems.length)
        return uniqueItems
    }

    if (platform === 'wxSph') {
      const items = Array.from(document.querySelectorAll('[class*="feed"], [class*="card"], [class*="video"], [class*="result"], article, li, div'))
        .filter(visible)
        .map((card, index) => extractWxSphVisibleCard(card, index))
        .filter(Boolean)
      const uniqueItems = []
      for (const item of items) {
        if (uniqueItems.some(existing => existing.sourceUrl === item.sourceUrl && existing.sourceTitle === item.sourceTitle))
          continue
        uniqueItems.push(item)
        if (uniqueItems.length >= limit)
          break
      }
      if (uniqueItems.length)
        return uniqueItems
    }

    const selectors = [
      'a[href*="/explore/"]',
      'a[href*="/discovery/item/"]',
      'a[href*="/video/"]',
      'a[href*="/short-video/"]',
      'a[href*="/photo/"]',
      'a[href*="/watch"]',
      'a[href*="/pin/"]',
      'a[href*="/posts/"]',
      'a[href*="/reel/"]',
      'a[href*="/p/"]',
      'a[href*="/status/"]',
      'a[href*="/article/"]',
      'a[href*="/read/"]',
      '[class*="note-item"]',
      '[class*="NoteItem"]',
      '[class*="feed"] [class*="item"]',
      '[class*="result"]',
      '[class*="card"]',
      '[data-e2e*="search"]',
    ]
    const candidates = selectors.flatMap(selector => Array.from(document.querySelectorAll(selector)))
    const cards = Array.from(new Set(candidates))
      .map(element => element.closest('section, article, li, div') || element)
      .filter(visible)

    const works = []
    for (const card of cards) {
      const link = card.matches('a')
        ? card
        : card.querySelector('a[href*="/explore/"], a[href*="/video/"], a[href*="/short-video/"], a[href*="/photo/"], a[href*="/discovery/item/"], a[href*="/watch"], a[href*="/pin/"], a[href*="/posts/"], a[href*="/reel/"], a[href*="/p/"], a[href*="/status/"], a[href*="/article/"], a[href*="/read/"]')
      const href = link?.href || location.href
      const title = extractTitleFromCard(card)
      const text = normalizeText(card.innerText || card.textContent)
      if (!title || title.length < 2 || isNoiseText(title) || isNoiseText(text))
        continue
      if (keyword && !text.includes(keyword) && !title.includes(keyword) && works.length > 0)
        continue

      const workId = extractWorkIdFromUrl(href) || `visible-work-${Date.now()}-${works.length}`
      const author = extractAuthorFromCard(card, works.length)
      const comment = extractCommentFromContainer(card, works.length)
      const signalText = comment?.content || text.slice(0, 240) || title
      if (isNoiseText(author) || isNoiseText(signalText))
        continue

      if (works.some(item => item.sourceUrl === href || (item.sourceTitle === title && item.author === author)))
        continue

      works.push({
        author,
        authorId: card.querySelector('a[href*="/user"], a[href*="/profile"], a[href*="/@"], a[href*="/channel/"]')?.getAttribute('href') || '',
        commentContent: signalText,
        sourceTitle: title,
        sourceUrl: href,
        workId,
      })

      if (works.length >= limit)
        break
    }

    if (!works.length) {
      const comments = scanVisibleComments(limit)
      return comments.map((comment, index) => ({
        author: comment.user.nickname,
        authorId: comment.user.id,
        commentContent: comment.content,
        sourceTitle: document.title || `关键词 ${keyword} 的评论信号`,
        sourceUrl: location.href,
        workId: extractWorkIdFromUrl(location.href) || `visible-work-${index}`,
      }))
    }

    return works
  }

  async function discoverByKeyword(payload = {}) {
    const keyword = normalizeText(payload.keyword)
    await sleep(1200)
    const pageText = normalizeText(document.body?.innerText || '')
    if (/登录后查看搜索结果|手机号登录|获取验证码|扫码登录|登录后查看更多|Log in to|Sign in to/.test(pageText)) {
      return {
        items: [],
        keyword,
        message: '平台搜索页要求登录，请先在打开的平台页面完成登录后重试',
        success: false,
      }
    }

    const items = scanVisibleWorks(keyword, payload.count || 10)
    return {
      items,
      keyword,
      message: items.length > 0
        ? `已从当前搜索页识别 ${items.length} 条潜在线索`
        : '当前搜索页没有识别到可用线索，请确认搜索结果已加载',
      success: items.length > 0,
    }
  }

  async function openCommentComposer() {
    const commentButton = findButtonByText(['评论', '写评论', '说点什么', 'Comment', 'Reply', 'Add a comment'])
    if (commentButton)
      commentButton.click()

    return waitForElement([
      'textarea',
      '[contenteditable="true"]',
      '[class*="comment"] input',
      '[class*="comment"] textarea',
      '[placeholder*="评论"]',
      '[placeholder*="说点什么"]',
      '[placeholder*="Comment"]',
      '[aria-label*="Comment"]',
      '[aria-label*="Reply"]',
    ], 6000)
  }

  async function clickReplyToComment(commentId) {
    if (!commentId)
      return true

    const candidates = Array.from(document.querySelectorAll(`[data-id="${CSS.escape(commentId)}"], #${CSS.escape(commentId)}, [id*="${CSS.escape(commentId)}"]`))
    const container = candidates.find(visible)
    if (!container)
      return false

    container.scrollIntoView({ behavior: 'smooth', block: 'center' })
    await sleep(500)
    const replyButton = findFirst(['button', '[role="button"]', 'span', 'div'], container)
      || Array.from(container.querySelectorAll('*')).find(element => normalizeText(element.textContent).includes('回复'))
    replyButton?.click()
    await sleep(500)
    return true
  }

  async function submitComment(content, replyToCommentId) {
    if (!content?.trim()) {
      return {
        code: 'EMPTY_COMMENT',
        error: '评论内容不能为空',
        success: false,
      }
    }

    await clickReplyToComment(replyToCommentId)
    const input = await openCommentComposer()
    if (!input) {
      return {
        code: 'COMMENT_INPUT_NOT_FOUND',
        error: '没有找到评论输入框，请先打开作品详情页并确认评论区可见',
        success: false,
      }
    }

    setNativeValue(input, content.trim())
    await sleep(450)

    const submitButton = findButtonByText(['发送', '发布', '评论', 'Post', 'Reply', 'Comment', 'Send'])
    if (!submitButton) {
      return {
        code: 'COMMENT_SUBMIT_NOT_FOUND',
        error: '已填入评论内容，但没有找到发送按钮',
        success: false,
      }
    }

    submitButton.click()
    await sleep(1200)

    return {
      commentId: `dom-comment-${Date.now()}`,
      message: '已在平台页面执行评论提交动作，请在页面确认是否发布成功',
      success: true,
    }
  }

  async function toggleByText(action, targetState) {
    const wordsByAction = {
      favorite: ['收藏', '已收藏'],
      like: ['点赞', '喜欢', '赞', 'Like'],
    }
    const button = findButtonByText(wordsByAction[action] || [])
    if (!button) {
      return {
        code: 'ACTION_BUTTON_NOT_FOUND',
        error: `没有找到${action === 'like' ? '点赞' : '收藏'}按钮`,
        success: false,
      }
    }

    button.click()
    await sleep(500)
    return {
      message: `已执行${action === 'like' ? '点赞' : '收藏'}动作，目标状态：${targetState ? '开启' : '关闭'}`,
      success: true,
    }
  }

  async function sendDirectMessage(content) {
    if (!content?.trim()) {
      return {
        code: 'EMPTY_MESSAGE',
        error: '私信内容不能为空',
        success: false,
      }
    }

    const messageButton = findButtonByText(['私信', '发消息', '聊天', 'Message', 'Send message'])
    if (messageButton) {
      messageButton.click()
      await sleep(1000)
    }

    const input = await waitForElement([
      'textarea',
      '[contenteditable="true"]',
      '[placeholder*="消息"]',
      '[placeholder*="私信"]',
      '[placeholder*="Message"]',
      '[aria-label*="Message"]',
    ], 6000)

    if (!input) {
      return {
        code: 'DIRECT_MESSAGE_INPUT_NOT_FOUND',
        error: '没有找到私信输入框',
        success: false,
      }
    }

    setNativeValue(input, content.trim())
    await sleep(300)
    const sendButton = findButtonByText(['发送', 'Send'])
    if (!sendButton) {
      return {
        code: 'DIRECT_MESSAGE_SEND_NOT_FOUND',
        error: '已填入私信，但没有找到发送按钮',
        success: false,
      }
    }
    sendButton.click()
    return {
      message: '已执行私信发送动作，请在页面确认是否发送成功',
      success: true,
    }
  }

  async function runInteraction(payload = {}) {
    const action = payload.action || 'scanComments'

    if (action === 'scanComments') {
      const comments = scanVisibleComments(payload.count || 30)
      return {
        comments,
        message: comments.length > 0 ? `已从当前页面识别 ${comments.length} 条评论` : '当前页面未识别到评论，请确认作品详情页评论区已展开',
        success: comments.length > 0,
      }
    }

    if (action === 'discoverByKeyword') {
      return discoverByKeyword(payload)
    }

    if (action === 'comment') {
      return submitComment(payload.content, payload.replyToCommentId)
    }

    if (action === 'like' || action === 'favorite') {
      return toggleByText(action, payload.targetState)
    }

    if (action === 'directMessage') {
      return sendDirectMessage(payload.content)
    }

    return {
      code: 'UNSUPPORTED_ACTION',
      error: `暂不支持平台动作：${action}`,
      success: false,
    }
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || message.source !== 'jujing-extension' || message.type !== 'RUN_PLATFORM_INTERACTION')
      return false

    runInteraction(message.payload)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({
          code: 'CONTENT_SCRIPT_ERROR',
          error: error?.message || '页面执行器异常',
          success: false,
        })
      })
    return true
  })

  window.addEventListener('message', (event) => {
    if (event.source !== window)
      return

    const data = event.data
    if (!data || data.source !== 'jujing-platform-bridge')
      return

    if (data.type === 'JUJING_INTERACTION_REQUEST') {
      void runInteraction(data.payload).then(result => console.info('[巨鲸插件] 平台互动结果', result))
    }
  })
})()
