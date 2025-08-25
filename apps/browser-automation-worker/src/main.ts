#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { MultiloginClient } from '@yikart/multilogin'
import { Command } from 'commander'
import { chromium } from 'playwright'
import { BrowserTaskConfig } from './interfaces'

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

  if (!config.folderId || !config.profileId || !config.url) {
    throw new Error('Invalid configuration: missing folderId, profileId or url')
  }

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
  const page = await context.newPage()

  console.log(`📍 Navigating to: ${config.url}`)
  await page.goto(config.url, { waitUntil: 'networkidle' })

  if (config.cookies && config.cookies.length > 0) {
    console.log(`🍪 Setting ${config.cookies.length} cookies`)

    await context.addCookies(config.cookies.map(cookie => ({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain || new URL(config.url).hostname,
      path: cookie.path || '/',
      expires: cookie.expires,
      httpOnly: cookie.httpOnly || false,
      secure: cookie.secure || false,
      sameSite: cookie.sameSite || 'Lax',
    })))

    console.log('✅ Cookies set successfully')

    console.log('🔄 Reloading page to apply cookies')
    await page.reload({ waitUntil: 'networkidle' })
  }

  if (config.localStorage && config.localStorage.length > 0) {
    console.log(`💾 Setting ${config.localStorage.length} items in localStorage`)

    for (const item of config.localStorage) {
      await page.evaluate((item) => {
        localStorage.setItem(item.name, item.value)
      }, item)
    }

    console.log('✅ localStorage data set successfully')

    console.log('🔄 Reloading page to apply localStorage data')
    await page.reload({ waitUntil: 'networkidle' })
  }

  console.log('✅ Task completed successfully')
}

main().catch((error) => {
  console.error('❌ Error occurred:', (error as Error).message)
  console.error((error as Error).stack)
  process.exit(1)
})
