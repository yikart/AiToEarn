const { statSync } = require('node:fs')
const path = require('node:path')
// next-sitemap.config.js
const glob = require('glob')
const { HREFLANG_MAP, languages } = require('./src/lib/i18n/hreflangMap.cjs')

const BLOCKLIST_REGEX = /material\/album\/\[id\]/
const HAS_DYNAMIC_SEGMENT = /\[[^/]+?\]/
const siteUrl = 'https://aitoearn.ai'

// 生成多语言alternateRefs（每个语言的根 URL）
const alternateRefs = languages.map(lang => ({
  href: `${siteUrl}/${lang}`,
  hreflang: HREFLANG_MAP[lang] || lang,
}))
// 添加 x-default，指向站点根（更通用的默认入口）
alternateRefs.push({
  href: `${siteUrl}/`,
  hreflang: 'x-default',
})

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

  // 添加多语言支持
  alternateRefs,

  additionalPaths: async () => {
    // 扩展 glob，支持 js/ts/jsx/tsx 四类 page 文件
    const allPageFiles = glob.sync('src/app/**/page.{js,ts,jsx,tsx}', {
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

    // 动态任务页面已移除

    return result
  },

  // 关键：把子站 sitemap 挂到索引
  additionalSitemaps: [
    // 'https://blog.aitoearn.ai/sitemap.xml',
    'https://docs.aitoearn.ai/sitemap.xml',
    // 'https://hotinfo.aitoearn.ai/sitemap.xml',
    // 'https://rank.aitoearn.ai/sitemap.xml',
  ],

  // 让 robots.txt 也列出
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/_next/static/',
          '/_next/image/',
          '/cdn-cgi/',
          '/admin/',
        ],
      },
      // 允许访问静态资源
      {
        userAgent: '*',
        allow: [
          '/_next/static/css/',
          '/_next/static/js/',
          '/_next/static/media/',
          '/_next/static/chunks/',
          '/js/',
          '/images/',
        ],
      },
      // 欢迎 AI 爬虫
      {
        userAgent: 'Google-Extended',
        allow: '/',
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
      },
      {
        userAgent: 'CCBot',
        allow: '/',
      },
      {
        userAgent: 'anthropic-ai',
        allow: '/',
      },
      {
        userAgent: 'Claude-Web',
        allow: '/',
      },
      {
        userAgent: 'Bard',
        allow: '/',
      },
      {
        userAgent: 'Bing-AI',
        allow: '/',
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
      },
    ],
    additionalSitemaps: [
      // 'https://blog.aitoearn.ai/sitemap.xml',
      'https://docs.aitoearn.ai/sitemap.xml',
      // 'https://hotinfo.aitoearn.ai/sitemap.xml',
      // 'https://rank.aitoearn.ai/sitemap.xml',
    ],
    // 添加自定义内容到 robots.txt（避免重复追加）
    transformRobotsTxt: async (_, robotsTxt) => {
      const customLines = [
        `${siteUrl}/llms.txt`,
        `${siteUrl}/llms-zh.txt`,
      ]
      // 如果已包含 llms 链接则不重复追加
      const alreadyHasLlms = customLines.some(line => robotsTxt.includes(line))
      if (alreadyHasLlms)
        return robotsTxt

      const customContent = `
# LLMs.txt for AI models
# English version
${siteUrl}/llms.txt
# Chinese version
${siteUrl}/llms-zh.txt

# AI Training Policy - We welcome AI crawlers
# Our content can be used for search indexing and AI training
# This helps increase our visibility and reach

# Note: /cdn-cgi/ is Cloudflare's internal path, not part of our site content
# It's disallowed to prevent crawlers from accessing CDN internals
`
      return robotsTxt + customContent
    },
  },
}
