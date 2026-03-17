import { createHash } from 'node:crypto'

export interface ParsedUserAgent {
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown'
  os: string
  browser: string
  deviceFingerprint: string
}

const mobileKeywords = [
  'Android',
  'webOS',
  'iPhone',
  'iPod',
  'BlackBerry',
  'IEMobile',
  'Opera Mini',
  'Mobile',
  'mobile',
  'CriOS',
]

const tabletKeywords = ['iPad', 'tablet', 'Tablet', 'Kindle', 'PlayBook']

const osPatterns: Array<{ pattern: RegExp, name: string }> = [
  { pattern: /iPhone|iPad|iPod/i, name: 'iOS' },
  { pattern: /Android/i, name: 'Android' },
  { pattern: /Windows NT 10/i, name: 'Windows 10' },
  { pattern: /Windows NT 6\.3/i, name: 'Windows 8.1' },
  { pattern: /Windows NT 6\.2/i, name: 'Windows 8' },
  { pattern: /Windows NT 6\.1/i, name: 'Windows 7' },
  { pattern: /Windows/i, name: 'Windows' },
  { pattern: /Mac OS X/i, name: 'macOS' },
  { pattern: /Linux/i, name: 'Linux' },
  { pattern: /CrOS/i, name: 'Chrome OS' },
]

const browserPatterns: Array<{ pattern: RegExp, name: string }> = [
  { pattern: /Edg\//i, name: 'Edge' },
  { pattern: /OPR\//i, name: 'Opera' },
  { pattern: /Chrome\//i, name: 'Chrome' },
  { pattern: /Safari\//i, name: 'Safari' },
  { pattern: /Firefox\//i, name: 'Firefox' },
  { pattern: /MSIE|Trident/i, name: 'Internet Explorer' },
]

function detectDeviceType(userAgent: string): 'mobile' | 'desktop' | 'tablet' | 'unknown' {
  if (!userAgent)
    return 'unknown'

  for (const keyword of tabletKeywords) {
    if (userAgent.includes(keyword))
      return 'tablet'
  }

  for (const keyword of mobileKeywords) {
    if (userAgent.includes(keyword))
      return 'mobile'
  }

  if (userAgent.includes('Mozilla') || userAgent.includes('Windows') || userAgent.includes('Macintosh'))
    return 'desktop'

  return 'unknown'
}

function detectOs(userAgent: string): string {
  if (!userAgent)
    return 'Unknown'

  for (const { pattern, name } of osPatterns) {
    if (pattern.test(userAgent))
      return name
  }

  return 'Unknown'
}

function detectBrowser(userAgent: string): string {
  if (!userAgent)
    return 'Unknown'

  for (const { pattern, name } of browserPatterns) {
    if (pattern.test(userAgent))
      return name
  }

  return 'Unknown'
}

function generateDeviceFingerprint(userAgent: string): string {
  if (!userAgent)
    return createHash('md5').update('unknown').digest('hex')

  return createHash('md5').update(userAgent).digest('hex')
}

export function parseUserAgent(userAgent: string): ParsedUserAgent {
  return {
    deviceType: detectDeviceType(userAgent),
    os: detectOs(userAgent),
    browser: detectBrowser(userAgent),
    deviceFingerprint: generateDeviceFingerprint(userAgent),
  }
}
