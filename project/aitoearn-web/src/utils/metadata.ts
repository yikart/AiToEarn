import type { Metadata } from 'next'
import { getHreflang, languages } from '@/app/i18n/languageConfig'
import { getPageTitle } from './title'

const BRAND_KEYWORDS = ['AiToEarn', 'aitoearn', 'Ai To Earn', 'ai to earn', 'AITOEARN', 'earn']

/** 确保品牌关键词变体在 keywords 最前面，避免重复 */
function prependBrandKeyword(keywords: Metadata['keywords']): string {
  const raw = Array.isArray(keywords) ? keywords.join(', ') : (keywords || '')
  const brandSet = new Set(BRAND_KEYWORDS.map(keyword => keyword.toLowerCase().replace(/\s+/g, '')))
  const filtered = raw
    .split(',')
    .map(keyword => keyword.trim())
    .filter(keyword => !brandSet.has(keyword.toLowerCase().replace(/\s+/g, '')))

  return [...BRAND_KEYWORDS, ...filtered].join(', ')
}

/**
 * 生成页面 Metadata（符合 SEO 最佳实践）。
 * @param props 基础 Metadata 配置
 * @param lng 当前语言
 * @param path 页面路径（不含语言前缀），如 '/accounts'
 */
export async function getMetadata(props: Metadata, lng: string, path?: string): Promise<Metadata> {
  const pagePath = path || '/'
  const baseUrl = process.env.NEXT_PUBLIC_HOST_URL || 'https://aitoearn.ai'
  const title = await getPageTitle(typeof props.title === 'string' ? props.title : '', lng)
  const description = typeof props.description === 'string' ? props.description : ''
  const languageAlternates = languages.reduce(
    (acc, lang) => {
      const hreflang = lang === 'en' ? 'x-default' : getHreflang(lang)
      acc[hreflang] = `${baseUrl}/${lang}${pagePath}`
      return acc
    },
    {} as Record<string, string>,
  )
  const defaultOgImage = `${baseUrl}/og-image.png`

  return {
    ...props,
    title,
    description,
    keywords: prependBrandKeyword(props.keywords),
    referrer: 'no-referrer',
    alternates: {
      canonical: `${baseUrl}/${lng}${pagePath}`,
      languages: languageAlternates,
      ...props.alternates,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${lng}${pagePath}`,
      siteName: 'AiToEarn',
      locale: lng,
      type: 'website',
      images: [
        {
          url: defaultOgImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...props.openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [defaultOgImage],
      ...props.twitter,
    },
    robots: props.robots || {
      index: true,
      follow: true,
      googleBot: {
        'index': true,
        'follow': true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}
