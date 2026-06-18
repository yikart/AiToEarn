import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const ejs = require('ejs') as {
  render: (template: string, data: Record<string, unknown>, options: Record<string, unknown>) => string
}

function renderTemplate(name: string, data: Record<string, unknown>) {
  const templatePath = join(process.cwd(), `src/views/channels/auth/${name}.ejs`)
  const template = readFileSync(templatePath, 'utf8')
  return ejs.render(template, {
    locale: 'en-US',
    messages: {
      title: 'Authorization',
      connectedTitle: 'Authorization completed',
      redirectingDescription: 'Redirecting you back now.',
      closeDescription: 'You can close this page now.',
      connectedAccounts: 'Connected accounts',
      accountId: 'Account ID',
      platformUid: 'Platform ID',
      failedTitle: 'Authorization failed',
      failedDescription: 'Please close this page and try authorizing again.',
      errorCode: 'Error code',
    },
    platformDisplayName: 'Facebook',
    platformLogoUrl: '',
    ...data,
  }, { filename: templatePath })
}

describe('channel auth callback views', () => {
  it('serializes callback redirect values for JavaScript without HTML entities', () => {
    const html = renderTemplate('callback', {
      callbackUrl: 'https://app.example.test/callback?a=1&b=2',
      redirectUri: '/workspace?a=1&b=2',
      accounts: [],
    })

    expect(html).toContain('const callbackUrl = "https://app.example.test/callback?a=1\\u0026b=2";')
    expect(html).toContain('const redirectUri = "/workspace?a=1\\u0026b=2";')
    expect(html).not.toContain('const redirectUri = \'/workspace?a=1&amp;b=2\';')
  })

  it('renders callback errors without script redirects or callback forms', () => {
    const html = renderTemplate('error', {
      errorCode: 15039,
      errorMessage: '</script><script>alert(1)</script> & failed',
    })

    expect(html).toContain('Authorization failed')
    expect(html).toContain('&lt;/script&gt;&lt;script&gt;alert(1)&lt;/script&gt; &amp; failed')
    expect(html).toContain('Error code: 15039')
    expect(html).not.toContain('</script><script>alert(1)</script>')
    expect(html).not.toContain('localStorage')
    expect(html).not.toContain('callbackForm')
    expect(html).not.toContain('window.location.replace')
  })
})
