/**
 * ConfigField - 配置字段递归表单控件
 * 将配置对象转换成可编辑表单，避免直接暴露 JSON。
 */
'use client'

import type { ConfigFieldProps, ConfigPath } from '../../types'
import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NumberInput } from '@/components/ui/number-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/utils/className'
import { createEmptyValue, formatConfigKey, isRecord, joinPath } from '../../utils/configPath'

const selectOptions: Record<string, string[]> = {
  environment: ['development', 'production'],
}

function getLastStringSegment(path: ConfigPath, fallback: string) {
  const segment = [...path].reverse().find(item => typeof item === 'string')
  return typeof segment === 'string' ? segment : fallback
}

function translateWithFallback(t: (key: string) => string, key: string, fallback: string) {
  const translated = t(key)
  return translated === key ? fallback : translated
}

function getFieldLabel(t: (key: string) => string, path: ConfigPath, fieldKey: string) {
  const key = getLastStringSegment(path, fieldKey)
  return translateWithFallback(t, `fields.${key}`, formatConfigKey(key))
}

function getFieldDescription(t: (key: string) => string, path: ConfigPath) {
  const pathKey = path.filter(item => typeof item === 'string').join('.')
  if (!pathKey)
    return ''
  return translateWithFallback(t, `fieldDescriptions.${pathKey}`, '')
}

function shouldUseTextarea(value: string) {
  return value.includes('\n') || value.length > 96
}

function PrimitiveField({ path, fieldKey, value, disabled, onValueChange }: ConfigFieldProps) {
  const { t } = useTransClient('configManager')
  const label = getFieldLabel(t, path, fieldKey)
  const description = getFieldDescription(t, path)
  const pathKey = joinPath(path)
  const lastKey = getLastStringSegment(path, fieldKey)
  const options = selectOptions[lastKey]

  const inputId = `config-field-${pathKey.replace(/[^\w-]/g, '-')}`

  return (
    <div className="grid gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-muted/40 focus-within:bg-muted/40 sm:grid-cols-[minmax(150px,210px)_1fr] sm:items-start">
      <div className="min-w-0 space-y-1">
        <Label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </Label>
        <div className="break-all text-xs text-muted-foreground">{pathKey}</div>
        {description && <p className="text-xs leading-5 text-muted-foreground">{description}</p>}
      </div>

      {typeof value === 'boolean' && (
        <div className="flex min-h-9 items-center justify-between gap-3 rounded-md border border-input bg-background px-3 py-2 shadow-sm">
          <span className="text-sm text-muted-foreground">
            {value ? t('common.enabled') : t('common.disabled')}
          </span>
          <Switch
            id={inputId}
            checked={value}
            disabled={disabled}
            onCheckedChange={checked => onValueChange(path, checked)}
          />
        </div>
      )}

      {typeof value === 'number' && (
        <NumberInput
          id={inputId}
          value={value}
          disabled={disabled}
          onValueChange={nextValue => onValueChange(path, nextValue ?? 0)}
        />
      )}

      {typeof value === 'string' && options && (
        <Select value={value} disabled={disabled} onValueChange={nextValue => onValueChange(path, nextValue)}>
          <SelectTrigger id={inputId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {typeof value === 'string' && !options && shouldUseTextarea(value) && (
        <Textarea
          id={inputId}
          value={value}
          disabled={disabled}
          rows={4}
          onChange={event => onValueChange(path, event.target.value)}
        />
      )}

      {typeof value === 'string' && !options && !shouldUseTextarea(value) && (
        <Input
          id={inputId}
          value={value}
          disabled={disabled}
          onChange={event => onValueChange(path, event.target.value)}
        />
      )}

      {(value == null) && (
        <Input
          id={inputId}
          value=""
          disabled={disabled}
          placeholder={t('common.emptyValue')}
          onChange={event => onValueChange(path, event.target.value)}
        />
      )}
    </div>
  )
}

function ArrayField({ path, fieldKey, value, disabled, depth = 0, onValueChange }: ConfigFieldProps & { value: unknown[] }) {
  const { t } = useTransClient('configManager')
  const label = getFieldLabel(t, path, fieldKey)
  const pathKey = joinPath(path)
  const sampleValue = value[0] ?? ''
  const canRemove = value.length > 0

  return (
    <Collapsible defaultOpen={depth < 2} className="rounded-lg border border-border/80 bg-background">
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left hover:bg-muted/50">
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground">{label}</div>
          <div className="break-all text-xs text-muted-foreground">{pathKey}</div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{t('common.itemCount', { count: value.length })}</span>
          <ChevronDown className="h-4 w-4" />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 border-t border-border/70 p-2">
        {value.length === 0 && (
          <div className="rounded-lg border border-dashed border-border bg-background px-3 py-4 text-center text-sm text-muted-foreground">
            {t('common.emptyArray')}
          </div>
        )}
        {value.map((item, index) => (
          <div key={`${pathKey}-${index}`} className="rounded-lg border border-border/70 bg-muted/20 p-2">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-xs font-medium text-muted-foreground">
                {t('common.arrayItem', { index: index + 1 })}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || !canRemove}
                className="h-7 px-2 text-muted-foreground hover:text-destructive"
                onClick={() => onValueChange(path, value.filter((_, itemIndex) => itemIndex !== index))}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t('actions.remove')}
              </Button>
            </div>
            <ConfigField
              path={[...path, index]}
              fieldKey={`${fieldKey}.${index}`}
              value={item}
              disabled={disabled}
              depth={depth + 1}
              onValueChange={onValueChange}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="w-full"
          onClick={() => onValueChange(path, [...value, createEmptyValue(sampleValue)])}
        >
          <Plus className="h-4 w-4" />
          {t('actions.addItem')}
        </Button>
      </CollapsibleContent>
    </Collapsible>
  )
}

function ObjectField({ path, fieldKey, value, disabled, depth = 0, onValueChange }: ConfigFieldProps & { value: Record<string, unknown> }) {
  const { t } = useTransClient('configManager')
  const label = getFieldLabel(t, path, fieldKey)
  const entries = useMemo(() => Object.entries(value), [value])
  const pathKey = joinPath(path)

  return (
    <Collapsible defaultOpen={depth < 2} className={cn('rounded-lg border border-border/80', depth === 0 ? 'bg-background' : 'bg-muted/20')}>
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left hover:bg-muted/50">
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground">{label}</div>
          <div className="break-all text-xs text-muted-foreground">{pathKey}</div>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 border-t border-border/70 p-2">
        {entries.length === 0 && (
          <div className="rounded-lg border border-dashed border-border bg-background px-3 py-4 text-center text-sm text-muted-foreground">
            {t('common.emptyObject')}
          </div>
        )}
        {entries.map(([key, itemValue]) => (
          <ConfigField
            key={`${pathKey}.${key}`}
            path={[...path, key]}
            fieldKey={key}
            value={itemValue}
            disabled={disabled}
            depth={depth + 1}
            onValueChange={onValueChange}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

export function ConfigField(props: ConfigFieldProps) {
  const { value } = props

  if (Array.isArray(value))
    return <ArrayField {...props} value={value} />

  if (isRecord(value))
    return <ObjectField {...props} value={value} />

  return <PrimitiveField {...props} />
}
