import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')

const args = new Set(process.argv.slice(2))
const mode = args.has('--mock-publish')
  ? 'mock-publish'
  : process.env.CUSTOMER_RADAR_MODE || 'readonly'
const baseUrl = process.env.CUSTOMER_RADAR_BASE_URL || 'http://localhost:8080'
const targetUrl = `${baseUrl.replace(/\/$/, '')}/zh-CN/customer-radar`
const screenshotPath = process.env.CUSTOMER_RADAR_SCREENSHOT || resolve(projectRoot, 'test-results/customer-radar-live-check.png')
const requirePlugin = process.env.CUSTOMER_RADAR_REQUIRE_PLUGIN === '1'
const workId = process.env.CUSTOMER_RADAR_XHS_WORK_ID || ''
const extensionPath = process.env.CUSTOMER_RADAR_EXTENSION_PATH
const token = process.env.E2E_AUTH_TOKEN || readDockerToken()

function readDockerToken() {
  try {
    return execFileSync('docker', ['exec', '-w', '/', 'aitoearn-web', 'sh', '-lc', 'cat /data/init/token.txt'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 3000,
    }).trim()
  }
  catch {
    return ''
  }
}

function fail(message, details = {}) {
  console.error(JSON.stringify({ ok: false, error: message, ...details }, null, 2))
  process.exitCode = 1
}

function createMockPluginInit() {
  return (authToken) => {
    if (authToken) {
      localStorage.setItem('User', JSON.stringify({
        state: {
          hasEverLoggedIn: true,
          lang: 'zh-CN',
          token: authToken,
          userInfo: { mail: 'admin@aitoearn.local', name: 'Admin' },
        },
        version: 0,
      }))
    }

    window.AIToEarnPlugin = {
      async checkPermission() {
        return {
          granted: true,
          origins: ['https://*.xiaohongshu.com/*'],
          permissions: ['cookies', 'tabs', 'storage', 'scripting'],
        }
      },
      async login(platform) {
        return {
          nickname: platform === 'xhs' ? '小红书测试账号' : '抖音测试账号',
          platform,
          uid: `${platform}-mock-user`,
        }
      },
      async xhsRequest(params) {
        if (params.path.includes('/comment/page')) {
          return {
            data: {
              comments: [{
                content: '我这家新店小红书一直没人咨询，想知道怎么做同城获客。',
                create_time: Date.now(),
                id: 'mock-comment-1',
                ip_location: '杭州',
                like_count: '8',
                liked: false,
                show_tags: [],
                sub_comment_count: '0',
                sub_comment_cursor: '',
                sub_comment_has_more: false,
                sub_comments: [],
                user_info: {
                  image: '',
                  nickname: '真实评论小林',
                  user_id: 'mock-user-1',
                  xsec_token: '',
                },
              }],
              cursor: '',
              has_more: false,
            },
            msg: 'mock comment list ok',
            success: true,
          }
        }

        if (params.path.includes('/comment/post')) {
          window.__mockPublishedComments = [...(window.__mockPublishedComments || []), params.data]
          return {
            data: { comment: { id: 'mock-published-1' } },
            msg: 'mock published',
            success: true,
          }
        }

        return { data: {}, msg: 'ok', success: true }
      },
      async unifiedInteraction(params) {
        return {
          items: [{
            author: '关键词测试客户',
            authorId: 'mock-keyword-user',
            commentContent: `围绕${params.keyword || '探店'}想找同城客户`,
            sourceTitle: '同城门店获客求助',
            sourceUrl: 'https://www.xiaohongshu.com/explore/mock-note-keyword',
            workId: 'mock-note-keyword',
          }],
          message: 'mock keyword discovery ok',
          success: true,
        }
      },
      async douyinDirectMessage() {
        return { message: 'mock douyin dm ok', success: true }
      },
      async douyinInteraction() {
        return { message: 'mock douyin interaction ok', success: true }
      },
      getVersion() {
        return Promise.resolve({ version: 'mock' })
      },
      publish() {
        return Promise.resolve({ message: 'not used', success: false })
      },
    }
  }
}

async function createContext() {
  const headless = process.env.CUSTOMER_RADAR_HEADED === '1' ? false : !extensionPath
  const viewport = { height: 1200, width: 1440 }

  if (extensionPath) {
    const userDataDir = process.env.CUSTOMER_RADAR_CHROME_PROFILE || resolve(projectRoot, '.playwright/customer-radar-profile')
    const context = await chromium.launchPersistentContext(userDataDir, {
      args: ['--enable-unsafe-extension-debugging'],
      channel: process.env.CUSTOMER_RADAR_BROWSER_CHANNEL || 'chrome',
      headless,
      ignoreDefaultArgs: ['--disable-extensions'],
      viewport,
    })

    const browser = context.browser()
    const session = await browser.newBrowserCDPSession()
    try {
      const result = await session.send('Extensions.loadUnpacked', { path: extensionPath })
      context.__extensionId = result?.id
    }
    catch (error) {
      throw new Error(`failed to load unpacked extension: ${error?.message || error}`)
    }

    return context
  }

  const browser = await chromium.launch({
    channel: process.env.CUSTOMER_RADAR_BROWSER_CHANNEL || 'chrome',
    headless,
  })
  const context = await browser.newContext({ viewport })
  context.__browser = browser
  return context
}

async function closeContext(context) {
  const browser = context.__browser
  await context.close()
  if (browser)
    await browser.close()
}

async function addAuth(context) {
  if (!token)
    return

  await context.addInitScript((authToken) => {
    localStorage.setItem('User', JSON.stringify({
      state: {
        hasEverLoggedIn: true,
        lang: 'zh-CN',
        token: authToken,
        userInfo: { mail: 'admin@aitoearn.local', name: 'Admin' },
      },
      version: 0,
    }))
  }, token)
}

async function clickFirstEnabled(locator) {
  const count = await locator.count()
  for (let index = 0; index < count; index += 1) {
    const item = locator.nth(index)
    if (await item.isEnabled()) {
      await item.click()
      return true
    }
  }
  return false
}

async function run() {
  mkdirSync(dirname(screenshotPath), { recursive: true })

  const context = await createContext()
  if (mode === 'mock-publish')
    await context.addInitScript(createMockPluginInit(), token)
  else
    await addAuth(context)

  const page = await context.newPage()
  const responses = []
  const errors = []
  page.on('pageerror', error => errors.push(error.message || String(error)))
  page.on('response', (response) => {
    const url = response.url()
    if (url.includes('/api/customer-radar'))
      responses.push(`${response.status()} ${url}`)
  })

  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /检测.*执行器/ }).first().click()
    await page.waitForTimeout(800)

    if (mode === 'mock-publish') {
      await page.locator('label').filter({ hasText: '真实平台执行' }).locator('button,[role="checkbox"]').first().click()
      await page.waitForTimeout(1000)
      await page.getByPlaceholder('可直接粘贴笔记链接 / note_id').fill('mock-owned-note')
      await page.getByRole('button', { name: '抓取评论并生成回复' }).first().click()
      await page.waitForTimeout(1500)
      const approvedClick = await clickFirstEnabled(page.getByRole('button', { exact: true, name: '批准' }))
      await page.waitForTimeout(700)
      const publishedClick = await clickFirstEnabled(page.getByRole('button', { exact: true, name: '发布回复' }))
      await page.waitForTimeout(1000)
      const mockPublishedCount = await page.evaluate(() => window.__mockPublishedComments?.length || 0)
      const body = await page.locator('body').innerText()
      await page.screenshot({ fullPage: true, path: screenshotPath })

      if (!approvedClick || !publishedClick || mockPublishedCount < 1) {
        fail('mock publish flow did not complete', {
          approvedClick,
          hasPublishedLog: body.includes('平台评论已发布') || body.includes('评论已通过插件执行发布'),
          mockPublishedCount,
          publishedClick,
          screenshotPath,
        })
        return
      }

      console.log(JSON.stringify({
        approvedClick,
        fetchedMockComment: body.includes('真实评论小林') || body.includes('我这家新店小红书一直没人咨询'),
        hasPublishedLog: body.includes('平台评论已发布') || body.includes('评论已通过插件执行发布'),
        mockPublishedCount,
        mode,
        ok: true,
        publishedClick,
        responses,
        screenshotPath,
        url: page.url(),
      }, null, 2))
      return
    }

    if (workId) {
      await page.getByPlaceholder('可直接粘贴笔记链接 / note_id').fill(workId)
      await page.getByRole('button', { name: '抓取评论并生成回复' }).first().click()
      await page.waitForTimeout(2500)
    }

    const pageState = await page.evaluate(() => ({
      extensionBridgeReady: document.documentElement.dataset.jujingExtensionBridge === 'ready',
      hasPluginApi: typeof window.AIToEarnPlugin !== 'undefined',
      pluginApiReady: document.documentElement.dataset.jujingPluginApi === 'ready',
    }))
    const body = await page.locator('body').innerText()
    await page.screenshot({ fullPage: true, path: screenshotPath })

    if (requirePlugin && !pageState.hasPluginApi) {
      fail('plugin is required but was not detected', { mode, pageState, screenshotPath, url: page.url() })
      return
    }

    if (workId && body.includes('小红书评论抓取失败')) {
      fail('readonly xhs comment scan failed', { mode, pageState, screenshotPath, url: page.url() })
      return
    }

    console.log(JSON.stringify({
      mode,
      ok: true,
      pageState,
      readonlyScanAttempted: Boolean(workId),
      responses,
      screenshotPath,
      url: page.url(),
    }, null, 2))
  }
  finally {
    await closeContext(context)
  }
}

run().catch((error) => {
  fail(error?.message || 'customer radar live check failed')
})
