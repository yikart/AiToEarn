/**
 * StructuredData - 结构化数据组件
 *
 * 为页面添加 JSON-LD 结构化数据，帮助搜索引擎更好地理解内容
 * 支持：Organization、WebSite、WebPage、BreadcrumbList、Product、FAQPage
 */

import Script from 'next/script'

// 组织信息（用于首页和全局）
export interface OrganizationSchema {
  name: string
  url: string
  logo: string
  description?: string
  sameAs?: string[] // 社交媒体链接
  contactPoint?: {
    contactType: string
    email?: string
    url?: string
  }
}

// 网站信息
export interface WebSiteSchema {
  name: string
  url: string
  description?: string
  potentialAction?: {
    '@type': string
    'target': string
    'query-input': string
  }
}

// 网页信息
export interface WebPageSchema {
  name: string
  description: string
  url: string
}

// 面包屑导航
export interface BreadcrumbItem {
  name: string
  url: string
}

// 产品信息（用于定价页）
export interface ProductSchema {
  name: string
  description: string
  offers: {
    price: string
    priceCurrency: string
    priceValidUntil?: string
    availability?: string
  }
}

// FAQ 项目
export interface FAQItem {
  question: string
  answer: string
}

interface StructuredDataProps {
  organization?: OrganizationSchema
  website?: WebSiteSchema
  webpage?: WebPageSchema
  breadcrumbs?: BreadcrumbItem[]
  products?: ProductSchema[]
  faqs?: FAQItem[]
}

export function StructuredData({
  organization,
  website,
  webpage,
  breadcrumbs,
  products,
  faqs,
}: StructuredDataProps) {
  const schemas = []

  // Organization Schema
  if (organization) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': organization.name,
      'url': organization.url,
      'logo': organization.logo,
      'description': organization.description,
      'sameAs': organization.sameAs,
      'contactPoint': organization.contactPoint
        ? {
            '@type': 'ContactPoint',
            'contactType': organization.contactPoint.contactType,
            'email': organization.contactPoint.email,
            'url': organization.contactPoint.url,
          }
        : undefined,
    })
  }

  // WebSite Schema
  if (website) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': website.name,
      'url': website.url,
      'description': website.description,
      'potentialAction': website.potentialAction,
    })
  }

  // WebPage Schema
  if (webpage) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': webpage.name,
      'description': webpage.description,
      'url': webpage.url,
    })
  }

  // BreadcrumbList Schema
  if (breadcrumbs && breadcrumbs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': breadcrumbs.map((item, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': item.name,
        'item': item.url,
      })),
    })
  }

  // Product Schema (for pricing page)
  if (products && products.length > 0) {
    products.forEach((product) => {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': product.name,
        'description': product.description,
        'offers': {
          '@type': 'Offer',
          'price': product.offers.price,
          'priceCurrency': product.offers.priceCurrency,
          'priceValidUntil': product.offers.priceValidUntil,
          'availability': product.offers.availability || 'https://schema.org/InStock',
        },
      })
    })
  }

  // FAQPage Schema
  if (faqs && faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': faqs.map(faq => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.answer,
        },
      })),
    })
  }

  return (
    <>
      {schemas.map((schema, index) => (
        <Script
          key={index}
          id={`structured-data-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}
