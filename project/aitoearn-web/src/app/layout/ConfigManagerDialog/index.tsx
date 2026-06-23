/**
 * ConfigManagerDialog - 全局配置管理弹框
 * 将后端配置对象转换为可编辑表单，并支持保存后重启与健康检查。
 */
'use client'

import type { ConfigEditorStatus, ConfigPath, ConfigPathFocusRequest, ConfigValue } from './types'
import { AlertCircle, Bot, Braces, CheckCircle2, FileSliders, Loader2, RefreshCw, RotateCcw, Save, Server, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  checkConfigEditorConfigReadyApi,
  getConfigEditorConfigApi,
  restartConfigEditorServiceApi,
  saveConfigEditorConfigApi,
  validateConfigEditorConfigApi,
} from '@/api/config-editor/config-editor.api'
import { ConfigEditorServiceTarget } from '@/api/config-editor/config-editor.types'
import { useTransClient } from '@/app/i18n/client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/utils/ui/toast'
import { ConfigFormPanel } from './components/ConfigFormPanel'
import { ConfigJsonPanel } from './components/ConfigJsonPanel'
import { ConfigSectionNav } from './components/ConfigSectionNav'
import { useConfigSectionSpy } from './hooks/useConfigSectionSpy'
import { getValueAtPath, isRecord, joinPath, setValueAtPath, stableStringify } from './utils/configPath'
import { buildConfigSections } from './utils/configSections'

export interface ConfigManagerDialogProps {
  open: boolean
  onClose: () => void
}

type LoadingAction = 'load' | 'validate' | 'save' | 'saveRestart' | 'restart'
type ConfigEditMode = 'visual' | 'json'

interface ConfigManagerError {
  title: string
  description?: string
}

const healthCheckIntervalMs = 1600
const healthCheckMaxAttempts = 30
const serverRelayPath: ConfigPath = ['relay']
const aiRelayPath: ConfigPath = ['ai', 'relay']
const serverRelayDefaultConfig: Record<string, unknown> = {
  serverUrl: '',
  apiKey: '',
  callbackUrl: '',
}
const aiRelayDefaultConfig: Record<string, unknown> = {
  url: '',
  apiKey: '',
  timeout: 300000,
}

function isConfigEditorServiceTarget(value: string): value is ConfigEditorServiceTarget {
  return value === ConfigEditorServiceTarget.Server || value === ConfigEditorServiceTarget.Ai
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function getResponseMessage(response: { message?: string } | null | undefined) {
  return response?.message?.trim() || ''
}

function formatJsonConfig(config: Record<string, unknown>) {
  return JSON.stringify(config, null, 2)
}

function getRelayPath(serviceTarget: ConfigEditorServiceTarget): ConfigPath {
  return serviceTarget === ConfigEditorServiceTarget.Ai ? aiRelayPath : serverRelayPath
}

function getRelayDefaultConfig(serviceTarget: ConfigEditorServiceTarget) {
  return serviceTarget === ConfigEditorServiceTarget.Ai
    ? { ...aiRelayDefaultConfig }
    : { ...serverRelayDefaultConfig }
}

function ensureRelayConfig(config: Record<string, unknown>, serviceTarget: ConfigEditorServiceTarget) {
  const relayPath = getRelayPath(serviceTarget)
  if (getValueAtPath(config, relayPath) !== undefined) {
    return { config, insertedRelayPath: null }
  }

  if (serviceTarget === ConfigEditorServiceTarget.Ai) {
    const aiConfig = config.ai
    if (!isRecord(aiConfig)) {
      return { config, insertedRelayPath: null }
    }

    return {
      config: {
        ...config,
        ai: {
          ...aiConfig,
          relay: getRelayDefaultConfig(serviceTarget),
        },
      },
      insertedRelayPath: relayPath,
    }
  }

  return {
    config: {
      ...config,
      relay: getRelayDefaultConfig(serviceTarget),
    },
    insertedRelayPath: relayPath,
  }
}

function removeValueAtPath(source: Record<string, unknown>, path: ConfigPath): Record<string, unknown> {
  const [segment, ...remainingPath] = path
  if (typeof segment !== 'string')
    return source

  const nextSource = { ...source }
  if (remainingPath.length === 0) {
    delete nextSource[segment]
    return nextSource
  }

  const nestedValue = nextSource[segment]
  if (!isRecord(nestedValue))
    return nextSource

  nextSource[segment] = removeValueAtPath(nestedValue, remainingPath)
  return nextSource
}

function stripInsertedRelayPlaceholder(
  config: Record<string, unknown>,
  insertedRelayPath: ConfigPath | null,
  serviceTarget: ConfigEditorServiceTarget,
) {
  if (!insertedRelayPath)
    return config

  const relayValue = getValueAtPath(config, insertedRelayPath)
  if (stableStringify(relayValue) !== stableStringify(getRelayDefaultConfig(serviceTarget)))
    return config

  return removeValueAtPath(config, insertedRelayPath)
}

function StatusBadge({ status }: { status: ConfigEditorStatus }) {
  const { t } = useTransClient('configManager')

  if (status.service === 'restarting') {
    return (
      <Badge variant="outline" className="gap-1 border-warning/30 bg-warning/10 text-warning">
        <Loader2 className="h-3 w-3 animate-spin" />
        {t('status.restarting')}
      </Badge>
    )
  }

  if (status.service === 'failed') {
    return (
      <Badge variant="outline" className="gap-1 border-destructive/30 bg-destructive/10 text-destructive">
        <AlertCircle className="h-3 w-3" />
        {t('status.failed')}
      </Badge>
    )
  }

  if (status.service === 'running') {
    return (
      <Badge variant="outline" className="gap-1 border-success/30 bg-success/10 text-success">
        <CheckCircle2 className="h-3 w-3" />
        {t('status.running')}
      </Badge>
    )
  }

  return <Badge variant="secondary">{t('status.unknown')}</Badge>
}

function LoadingSkeleton() {
  return (
    <div className="flex h-full">
      <div className="hidden w-64 shrink-0 border-r border-border p-3 md:block">
        {Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="mb-2 h-12" />)}
      </div>
      <div className="flex-1 p-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="mb-4 rounded-2xl border border-border p-4">
            <Skeleton className="mb-4 h-5 w-40" />
            <Skeleton className="mb-2 h-10" />
            <Skeleton className="mb-2 h-10" />
            <Skeleton className="h-10" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ConfigManagerDialog({ open, onClose }: ConfigManagerDialogProps) {
  const { t } = useTransClient('configManager')
  const [config, setConfig] = useState<Record<string, unknown> | null>(null)
  const [originalConfig, setOriginalConfig] = useState<Record<string, unknown> | null>(null)
  const [format, setFormat] = useState<ConfigEditorStatus['format']>()
  const [loadingAction, setLoadingAction] = useState<LoadingAction | null>(null)
  const [error, setError] = useState<ConfigManagerError | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [healthAttempts, setHealthAttempts] = useState(0)
  const [serviceStatus, setServiceStatus] = useState<ConfigEditorStatus['service']>('unknown')
  const [serviceTarget, setServiceTarget] = useState(ConfigEditorServiceTarget.Server)
  const [insertedRelayPath, setInsertedRelayPath] = useState<ConfigPath | null>(null)
  const [editMode, setEditMode] = useState<ConfigEditMode>('visual')
  const [jsonText, setJsonText] = useState('')
  const [visualFocusRequest, setVisualFocusRequest] = useState<ConfigPathFocusRequest | null>(null)
  const [jsonFocusRequest, setJsonFocusRequest] = useState<ConfigPathFocusRequest | null>(null)
  const [highlightedVisualPathKey, setHighlightedVisualPathKey] = useState('')
  const [highlightedJsonPathKey, setHighlightedJsonPathKey] = useState('')
  const [jsonScrollTop, setJsonScrollTop] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const visualScrollTopRef = useRef(0)
  const focusRequestIdRef = useRef(0)
  const visualHighlightTimerRef = useRef<number | null>(null)
  const jsonHighlightTimerRef = useRef<number | null>(null)

  const dirty = useMemo(() => {
    if (!config || !originalConfig)
      return false
    if (editMode === 'json')
      return jsonText.trim() !== formatJsonConfig(originalConfig)
    return stableStringify(config) !== stableStringify(originalConfig)
  }, [config, editMode, jsonText, originalConfig])

  const sections = useMemo(
    () => config ? buildConfigSections(config, originalConfig, serviceTarget, t) : [],
    [config, originalConfig, serviceTarget, t],
  )
  const { activeSectionId, scrollToSection } = useConfigSectionSpy(scrollContainerRef, sections)
  const disabled = !!loadingAction || serviceStatus === 'restarting'
  const serverServiceDisabled = disabled || (dirty && serviceTarget !== ConfigEditorServiceTarget.Server)
  const aiServiceDisabled = disabled || (dirty && serviceTarget !== ConfigEditorServiceTarget.Ai)

  const clearVisualHighlightLater = useCallback(() => {
    if (visualHighlightTimerRef.current !== null)
      window.clearTimeout(visualHighlightTimerRef.current)
    visualHighlightTimerRef.current = window.setTimeout(() => setHighlightedVisualPathKey(''), 1800)
  }, [])

  const clearJsonHighlightLater = useCallback(() => {
    if (jsonHighlightTimerRef.current !== null)
      window.clearTimeout(jsonHighlightTimerRef.current)
    jsonHighlightTimerRef.current = window.setTimeout(() => setHighlightedJsonPathKey(''), 1800)
  }, [])

  useEffect(() => {
    return () => {
      if (visualHighlightTimerRef.current !== null)
        window.clearTimeout(visualHighlightTimerRef.current)
      if (jsonHighlightTimerRef.current !== null)
        window.clearTimeout(jsonHighlightTimerRef.current)
    }
  }, [])

  const loadConfig = useCallback(async () => {
    setLoadingAction('load')
    setError(null)
    setSuccessMessage('')

    try {
      const response = await getConfigEditorConfigApi(serviceTarget, true)
      if (!response || response.code !== 0 || !response.data?.config) {
        throw new Error(getResponseMessage(response) || t('errors.loadFailed'))
      }

      const normalizedConfig = ensureRelayConfig(response.data.config, serviceTarget)
      setConfig(normalizedConfig.config)
      setOriginalConfig(normalizedConfig.config)
      setJsonText(formatJsonConfig(normalizedConfig.config))
      setVisualFocusRequest(null)
      setJsonFocusRequest(null)
      setHighlightedVisualPathKey('')
      setHighlightedJsonPathKey('')
      visualScrollTopRef.current = 0
      setJsonScrollTop(0)
      setInsertedRelayPath(normalizedConfig.insertedRelayPath)
      setFormat(response.data.format)
      setServiceStatus('running')
      setHealthAttempts(0)
    }
    catch (loadError) {
      setServiceStatus('failed')
      setError({ title: t('errors.loadFailed'), description: getErrorMessage(loadError) })
    }
    finally {
      setLoadingAction(null)
    }
  }, [serviceTarget, t])

  useEffect(() => {
    if (!open)
      return
    loadConfig()
  }, [open, loadConfig])

  const handleServiceTargetChange = useCallback((value: string) => {
    if (!isConfigEditorServiceTarget(value))
      return

    setServiceTarget(value)
    setLoadingAction('load')
    setConfig(null)
    setOriginalConfig(null)
    setJsonText('')
    setInsertedRelayPath(null)
    setFormat(undefined)
    setHealthAttempts(0)
    setServiceStatus('unknown')
    setEditMode('visual')
    setVisualFocusRequest(null)
    setJsonFocusRequest(null)
    setHighlightedVisualPathKey('')
    setHighlightedJsonPathKey('')
    visualScrollTopRef.current = 0
    setJsonScrollTop(0)
    setError(null)
    setSuccessMessage('')
  }, [])

  const handleValueChange = useCallback((path: ConfigPath, value: ConfigValue) => {
    setConfig((current) => {
      if (!current)
        return current
      const nextConfig = setValueAtPath(current, path, value)
      setJsonText(formatJsonConfig(nextConfig))
      return nextConfig
    })
    setError(null)
    setSuccessMessage('')
  }, [])

  const parseJsonText = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonText) as unknown
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setError({ title: t('errors.jsonInvalid'), description: t('errors.jsonRootObject') })
        return null
      }

      return parsed as Record<string, unknown>
    }
    catch (jsonError) {
      setError({ title: t('errors.jsonInvalid'), description: getErrorMessage(jsonError) })
      return null
    }
  }, [jsonText, t])

  const handleVisualScrollTopChange = useCallback((scrollTop: number) => {
    visualScrollTopRef.current = scrollTop
  }, [])

  const rememberVisualScrollTop = useCallback(() => {
    const currentScrollTop = scrollContainerRef.current?.scrollTop
    if (typeof currentScrollTop === 'number')
      visualScrollTopRef.current = currentScrollTop
  }, [])

  const handleEditModeChange = useCallback((value: string) => {
    if (value !== 'visual' && value !== 'json')
      return

    if (value === 'json' && editMode === 'visual')
      rememberVisualScrollTop()

    if (value === 'visual' && editMode === 'json') {
      const parsedConfig = parseJsonText()
      if (!parsedConfig)
        return
      setConfig(parsedConfig)
      setJsonText(formatJsonConfig(parsedConfig))
    }

    if (value === 'json' && config)
      setJsonText(formatJsonConfig(config))

    setVisualFocusRequest(null)
    setJsonFocusRequest(null)
    setHighlightedVisualPathKey('')
    setHighlightedJsonPathKey('')
    setError(null)
    setSuccessMessage('')
    setEditMode(value)
  }, [config, editMode, parseJsonText, rememberVisualScrollTop])

  const handleNavigateToJson = useCallback((path: ConfigPath) => {
    rememberVisualScrollTop()

    if (config)
      setJsonText(formatJsonConfig(config))

    focusRequestIdRef.current += 1
    setJsonFocusRequest({ id: focusRequestIdRef.current, path: [...path] })
    setHighlightedJsonPathKey(joinPath(path))
    clearJsonHighlightLater()
    setError(null)
    setSuccessMessage('')
    setEditMode('json')
  }, [clearJsonHighlightLater, config, rememberVisualScrollTop])

  const handleNavigateToVisual = useCallback((path: ConfigPath) => {
    const nextConfig = editMode === 'json' ? parseJsonText() : config
    if (!nextConfig)
      return

    if (editMode === 'json') {
      setConfig(nextConfig)
      setJsonText(formatJsonConfig(nextConfig))
    }

    focusRequestIdRef.current += 1
    setVisualFocusRequest({ id: focusRequestIdRef.current, path: [...path] })
    setHighlightedVisualPathKey(joinPath(path))
    setJsonFocusRequest(null)
    setHighlightedJsonPathKey('')
    clearVisualHighlightLater()
    setError(null)
    setSuccessMessage('')
    setEditMode('visual')
  }, [clearVisualHighlightLater, config, editMode, parseJsonText])

  const handleJsonTextChange = useCallback((value: string) => {
    setJsonText(value)
    setError(null)
    setSuccessMessage('')
  }, [])

  const handleJsonFocusRequestHandled = useCallback((requestId: number) => {
    setJsonFocusRequest(current => current?.id === requestId ? null : current)
  }, [])

  const handleVisualFocusRequestHandled = useCallback((requestId: number) => {
    setVisualFocusRequest(current => current?.id === requestId ? null : current)
  }, [])

  const getEditableConfig = useCallback(() => {
    if (editMode === 'visual')
      return config

    const parsedConfig = parseJsonText()
    if (parsedConfig)
      setConfig(parsedConfig)
    return parsedConfig
  }, [config, editMode, parseJsonText])

  const validateConfig = useCallback(async (action: LoadingAction = 'validate', configOverride?: Record<string, unknown>) => {
    const editableConfig = configOverride ?? getEditableConfig()
    if (!editableConfig)
      return false
    const submittableConfig = stripInsertedRelayPlaceholder(editableConfig, insertedRelayPath, serviceTarget)

    setLoadingAction(action)
    setError(null)
    setSuccessMessage('')

    try {
      const response = await validateConfigEditorConfigApi({ config: submittableConfig }, serviceTarget, true)
      if (!response || response.code !== 0) {
        throw new Error(getResponseMessage(response) || t('errors.validateFailed'))
      }
      if (action === 'validate') {
        setSuccessMessage(t('messages.validateSuccess'))
        toast.success(t('messages.validateSuccess'))
      }
      return true
    }
    catch (validateError) {
      setError({ title: t('errors.validateFailed'), description: getErrorMessage(validateError) })
      return false
    }
    finally {
      if (action === 'validate')
        setLoadingAction(null)
    }
  }, [getEditableConfig, insertedRelayPath, serviceTarget, t])

  const saveConfig = useCallback(async (action: LoadingAction = 'save') => {
    const editableConfig = getEditableConfig()
    if (!editableConfig)
      return false
    const submittableConfig = stripInsertedRelayPlaceholder(editableConfig, insertedRelayPath, serviceTarget)

    setLoadingAction(action)
    setError(null)
    setSuccessMessage('')

    try {
      const valid = await validateConfig(action, editableConfig)
      if (!valid)
        return false

      const response = await saveConfigEditorConfigApi({ config: submittableConfig }, serviceTarget, true)
      if (!response || response.code !== 0) {
        throw new Error(getResponseMessage(response) || t('errors.saveFailed'))
      }

      const normalizedConfig = ensureRelayConfig(submittableConfig, serviceTarget)
      setConfig(normalizedConfig.config)
      setOriginalConfig(normalizedConfig.config)
      setJsonText(formatJsonConfig(normalizedConfig.config))
      setInsertedRelayPath(normalizedConfig.insertedRelayPath)
      if (action === 'save') {
        setSuccessMessage(t('messages.saveSuccess'))
        toast.success(t('messages.saveSuccess'))
      }
      return true
    }
    catch (saveError) {
      setError({ title: t('errors.saveFailed'), description: getErrorMessage(saveError) })
      return false
    }
    finally {
      if (action === 'save')
        setLoadingAction(null)
    }
  }, [getEditableConfig, insertedRelayPath, serviceTarget, t, validateConfig])

  const waitForHealth = useCallback(async () => {
    setServiceStatus('restarting')
    setHealthAttempts(0)

    for (let attempt = 1; attempt <= healthCheckMaxAttempts; attempt += 1) {
      setHealthAttempts(attempt)
      await new Promise(resolve => window.setTimeout(resolve, healthCheckIntervalMs))
      const healthy = await checkConfigEditorConfigReadyApi(serviceTarget)
      if (healthy) {
        setServiceStatus('running')
        setSuccessMessage(t('messages.restartSuccess'))
        toast.success(t('messages.restartSuccess'))
        return true
      }
    }

    setServiceStatus('failed')
    setError({ title: t('errors.healthTimeout'), description: t('errors.healthTimeoutDescription') })
    return false
  }, [serviceTarget, t])

  const restartService = useCallback(async (action: LoadingAction = 'restart') => {
    setLoadingAction(action)
    setError(null)
    setSuccessMessage('')

    try {
      const response = await restartConfigEditorServiceApi(serviceTarget, true)
      if (!response || response.code !== 0) {
        throw new Error(getResponseMessage(response) || t('errors.restartFailed'))
      }

      await waitForHealth()
    }
    catch (restartError) {
      setServiceStatus('failed')
      setError({ title: t('errors.restartFailed'), description: getErrorMessage(restartError) })
    }
    finally {
      setLoadingAction(null)
    }
  }, [serviceTarget, t, waitForHealth])

  const handleSaveAndRestart = useCallback(async () => {
    const saved = await saveConfig('saveRestart')
    if (!saved) {
      setLoadingAction(null)
      return
    }
    await restartService('saveRestart')
  }, [restartService, saveConfig])

  const status: ConfigEditorStatus = {
    service: serviceStatus,
    format,
    dirty,
  }
  const isReloading = loadingAction === 'load'
  const isValidating = loadingAction === 'validate'
  const isSaving = loadingAction === 'save'
  const isRestarting = loadingAction === 'saveRestart' || loadingAction === 'restart'

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent
        className="h-[88vh] max-h-[760px] w-[calc(100vw-24px)] max-w-[1120px] gap-0 overflow-hidden p-0 sm:p-0"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">{t('title')}</DialogTitle>
        <DialogDescription className="sr-only">{t('description')}</DialogDescription>

        <div className="flex h-full min-h-0 flex-col">
          <header className="flex shrink-0 flex-col gap-3 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-cyan/10 text-brand-cyan">
                <FileSliders className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pr-8">
              <StatusBadge status={status} />
              {dirty && <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">{t('status.dirty')}</Badge>}
            </div>
          </header>

          {loadingAction === 'load' && !config
            ? <LoadingSkeleton />
            : (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="flex shrink-0 flex-col gap-2 border-b border-border px-4 py-2 md:flex-row md:items-center md:justify-between">
                    <Tabs value={serviceTarget} onValueChange={handleServiceTargetChange}>
                      <TabsList className="h-9">
                        <TabsTrigger value={ConfigEditorServiceTarget.Server} disabled={serverServiceDisabled} className="gap-1.5 text-xs">
                          <Server className="h-3.5 w-3.5" />
                          {t('services.server')}
                        </TabsTrigger>
                        <TabsTrigger value={ConfigEditorServiceTarget.Ai} disabled={aiServiceDisabled} className="gap-1.5 text-xs">
                          <Bot className="h-3.5 w-3.5" />
                          {t('services.ai')}
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <div className="flex items-center gap-2 self-end md:self-auto">
                      {editMode === 'json' && (
                        <span className="hidden text-xs text-muted-foreground sm:inline">{t('messages.jsonHint')}</span>
                      )}
                      <Tabs value={editMode} onValueChange={handleEditModeChange}>
                        <TabsList className="h-8 rounded-lg border border-border bg-background p-0.5 shadow-sm" aria-label={t('tabs.modeSwitch')}>
                          <TabsTrigger
                            value="visual"
                            className="h-7 w-8 rounded-md px-0 data-[state=active]:bg-muted data-[state=active]:shadow-none"
                            title={t('tabs.visual')}
                            aria-label={t('tabs.visual')}
                          >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            <span className="sr-only">{t('tabs.visual')}</span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="json"
                            className="h-7 w-8 rounded-md px-0 data-[state=active]:bg-muted data-[state=active]:shadow-none"
                            title={t('tabs.json')}
                            aria-label={t('tabs.json')}
                          >
                            <Braces className="h-3.5 w-3.5" />
                            <span className="sr-only">{t('tabs.json')}</span>
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>

                  {editMode === 'visual'
                    ? (
                        <div className="flex min-h-0 flex-1">
                          <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:block">
                            <ConfigSectionNav
                              sections={sections}
                              activeSectionId={activeSectionId}
                              disabled={disabled}
                              onSectionClick={scrollToSection}
                            />
                          </aside>

                          <main className="min-w-0 flex-1">
                            {config
                              ? (
                                  <ConfigFormPanel
                                    sections={sections}
                                    config={config}
                                    originalConfig={originalConfig}
                                    disabled={disabled}
                                    scrollContainerRef={scrollContainerRef}
                                    focusRequest={visualFocusRequest}
                                    highlightedPathKey={highlightedVisualPathKey}
                                    initialScrollTop={visualScrollTopRef.current}
                                    onFocusRequestHandled={handleVisualFocusRequestHandled}
                                    onValueChange={handleValueChange}
                                    onNavigateToJson={handleNavigateToJson}
                                    onScrollTopChange={handleVisualScrollTopChange}
                                    onSectionClick={scrollToSection}
                                  />
                                )
                              : (
                                  <div className="flex h-full items-center justify-center p-6">
                                    <Alert variant="destructive" className="max-w-xl">
                                      <AlertCircle className="h-4 w-4" />
                                      <div>
                                        <AlertTitle>{error?.title ?? t('errors.loadFailed')}</AlertTitle>
                                        {error?.description && <AlertDescription>{error.description}</AlertDescription>}
                                      </div>
                                    </Alert>
                                  </div>
                                )}
                          </main>
                        </div>
                      )
                    : (
                        <div className="min-h-0 flex-1 bg-background p-4">
                          <ConfigJsonPanel
                            jsonText={jsonText}
                            disabled={disabled}
                            hasConfig={!!config}
                            focusRequest={jsonFocusRequest}
                            highlightedPathKey={highlightedJsonPathKey}
                            initialScrollTop={jsonScrollTop}
                            onFocusRequestHandled={handleJsonFocusRequestHandled}
                            onJsonTextChange={handleJsonTextChange}
                            onScrollTopChange={setJsonScrollTop}
                            onNavigateToVisual={handleNavigateToVisual}
                          />
                        </div>
                      )}
                </div>
              )}

          <footer className="flex shrink-0 flex-col gap-3 border-t border-border bg-background px-5 py-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              {error && config && (
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="line-clamp-2">
                    {error.title}
                    {error.description ? `：${error.description}` : ''}
                  </span>
                </div>
              )}
              {!error && successMessage && (
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{successMessage}</span>
                </div>
              )}
              {!error && !successMessage && serviceStatus === 'restarting' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>{t('messages.healthChecking', { current: healthAttempts, total: healthCheckMaxAttempts })}</span>
                </div>
              )}
              {!error && !successMessage && serviceStatus !== 'restarting' && (
                <div className="text-sm text-muted-foreground">
                  {dirty ? t('messages.dirtyHint') : t('messages.cleanHint')}
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" disabled={disabled} onClick={loadConfig}>
                {isReloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {t('actions.reload')}
              </Button>
              <Button type="button" variant="outline" disabled={disabled || !config} onClick={() => validateConfig()}>
                {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {t('actions.validate')}
              </Button>
              <Button type="button" variant="outline" disabled={disabled || !config || !dirty} onClick={() => saveConfig()}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t('actions.save')}
              </Button>
              <Button type="button" disabled={disabled || !config} onClick={dirty ? handleSaveAndRestart : () => restartService()}>
                {isRestarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                {dirty ? t('actions.saveAndRestart') : t('actions.restart')}
              </Button>
            </div>
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ConfigManagerDialog
