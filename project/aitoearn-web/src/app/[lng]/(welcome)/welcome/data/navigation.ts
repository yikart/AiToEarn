/**
 * navigation.ts - 导航栏数据
 * Welcome 页面的 Navigation 使用
 */

export interface NavItem {
  type: 'link'
  labelKey: string // i18n key
  href: string
  external?: boolean
}

export const navigation: NavItem[] = [
  { type: 'link', labelKey: 'pricing', href: '/pricing' },
  { type: 'link', labelKey: 'docs', href: 'https://docs.aitoearn.ai/', external: true },
  { type: 'link', labelKey: 'brandPromotion', href: '/brand-promotion' },
  { type: 'link', labelKey: 'aiSocial', href: '/ai-social' },
]
