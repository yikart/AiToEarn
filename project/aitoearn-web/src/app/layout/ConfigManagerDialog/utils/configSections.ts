import type { ConfigPath, ConfigSectionView } from '../types'
import { getValueAtPath, isRecord } from './configPath'

interface SectionDefinition {
  id: string
  paths: ConfigPath[]
}

const sectionDefinitions: SectionDefinition[] = [
  {
    id: 'basic',
    paths: [
      ['environment'],
      ['globalPrefix'],
      ['port'],
      ['enableConfigLogging'],
      ['enableBadRequestDetails'],
      ['openapi'],
      ['logger'],
    ],
  },
  { id: 'database', paths: [['mongodb']] },
  { id: 'redis', paths: [['redis'], ['redlock']] },
  { id: 'auth', paths: [['auth'], ['apiKey']] },
  { id: 'assets', paths: [['assets']] },
  { id: 'ai', paths: [['aiClient'], ['serverClient'], ['ai']] },
  { id: 'agent', paths: [['agent']] },
  { id: 'channels', paths: [['channel'], ['relay']] },
]

const knownTopLevelKeys = new Set(sectionDefinitions.flatMap(section => section.paths.map(path => String(path[0]))))

function countLeafFields(value: unknown): number {
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

function sectionLabelKey(id: string) {
  return `sections.${id}.label`
}

function sectionDescriptionKey(id: string) {
  return `sections.${id}.description`
}

function translateWithFallback(t: (key: string) => string, key: string, fallback: string) {
  const translated = t(key)
  return translated === key ? fallback : translated
}

export function buildConfigSections(config: Record<string, unknown>, t: (key: string) => string): ConfigSectionView[] {
  const sections = sectionDefinitions
    .map((section) => {
      const paths = section.paths.filter(path => getValueAtPath(config, path) !== undefined)
      const fieldCount = paths.reduce((count, path) => count + countLeafFields(getValueAtPath(config, path)), 0)

      return {
        id: section.id,
        label: translateWithFallback(t, sectionLabelKey(section.id), section.id),
        description: translateWithFallback(t, sectionDescriptionKey(section.id), ''),
        paths,
        fieldCount,
      }
    })
    .filter(section => section.paths.length > 0)

  const advancedPaths = Object.keys(config)
    .filter(key => !knownTopLevelKeys.has(key))
    .map<ConfigPath>(key => [key])

  if (advancedPaths.length > 0) {
    sections.push({
      id: 'advanced',
      label: translateWithFallback(t, sectionLabelKey('advanced'), 'Advanced'),
      description: translateWithFallback(t, sectionDescriptionKey('advanced'), ''),
      paths: advancedPaths,
      fieldCount: advancedPaths.reduce((count, path) => count + countLeafFields(getValueAtPath(config, path)), 0),
    })
  }

  return sections
}
