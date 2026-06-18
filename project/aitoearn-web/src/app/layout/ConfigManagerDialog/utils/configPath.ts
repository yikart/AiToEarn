import type { ConfigPath, ConfigPathSegment, ConfigValue } from '../types'

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function getValueAtPath(source: unknown, path: ConfigPath) {
  return path.reduce<unknown>((current, segment) => {
    if (current == null)
      return undefined

    if (Array.isArray(current) && typeof segment === 'number')
      return current[segment]

    if (isRecord(current) && typeof segment === 'string')
      return current[segment]

    return undefined
  }, source)
}

function cloneContainer(current: unknown, nextSegment: ConfigPathSegment) {
  if (Array.isArray(current))
    return [...current]
  if (isRecord(current))
    return { ...current }
  return typeof nextSegment === 'number' ? [] : {}
}

function setValueRecursive(current: unknown, path: ConfigPath, value: ConfigValue, index: number): ConfigValue {
  const segment = path[index]
  if (segment === undefined)
    return value

  const nextSegment = path[index + 1]
  const container = cloneContainer(current, nextSegment)

  if (Array.isArray(container) && typeof segment === 'number') {
    container[segment] = setValueRecursive(container[segment], path, value, index + 1)
    return container
  }

  if (isRecord(container) && typeof segment === 'string') {
    container[segment] = setValueRecursive(container[segment], path, value, index + 1)
    return container
  }

  return container
}

export function setValueAtPath<T extends Record<string, unknown>>(source: T, path: ConfigPath, value: ConfigValue): T {
  const nextValue = setValueRecursive(source, path, value, 0)
  return isRecord(nextValue) ? nextValue as T : source
}

export function joinPath(path: ConfigPath) {
  return path.join('.')
}

export function formatConfigKey(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

export function createEmptyValue(sample: unknown): ConfigValue {
  if (typeof sample === 'number')
    return 0
  if (typeof sample === 'boolean')
    return false
  if (typeof sample === 'string')
    return ''
  if (Array.isArray(sample))
    return []
  if (isRecord(sample)) {
    return Object.fromEntries(Object.entries(sample).map(([key, value]): [string, ConfigValue] => [key, createEmptyValue(value)]))
  }
  return ''
}

export function stableStringify(value: unknown) {
  return JSON.stringify(value, (_key, nestedValue: unknown) => {
    if (!isRecord(nestedValue))
      return nestedValue

    return Object.keys(nestedValue)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = nestedValue[key]
        return result
      }, {})
  })
}
