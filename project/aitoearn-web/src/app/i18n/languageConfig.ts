/**
 * 语言配置中心
 * 统一管理项目中所有语言相关配置
 *
 * 添加新语言时，只需在此文件的 LANGUAGE_METADATA 中添加配置即可
 */

import { HREFLANG_MAP } from './hreflangMap.cjs'

// 语言元数据类型
export interface LanguageMetadata {
  code: string // 语言代码，如 'en', 'zh-CN'
  label: string // 显示名称，如 'English', '简体中文'
  dayjsLocale: string // dayjs/FullCalendar locale，如 'en-gb', 'zh-cn'
  hreflang: string // SEO hreflang，如 'en', 'zh'
  dateLocale: string // toLocaleDateString locale，如 'en-US', 'zh-CN'
}

// 语言元数据配置（单一数据源）
export const LANGUAGE_METADATA: Record<string, LanguageMetadata> = {
  'en': {
    code: 'en',
    label: 'English',
    dayjsLocale: 'en-gb',
    hreflang: HREFLANG_MAP.en,
    dateLocale: 'en-US',
  },
  'zh-CN': {
    code: 'zh-CN',
    label: '简体中文',
    dayjsLocale: 'zh-cn',
    hreflang: HREFLANG_MAP['zh-CN'],
    dateLocale: 'zh-CN',
  },
  'ja': {
    code: 'ja',
    label: '日本語',
    dayjsLocale: 'ja',
    hreflang: HREFLANG_MAP.ja || 'ja',
    dateLocale: 'ja-JP',
  },
  'de': {
    code: 'de',
    label: 'Deutsch',
    dayjsLocale: 'de',
    hreflang: HREFLANG_MAP.de || 'de',
    dateLocale: 'de-DE',
  },
  'fr': {
    code: 'fr',
    label: 'Français',
    dayjsLocale: 'fr',
    hreflang: HREFLANG_MAP.fr || 'fr',
    dateLocale: 'fr-FR',
  },
  'ko': {
    code: 'ko',
    label: '한국어',
    dayjsLocale: 'ko',
    hreflang: HREFLANG_MAP.ko || 'ko',
    dateLocale: 'ko-KR',
  },
}

// 从 LANGUAGE_METADATA 派生的配置
export const fallbackLng = 'en'
export const languages = Object.keys(LANGUAGE_METADATA)

/**
 * 获取语言元数据
 */
export function getLanguageMetadata(lng: string): LanguageMetadata {
  return LANGUAGE_METADATA[lng] || LANGUAGE_METADATA[fallbackLng]
}

/**
 * 获取 dayjs/FullCalendar 使用的 locale
 */
export function getDayjsLocale(lng: string): string {
  return getLanguageMetadata(lng).dayjsLocale
}

/**
 * 获取 toLocaleDateString 使用的 locale
 */
export function getDateLocale(lng: string): string {
  return getLanguageMetadata(lng).dateLocale
}

/**
 * 获取 SEO hreflang 属性值
 */
export function getHreflang(lng: string): string {
  return getLanguageMetadata(lng).hreflang
}

/**
 * 获取所有语言选项（用于语言切换下拉框）
 */
export function getAllLanguageOptions() {
  return languages.map(lng => ({
    value: lng,
    label: getLanguageMetadata(lng).label,
  }))
}

/**
 * 判断是否为支持的语言
 */
export function isSupportedLanguage(lng: string): boolean {
  return languages.includes(lng)
}

/**
 * 判断是否为中文语言
 */
export function isChineseLanguage(lng: string): boolean {
  return lng === 'zh-CN' || lng.startsWith('zh')
}
