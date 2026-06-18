/**
 * ConfigManagerDialog - 全局配置管理弹框
 * 将后端配置对象转换为可编辑表单，并支持保存后重启与健康检查。
 */
'use client'

import type { ConfigEditorStatus, ConfigPath, ConfigValue } from './types'
import { AlertCircle, Braces, CheckCircle2, FileSliders, Loader2, RefreshCw, RotateCcw, Save, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  checkConfigEditorServiceHealthApi,
  getConfigEditorConfigApi,
  restartConfigEditorServiceApi,
  saveConfigEditorConfigApi,
  validateConfigEditorConfigApi,
} from '@/api/config-editor/config-editor.api'
import { useTransClient } from '@/app/i18n/client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/utils/ui/toast'
import { ConfigFormPanel } from './components/ConfigFormPanel'
import { ConfigSectionNav } from './components/ConfigSectionNav'
import { useConfigSectionSpy } from './hooks/useConfigSectionSpy'
import { setValueAtPath, stableStringify } from './utils/configPath'
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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function getResponseMessage(response: { message?: string } | null | undefined) {
  return response?.message?.trim() || ''
}

function formatJsonConfig(config: Record<string, unknown>) {
  return JSON.stringify(config, null, 2)
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
  const [editMode, setEditMode] = useState<ConfigEditMode>('visual')
  const [jsonText, setJsonText] = useState('')
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const dirty = useMemo(() => {
    if (!config || !originalConfig)
      return false
    if (editMode === 'json')
      return jsonText.trim() !== formatJsonConfig(originalConfig)
    return stableStringify(config) !== stableStringify(originalConfig)
  }, [config, editMode, jsonText, originalConfig])

  const sections = useMemo(() => config ? buildConfigSections(config, t) : [], [config, t])
  const { activeSectionId, scrollToSection } = useConfigSectionSpy(scrollContainerRef, sections)
  const disabled = !!loadingAction || serviceStatus === 'restarting'

  const loadConfig = useCallback(async () => {
    setLoadingAction('load')
    setError(null)
    setSuccessMessage('')

    try {
      const response = await getConfigEditorConfigApi(true)
      if (!response || response.code !== 0 || !response.data?.config) {
        throw new Error(getResponseMessage(response) || t('errors.loadFailed'))
      }

      setConfig(response.data.config)
      setOriginalConfig(response.data.config)
      setJsonText(formatJsonConfig(response.data.config))
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
  }, [t])

  useEffect(() => {
    if (!open)
      return
    loadConfig()
  }, [open, loadConfig])

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

  const handleEditModeChange = useCallback((value: string) => {
    if (value !== 'visual' && value !== 'json')
      return

    if (value === 'visual' && editMode === 'json') {
      const parsedConfig = parseJsonText()
      if (!parsedConfig)
        return
      setConfig(parsedConfig)
      setJsonText(formatJsonConfig(parsedConfig))
    }

    if (value === 'json' && config)
      setJsonText(formatJsonConfig(config))

    setError(null)
    setSuccessMessage('')
    setEditMode(value)
  }, [config, editMode, parseJsonText])

  const getEditableConfig = useCallback(() => {
    if (editMode === 'visual')
      return config

    const parsedConfig = parseJsonText()
    if (parsedConfig)
      setConfig(parsedConfig)
    return parsedConfig
  }, [config, editMode, parseJsonText])

  const validateConfig = useCallback(async (action: LoadingAction = 'validate') => {
    const editableConfig = getEditableConfig()
    if (!editableConfig)
      return false

    setLoadingAction(action)
    setError(null)
    setSuccessMessage('')

    try {
      const response = await validateConfigEditorConfigApi({ config: editableConfig }, true)
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
  }, [getEditableConfig, t])

  const saveConfig = useCallback(async (action: LoadingAction = 'save') => {
    const editableConfig = getEditableConfig()
    if (!editableConfig)
      return false

    setLoadingAction(action)
    setError(null)
    setSuccessMessage('')

    try {
      const valid = await validateConfig(action)
      if (!valid)
        return false

      const response = await saveConfigEditorConfigApi({ config: editableConfig }, true)
      if (!response || response.code !== 0) {
        throw new Error(getResponseMessage(response) || t('errors.saveFailed'))
      }

      setConfig(editableConfig)
      setOriginalConfig(editableConfig)
      setJsonText(formatJsonConfig(editableConfig))
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
  }, [getEditableConfig, t, validateConfig])

  const waitForHealth = useCallback(async () => {
    setServiceStatus('restarting')
    setHealthAttempts(0)

    for (let attempt = 1; attempt <= healthCheckMaxAttempts; attempt += 1) {
      setHealthAttempts(attempt)
      await new Promise(resolve => window.setTimeout(resolve, healthCheckIntervalMs))
      const healthy = await checkConfigEditorServiceHealthApi()
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
  }, [t])

  const restartService = useCallback(async (action: LoadingAction = 'restart') => {
    setLoadingAction(action)
    setError(null)
    setSuccessMessage('')

    try {
      const response = await restartConfigEditorServiceApi(true)
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
  }, [t, waitForHealth])

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
                  <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-2">
                    <Tabs value={editMode} onValueChange={handleEditModeChange}>
                      <TabsList className="h-9">
                        <TabsTrigger value="visual" className="gap-1.5 text-xs">
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                          {t('tabs.visual')}
                        </TabsTrigger>
                        <TabsTrigger value="json" className="gap-1.5 text-xs">
                          <Braces className="h-3.5 w-3.5" />
                          {t('tabs.json')}
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                    {editMode === 'json' && (
                      <span className="text-xs text-muted-foreground">{t('messages.jsonHint')}</span>
                    )}
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
                                    disabled={disabled}
                                    scrollContainerRef={scrollContainerRef}
                                    onValueChange={handleValueChange}
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
                          <Textarea
                            value={jsonText}
                            disabled={disabled || !config}
                            spellCheck={false}
                            className="h-full min-h-[420px] resize-none border-border bg-muted/30 font-mono text-sm leading-6 shadow-none"
                            onChange={(event) => {
                              setJsonText(event.target.value)
                              setError(null)
                              setSuccessMessage('')
                            }}
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
