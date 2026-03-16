/**
 * 语言配置 (CommonJS 格式)
 * 供 next-sitemap.config.js 和 languageConfig.ts 共同使用
 *
 * 添加新语言时，需同时更新此文件和 src/app/i18n/settings.ts
 */

const fallbackLng = 'en'
const languages = [fallbackLng, 'zh-CN', 'ja', 'de', 'fr', 'ko']

const HREFLANG_MAP = {
  'en': 'en',
  'zh-CN': 'zh',
  'ja': 'ja',
  'de': 'de',
  'fr': 'fr',
  'ko': 'ko',
}

module.exports = { HREFLANG_MAP, fallbackLng, languages }
