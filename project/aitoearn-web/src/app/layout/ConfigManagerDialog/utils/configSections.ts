import type { ConfigPath, ConfigSectionView } from '../types'
import { ConfigEditorServiceTarget } from '@/api/config-editor/config-editor.types'
import { countLeafFields, countModifiedLeafFields } from './configFieldMeta'
import { getValueAtPath, isRecord } from './configPath'

interface SectionDefinition {
  id: string
  paths: ConfigPath[]
}

const serverSectionDefinitions: SectionDefinition[] = [
  { id: 'relay', paths: [['relay'], ['ai', 'relay']] },
  {
    id: 'basic',
    paths: [
      ['environment'],
      ['appDomain'],
      ['globalPrefix'],
      ['port'],
      ['enableConfigLogging'],
      ['enableBadRequestDetails'],
      ['openapi'],
      ['logger'],
    ],
  },
  { id: 'channels', paths: [['channel']] },
  { id: 'database', paths: [['mongodb']] },
  { id: 'redis', paths: [['redis'], ['redlock']] },
  { id: 'auth', paths: [['auth'], ['apiKey']] },
  { id: 'assets', paths: [['assets']] },
  { id: 'ai', paths: [['aiClient'], ['serverClient'], ['ai']] },
  { id: 'agent', paths: [['agent']] },
]

const aiSectionDefinitions: SectionDefinition[] = [
  { id: 'relay', paths: [['relay'], ['ai', 'relay']] },
  { id: 'aiProviders', paths: [['ai', 'openai'], ['ai', 'volcengine'], ['ai', 'grok'], ['ai', 'dashscope'], ['ai', 'gemini'], ['ai', 'anthropic']] },
  {
    id: 'basic',
    paths: [
      ['environment'],
      ['appDomain'],
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
  { id: 'aiModels', paths: [['ai', 'models']] },
  { id: 'aiDraft', paths: [['ai', 'draftGeneration']] },
  { id: 'agent', paths: [['agent']] },
  { id: 'aiClient', paths: [['aiClient'], ['serverClient']] },
]

function getSectionDefinitions(serviceTarget: ConfigEditorServiceTarget) {
  return serviceTarget === ConfigEditorServiceTarget.Ai ? aiSectionDefinitions : serverSectionDefinitions
}

export function getConfigSectionValue(config: Record<string, unknown>, path: ConfigPath) {
  const value = getValueAtPath(config, path)
  if (path.length !== 1 || path[0] !== 'ai' || !isRecord(value))
    return value

  const { relay: _relay, ...aiConfig } = value
  return aiConfig
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

function hasConfiguredRelay(value: unknown): boolean {
  if (typeof value === 'string')
    return value.trim().length > 0

  if (typeof value === 'number' || typeof value === 'boolean')
    return true

  if (Array.isArray(value))
    return value.some(hasConfiguredRelay)

  if (isRecord(value))
    return Object.values(value).some(hasConfiguredRelay)

  return false
}

function getSectionDescription(
  sectionId: string,
  relayConfigured: boolean,
  t: (key: string) => string,
) {
  if (sectionId === 'channels' && relayConfigured) {
    return translateWithFallback(
      t,
      'sections.channels.relayConfiguredDescription',
      'Relay is configured. Editing channel platform settings is usually not recommended.',
    )
  }

  return translateWithFallback(t, sectionDescriptionKey(sectionId), '')
}

export function buildConfigSections(
  config: Record<string, unknown>,
  originalConfig: Record<string, unknown> | null,
  serviceTarget: ConfigEditorServiceTarget,
  t: (key: string) => string,
): ConfigSectionView[] {
  const sectionDefinitions = getSectionDefinitions(serviceTarget)
  const relayConfigured = serviceTarget === ConfigEditorServiceTarget.Server
    && hasConfiguredRelay(getValueAtPath(config, ['relay']))
  const knownTopLevelKeys = new Set(sectionDefinitions.flatMap(section => section.paths.map(path => String(path[0]))))
  const knownAiKeys = new Set(sectionDefinitions.flatMap(section => section.paths
    .filter(path => path[0] === 'ai' && typeof path[1] === 'string')
    .map(path => String(path[1]))))
  const sections = sectionDefinitions
    .map((section) => {
      const paths = section.paths.filter(path => getValueAtPath(config, path) !== undefined)
      const fieldCount = paths.reduce((count, path) => count + countLeafFields(getConfigSectionValue(config, path)), 0)
      const modifiedFieldCount = originalConfig
        ? paths.reduce((count, path) => {
            const value = getConfigSectionValue(config, path)
            const originalValue = getConfigSectionValue(originalConfig, path)
            return count + countModifiedLeafFields(value, originalValue)
          }, 0)
        : 0

      return {
        id: section.id,
        label: translateWithFallback(t, sectionLabelKey(section.id), section.id),
        description: getSectionDescription(section.id, relayConfigured, t),
        paths,
        fieldCount,
        modifiedFieldCount,
        notRecommended: section.id === 'channels' && relayConfigured,
      }
    })
    .filter(section => section.paths.length > 0)

  const advancedPaths = Object.keys(config)
    .filter(key => !knownTopLevelKeys.has(key))
    .map<ConfigPath>(key => [key])

  if (serviceTarget === ConfigEditorServiceTarget.Ai && isRecord(config.ai)) {
    Object.keys(config.ai)
      .filter(key => !knownAiKeys.has(key))
      .forEach(key => advancedPaths.push(['ai', key]))
  }

  if (advancedPaths.length > 0) {
    sections.push({
      id: 'advanced',
      label: translateWithFallback(t, sectionLabelKey('advanced'), 'Advanced'),
      description: translateWithFallback(t, sectionDescriptionKey('advanced'), ''),
      paths: advancedPaths,
      fieldCount: advancedPaths.reduce((count, path) => count + countLeafFields(getValueAtPath(config, path)), 0),
      modifiedFieldCount: originalConfig
        ? advancedPaths.reduce((count, path) => {
            const value = getValueAtPath(config, path)
            const originalValue = getValueAtPath(originalConfig, path)
            return count + countModifiedLeafFields(value, originalValue)
          }, 0)
        : 0,
      notRecommended: false,
    })
  }

  return sections
}
