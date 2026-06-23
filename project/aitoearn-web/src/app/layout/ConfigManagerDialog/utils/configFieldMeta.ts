import type { ConfigPath, ConfigValue } from '../types'
import { formatConfigKey, isRecord, stableStringify } from './configPath'

const sensitiveKeyPattern = /apiKey|key|secret|password|token|credential|accessKey/i

export function getLastStringSegment(path: ConfigPath, fallback: string) {
  const segment = [...path].reverse().find(item => typeof item === 'string')
  return typeof segment === 'string' ? segment : fallback
}

export function translateWithFallback(t: (key: string) => string, key: string, fallback: string) {
  const translated = t(key)
  return translated === key ? fallback : translated
}

export function getConfigFieldLabel(t: (key: string) => string, path: ConfigPath, fieldKey: string) {
  const key = getLastStringSegment(path, fieldKey)
  return translateWithFallback(t, `fields.${key}`, formatConfigKey(key))
}

export function isSensitiveConfigPath(path: ConfigPath) {
  return path.some(segment => typeof segment === 'string' && sensitiveKeyPattern.test(segment))
}

export function isConfigValueModified(value: ConfigValue, originalValue: ConfigValue) {
  return stableStringify(value) !== stableStringify(originalValue)
}

export function countLeafFields(value: unknown): number {
  if (Array.isArray(value)) {
    if (value.length === 0)
      return 1
    return value.reduce<number>((count, item) => count + countLeafFields(item), 0)
  }

  if (isRecord(value)) {
    const entries = Object.values(value)
    if (entries.length === 0)
      return 1
    return entries.reduce<number>((count, item) => count + countLeafFields(item), 0)
  }

  return 1
}

export function countModifiedLeafFields(value: unknown, originalValue: unknown): number {
  if (value === undefined && originalValue !== undefined)
    return countLeafFields(originalValue)

  if (Array.isArray(value)) {
    if (!Array.isArray(originalValue))
      return countLeafFields(value)
    if (value.length === 0)
      return isConfigValueModified(value, originalValue) ? 1 : 0

    const maxLength = Math.max(value.length, originalValue.length)
    let count = 0
    for (let index = 0; index < maxLength; index += 1)
      count += countModifiedLeafFields(value[index], originalValue[index])
    return count
  }

  if (isRecord(value)) {
    if (!isRecord(originalValue))
      return countLeafFields(value)

    const keys = new Set([...Object.keys(value), ...Object.keys(originalValue)])
    if (keys.size === 0)
      return isConfigValueModified(value, originalValue) ? 1 : 0

    let count = 0
    keys.forEach((key) => {
      count += countModifiedLeafFields(value[key], originalValue[key])
    })
    return count
  }

  return isConfigValueModified(value, originalValue) ? 1 : 0
}
