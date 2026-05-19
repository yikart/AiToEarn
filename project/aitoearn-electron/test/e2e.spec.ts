import path from 'node:path'
import {
  type ElectronApplication,
  type Page,
  type JSHandle,
  _electron as electron,
} from 'playwright'
import type { BrowserWindow } from 'electron'
import {
  beforeAll,
  afterAll,
  describe,
  expect,
  test,
} from 'vitest'

const root = path.join(__dirname, '..')
let electronApp: ElectronApplication
let page: Page

async function waitForMainWindow(app: ElectronApplication) {
  const deadline = Date.now() + 10000

  while (Date.now() < deadline) {
    for (const candidate of app.windows()) {
      const title = await candidate.title().catch(() => '')
      if (title === '哎哟赚AiToEarn')
        return candidate
    }

    await Promise.race([
      app.waitForEvent('window', { timeout: 500 }).catch(() => undefined),
      new Promise(resolve => setTimeout(resolve, 500)),
    ])
  }

  throw new Error('Main application window did not appear')
}

if (process.platform === 'linux') {
  // pass ubuntu
  test(() => expect(true).true)
} else {
  beforeAll(async () => {
    electronApp = await electron.launch({
      args: ['.', '--no-sandbox'],
      cwd: root,
      env: { ...process.env, NODE_ENV: 'development' },
    })
    page = await waitForMainWindow(electronApp)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('#root > *', { timeout: 10000 })

    const mainWin: JSHandle<BrowserWindow> = await electronApp.browserWindow(page)
    await mainWin.evaluate(async (win) => {
      win.webContents.executeJavaScript('console.log("Execute JavaScript with e2e testing.")')
    })
  })

  afterAll(async () => {
    await page.screenshot({ path: 'test/screenshots/e2e.png' })
    await page.close()
    await electronApp.close()
  })

  describe('[AiToEarn Electron] e2e tests', async () => {
    test('startup', async () => {
      const title = await page.title()
      expect(title).eq('哎哟赚AiToEarn')
    })

    test('should render the application shell', async () => {
      const rootContent = await page.locator('#root').textContent()
      expect(rootContent?.trim().length).greaterThan(0)
    })

    test('should render the login route with product copy', async () => {
      await page.evaluate(() => {
        window.location.hash = '#/login'
      })
      await page.getByText('一键分发多个自媒体平台').waitFor({ timeout: 10000 })

      await expect(page.getByText('一键分发多个自媒体平台').isVisible()).resolves.toBe(true)
    })
  })
}
