import type { Metadata } from 'next'
import { getHreflang, languages } from '@/lib/i18n/languageConfig'

export async function getPageTitle(name: string, lng: string) {
  return `${name} —— AiToEarn`
}

/**
 * 生成页面 Metadata（符合 SEO 最佳实践）
 * @param props - 基础 Metadata 配置
 * @param lng - 当前语言
 * @param path - 页面路径（不含语言前缀），如 '/accounts'
 */
export async function getMetadata(props: Metadata, lng: string, path?: string): Promise<Metadata> {
  path = path || '/'

  const baseUrl = process.env.NEXT_PUBLIC_HOST_URL || 'https://aitoearn.ai'

  const title = await getPageTitle(typeof props.title === 'string' ? props.title : '', lng)

  const description = typeof props.description === 'string' ? props.description : ''

  // 生成所有语言的 alternate links（用于 hreflang）
  const languageAlternates = languages.reduce(
    (acc, lang) => {
      // 使用 x-default 作为默认语言的 hreflang
      const hreflang = lang === 'en' ? 'x-default' : getHreflang(lang)
      acc[hreflang] = `${baseUrl}/${lang}${path}`
      return acc
    },
    {} as Record<string, string>,
  )

  // 默认的 OG 图片
  const defaultOgImage = `${baseUrl}/og-image.png`

  return {
    ...props,
    title,
    description,
    keywords: props.keywords,
    referrer: 'no-referrer',
    // Canonical URL 和 alternate links
    alternates: {
      canonical: `${baseUrl}/${lng}${path}`,
      languages: languageAlternates,
      ...props.alternates,
    },
    // OpenGraph 元数据（社交媒体分享）
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${lng}${path}`,
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
    // Twitter Card 元数据
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [defaultOgImage],
      ...props.twitter,
    },
    // 搜索引擎爬虫指令
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

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
