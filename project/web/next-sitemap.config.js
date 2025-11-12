const { statSync } = require('node:fs')
const path = require('node:path')
// next-sitemap.config.js
const glob = require('glob')

const BLOCKLIST_REGEX = /material\/album\/\[id\]/
const HAS_DYNAMIC_SEGMENT = /\[[^/]+?\]/
const siteUrl = process.env.NEXT_PUBLIC_HOST_URL || 'https://aitoearn.ai'
const languages = ['en', 'zh-CN']

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  sitemapSize: 7000,

  // 主站 URL 生成（保持你现有逻辑，可继续优化）
  transform: async (_, locPath) => {
    if (HAS_DYNAMIC_SEGMENT.test(locPath))
      return null
    if (BLOCKLIST_REGEX.test(locPath))
      return null
    if (locPath.includes('[lng]'))
      return null
    return {
      loc: locPath,
      changefreq: 'monthly',
      priority: 0.7,
      lastmod: new Date().toISOString(),
    }
  },

  additionalPaths: async () => {
    const allPageFiles = glob.sync('src/app/**/page.{js,tsx}', {
      cwd: process.cwd(),
      ignore: ['**/node_modules/**'],
    })

    const pageFiles = allPageFiles
      .filter(f => f.includes('[lng]'))
      .filter((f) => {
        const unix = f.replace(/\\/g, '/')
        if (BLOCKLIST_REGEX.test(unix))
          return false
        const withoutLng = unix.replace('/[lng]', '')
        return !HAS_DYNAMIC_SEGMENT.test(withoutLng)
      })

    const routeEntries = pageFiles.map((file) => {
      let route
        = file
          .replace(/\\/g, '/')
          .replace(/\/page\.(js|tsx)$/, '')
          .replace('src/app/[lng]', '') || '/'
      if (route !== '/')
        route = route.replace(/^\/+/, '/')
      const lastmod = statSync(path.resolve(file)).mtime.toISOString()
      return { route, lastmod }
    })

    const result = []

    for (const lang of languages) {
      for (const { route, lastmod } of routeEntries) {
        const isRoot = route === '/'
        const slug = isRoot ? '' : route.slice(1)
        const normalized = slug

        let changefreq = 'monthly'
        let priority = isRoot ? 0.8 : 0.7
        if (normalized.includes('hotContent')) {
          changefreq = 'daily'
          priority = 0.9
        }
        else if (normalized.includes('aiRank')) {
          changefreq = 'weekly'
          priority = 0.9
        }

        result.push({
          loc: `/${lang}${slug ? `/${slug}` : ''}`,
          changefreq,
          priority,
          lastmod,
        })
      }
    }

    return result
  },

  // 关键：把子站 sitemap 挂到索引
  additionalSitemaps: [
    'https://blog.aitoearn.ai/sitemap.xml',
    'https://docs.aitoearn.ai/sitemap.xml',
    'https://hotinfo.aitoearn.ai/sitemap.xml',
    'https://rank.aitoearn.ai/sitemap.xml',
  ],

  // 让 robots.txt 也列出
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        disallow: [],
      },
    ],
    additionalSitemaps: [
      'https://blog.aitoearn.ai/sitemap.xml',
      'https://docs.aitoearn.ai/sitemap.xml',
      'https://hotinfo.aitoearn.ai/sitemap.xml',
      'https://rank.aitoearn.ai/sitemap.xml',
    ],
  },
}
