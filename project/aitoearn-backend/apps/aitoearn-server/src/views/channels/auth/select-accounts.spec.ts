import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const ejs = require('ejs') as {
  render: (template: string, data: Record<string, unknown>, options: Record<string, unknown>) => string
}

const templatePath = join(process.cwd(), 'src/views/channels/auth/select-accounts.ejs')
const template = readFileSync(templatePath, 'utf8')

function renderSelectAccounts(data: Record<string, unknown> = {}) {
  return ejs.render(template, {
    locale: 'en-US',
    platformDisplayName: 'Facebook',
    platformLogoUrl: '',
    accounts: [],
    ...data,
  }, { filename: templatePath })
}

describe('channel auth select accounts view', () => {
  it('renders configured empty account hint with an action link', () => {
    const html = renderSelectAccounts({
      emptyAccountHint: {
        title: 'No Facebook Page found',
        description: 'Create a Facebook Page first, then authorize again.',
        action: {
          label: 'Create Facebook Page',
          url: 'https://www.facebook.com/pages/create',
        },
      },
    })

    expect(html).toContain('No Facebook Page found')
    expect(html).toContain('Create a Facebook Page first, then authorize again.')
    expect(html).toContain('href="https://www.facebook.com/pages/create"')
    expect(html).toContain('Create Facebook Page')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('falls back to the default empty account copy without a hint', () => {
    const html = renderSelectAccounts()

    expect(html).toContain('No accounts available')
    expect(html).toContain('This authorization did not return any accounts that can be connected.')
    expect(html).not.toContain('class="empty-action"')
  })

  it('renders selectable account identity as checkbox data attributes', () => {
    const html = renderSelectAccounts({
      accounts: [{
        platformUid: 'google-user-1',
        account: 'channel-1',
        displayName: 'Channel One',
      }],
    })

    expect(html).toContain('name="selectedAccounts"')
    expect(html).toContain('value="google-user-1"')
    expect(html).toContain('data-platform-uid="google-user-1"')
    expect(html).toContain('data-account="channel-1"')
    expect(html).not.toContain('name="accounts"')
    expect(html).not.toContain('{&quot;platformUid&quot;')
  })
})
