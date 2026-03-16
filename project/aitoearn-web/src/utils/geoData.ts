/**
 * geoData - 地理数据工具函数
 * 封装 country-state-city 库调用 + 中文国家名映射
 */

import { City, Country, State } from 'country-state-city'
import cnGeoZh from '@/data/cn_geo_zh.json'
import countriesAlpha2 from '@/data/countries_alpha2.json'

export interface CountryOption {
  value: string // ISO alpha-2 code
  label: string // 显示名称（根据语言）
}

export interface StateOption {
  value: string // state code
  label: string // state name
}

export interface CityOption {
  value: string // city name
  label: string // city name
}

// 构建中文名映射 Map（code → zh）
const zhNameMap = new Map(
  countriesAlpha2.map(c => [c.code, c.zh]),
)

/** 判断是否为中文环境 */
function isCnLng(lng: string) {
  return lng === 'zh-CN' || lng === 'zh'
}

/**
 * 获取所有国家列表
 * 中文环境下优先显示中文名，其他语言使用英文名
 */
export function getCountryOptions(lng: string): CountryOption[] {
  return Country.getAllCountries().map(c => ({
    value: c.isoCode,
    label: isCnLng(lng) ? (zhNameMap.get(c.isoCode) || c.name) : c.name,
  }))
}

/**
 * 获取某国家的省/州列表
 * CN + 中文环境下 label 显示中文省名
 * 返回空数组时，UI 应降级为文本输入
 */
export function getStateOptions(countryCode: string, lng?: string): StateOption[] {
  if (!countryCode)
    return []
  const useCnZh = countryCode === 'CN' && lng && isCnLng(lng)
  const statesZh = cnGeoZh.states as Record<string, string>
  return State.getStatesOfCountry(countryCode).map(s => ({
    value: s.isoCode,
    label: useCnZh ? (statesZh[s.isoCode] || s.name) : s.name,
  }))
}

/**
 * 获取某省/州的城市列表
 * CN + 中文环境下 value 和 label 都返回中文（所见即所得，存中文）
 * 返回空数组时，UI 应降级为文本输入
 */
export function getCityOptions(countryCode: string, stateCode: string, lng?: string): CityOption[] {
  if (!countryCode || !stateCode)
    return []
  const useCnZh = countryCode === 'CN' && lng && isCnLng(lng)
  const citiesZh = (cnGeoZh.cities as Record<string, Record<string, string>>)[stateCode]
  return City.getCitiesOfState(countryCode, stateCode).map((c) => {
    // 统一撇号字符：库中用 U+2019（'），JSON key 用 U+0027（'）
    const normalizedName = c.name.replace(/\u2019/g, '\'')
    const zhName = useCnZh && citiesZh ? citiesZh[normalizedName] : undefined
    const displayName = zhName || c.name
    return { value: displayName, label: displayName }
  })
}

/**
 * 通过 ISO code 获取国家显示名
 * 用于位置展示场景
 */
export function getCountryDisplayName(countryCode: string | undefined, lng: string): string {
  if (!countryCode)
    return ''
  if (isCnLng(lng)) {
    const zhName = zhNameMap.get(countryCode)
    if (zhName)
      return zhName
  }
  const country = Country.getCountryByCode(countryCode)
  return country?.name || countryCode
}
