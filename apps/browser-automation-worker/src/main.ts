#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { MultiloginClient } from '@yikart/multilogin'
import { Command } from 'commander'
import { chromium } from 'playwright'
import { BrowserTaskConfig, Cookie } from './interfaces'

const program = new Command()

program
  .name('browser-automation-worker')
  .description('Browser automation worker for executing tasks via Multilogin and Playwright')
  .version('1.0.0')
  .requiredOption('-c, --config <path>', 'Path to the task configuration file')
  .parse()

const options = program.opts() as { config: string }

async function main() {
  console.log('🚀 Starting browser automation worker...')

  const configPath = options.config
  console.log(`📄 Reading configuration from: ${configPath}`)

  const configContent = readFileSync(configPath, 'utf-8')
  const config: BrowserTaskConfig = JSON.parse(configContent)

  if (!config.multilogin) {
    throw new Error('Invalid configuration: missing multilogin section')
  }

  if (!config.multilogin.token && (!config.multilogin.email || !config.multilogin.password)) {
    throw new Error('Invalid configuration: missing multilogin credentials (either token or email/password required)')
  }

  if (!config.folderId || !config.profileId) {
    throw new Error('Invalid configuration: missing folderId or profileId')
  }

  if (!config.windows || config.windows.length === 0) {
    throw new Error('Invalid configuration: missing windows configuration')
  }

  console.log(`🪟 Will open ${config.windows.length} browser window(s)`)

  console.log(`🔐 Connecting to Multilogin with ${config.multilogin.token ? 'token' : `email: ${config.multilogin.email}`}`)

  const multiloginClient = new MultiloginClient({
    email: config.multilogin.email,
    password: config.multilogin.password,
    token: config.multilogin.token,
  })

  console.log(`🌐 Starting browser profile: ${config.profileId}`)
  const profileData = await multiloginClient.startBrowserProfile(config.folderId, config.profileId, {
    automation_type: 'playwright',
    headless_mode: false,
  })

  if (!profileData || !profileData.data || !profileData.data.port) {
    throw new Error('Failed to start browser profile or get port')
  }

  const browserPort = profileData.data.port
  console.log(`🔗 Browser profile started on port: ${browserPort}`)

  const browserURL = `http://127.0.0.1:${browserPort}`
  console.log(`🔌 Connecting to browser at: ${browserURL}`)
  const browser = await chromium.connectOverCDP(browserURL, { timeout: 10000 })
  const context = browser.contexts()[0]

  // 获取现有页面
  let pages = context.pages()

  // 如果没有足够的页面，创建新页面
  while (pages.length < config.windows.length) {
    await context.newPage()
    pages = context.pages()
  }

  console.log(`🪟 Found ${pages.length} existing pages, processing ${config.windows.length} windows...`)

  // 同步处理所有窗口
  await Promise.all(config.windows.map(async (windowConfig, i) => {
    const page = pages[i]
    console.log(`\n🪟 Processing Window ${i + 1}...`)

    console.log(`📍 Navigating to: ${windowConfig.url}`)
    await page.goto(windowConfig.url)

    // 设置cookies
    if (windowConfig.cookies && windowConfig.cookies.length > 0) {
      console.log(`🍪 Setting ${windowConfig.cookies.length} cookies for Window ${i + 1}`)

      await context.addCookies(windowConfig.cookies.map((cookie: Cookie) => ({
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain || new URL(windowConfig.url).hostname,
        path: cookie.path || '/',
        expires: cookie.expires,
        httpOnly: cookie.httpOnly || false,
        secure: cookie.secure || false,
        sameSite: cookie.sameSite || 'Lax',
      })))

      console.log(`✅ Cookies set successfully for Window ${i + 1}`)
    }

    // 设置localStorage
    if (windowConfig.localStorage && windowConfig.localStorage.length > 0) {
      console.log(`💾 Setting ${windowConfig.localStorage.length} items in localStorage for Window ${i + 1}`)

      for (const item of windowConfig.localStorage) {
        await page.evaluate((item) => {
          localStorage.setItem(item.name, item.value)
        }, item)
      }

      console.log(`✅ localStorage data set successfully for Window ${i + 1}`)
    }
    await page.reload()

    console.log(`✅ Window ${i + 1} setup completed`)
  }))

  console.log(`\n🎉 All ${config.windows.length} window(s) have been processed!`)
  console.log('💡 Browser windows will remain open for manual interaction.')
}

main().catch((error) => {
  console.error('❌ Error occurred:', (error as Error).message)
  console.error((error as Error).stack)
  process.exit(1)
})
