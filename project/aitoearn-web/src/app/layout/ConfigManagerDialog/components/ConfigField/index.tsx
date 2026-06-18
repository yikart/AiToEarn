/**
 * ConfigField - 配置字段递归表单控件
 * 将配置对象转换成设置列表，降低参数区视觉噪音。
 */
'use client'

import type { ConfigFieldProps, ConfigPath, ConfigValue } from '../../types'
import { Braces, ChevronDown, Eye, EyeOff, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NumberInput } from '@/components/ui/number-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/utils/className'
import {
  countLeafFields,
  countModifiedLeafFields,
  getConfigFieldLabel,
  getLastStringSegment,
  isConfigValueModified,
  isSensitiveConfigPath,
} from '../../utils/configFieldMeta'
import { createEmptyValue, isRecord, joinPath } from '../../utils/configPath'

const selectOptions: Record<string, string[]> = {
  environment: ['development', 'production'],
}

const compactControlClassName = 'h-7 min-h-7 w-full rounded-sm border-transparent bg-transparent px-2 py-0 text-sm shadow-none group-hover/config-item:border-input group-hover/config-item:bg-background hover:border-input hover:bg-background focus:border-ring focus:bg-background focus:ring-1 focus:ring-ring focus:ring-offset-0 focus-visible:border-ring focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-ring'
const compactBadgeClassName = 'h-5 shrink-0 whitespace-nowrap px-1.5 py-0 text-[10px] font-normal leading-none'
const nodeTriggerClassName = 'group/config-item flex min-h-8 w-full cursor-pointer items-center justify-between gap-2 py-1 pr-2 text-left outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring'

function shouldUseTextarea(value: string) {
  return value.includes('\n') || value.length > 96
}

function getInputId(pathKey: string) {
  return `config-field-${pathKey.replace(/[^\w-]/g, '-')}`
}

function isPathPrefix(path: ConfigPath, targetPath: ConfigPath | null) {
  if (!targetPath || path.length > targetPath.length)
    return false
  return path.every((segment, index) => segment === targetPath[index])
}

function getPathHighlightClassName(pathKey: string, highlightedPathKey: string) {
  return pathKey === highlightedPathKey && 'animate-pulse bg-primary/10 ring-2 ring-inset ring-primary/45'
}

function ExpandIcon({ open }: { open: boolean }) {
  return (
    <ChevronDown
      className={cn('h-3.5 w-3.5 transition-transform duration-150', !open && '-rotate-90')}
    />
  )
}

function PathJumpButton({ path, onNavigateToJson }: {
  path: ConfigPath
  onNavigateToJson: (path: ConfigPath) => void
}) {
  const { t } = useTransClient('configManager')

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-5 w-5 shrink-0 cursor-pointer text-muted-foreground opacity-0 transition-opacity hover:bg-background/80 hover:text-foreground group-hover/config-item:opacity-100 focus-visible:opacity-100"
      aria-label={t('actions.goToJsonField')}
      onMouseDown={event => event.preventDefault()}
      onClick={(event) => {
        event.stopPropagation()
        onNavigateToJson([...path])
      }}
    >
      <Braces className="h-3.5 w-3.5" />
    </Button>
  )
}

function SettingLabel({
  inputId,
  label,
  modified,
  depth,
  path,
  onNavigateToJson,
}: {
  inputId?: string
  label: string
  modified: boolean
  depth: number
  path: ConfigPath
  onNavigateToJson: (path: ConfigPath) => void
}) {
  const { t } = useTransClient('configManager')
  const labelClassName = cn(
    'block truncate text-foreground',
    depth === 0 && 'text-sm font-semibold tracking-tight',
    depth === 1 && 'text-[13px] font-semibold',
    depth >= 2 && 'text-xs font-medium',
  )
  const markerClassName = cn(
    'shrink-0',
    depth === 0 && 'h-2 w-2 rounded-sm bg-primary',
    depth === 1 && 'h-1.5 w-1.5 rounded-full bg-muted-foreground/70',
    depth >= 2 && 'hidden',
  )

  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-center gap-1.5">
        <span className={markerClassName} aria-hidden />
        {inputId
          ? (
              <Label htmlFor={inputId} className={labelClassName}>
                {label}
              </Label>
            )
          : <div className={labelClassName}>{label}</div>}
        {modified && (
          <Badge variant="outline" className={cn(compactBadgeClassName, 'border-warning/30 bg-warning/10 text-warning')}>
            {t('status.modified')}
          </Badge>
        )}
        <PathJumpButton path={path} onNavigateToJson={onNavigateToJson} />
      </div>
    </div>
  )
}

function getTreeIndentStyle(depth: number) {
  return { paddingLeft: `${Math.min(depth, 6) * 12 + 10}px` }
}

function getNodeClassName(depth: number, modified: boolean) {
  return cn(
    'transition-colors',
    depth === 0 && 'bg-muted/55 hover:bg-muted/75',
    depth === 1 && 'bg-muted/20 hover:bg-muted/35',
    depth >= 2 && 'bg-background hover:bg-muted/20',
    modified && 'ring-1 ring-inset ring-warning/20',
  )
}

function PrimitiveField({
  path,
  fieldKey,
  value,
  originalValue,
  disabled,
  depth = 0,
  focusPath,
  highlightedPathKey,
  onValueChange,
  onNavigateToJson,
}: ConfigFieldProps) {
  const { t } = useTransClient('configManager')
  const [showSensitiveValue, setShowSensitiveValue] = useState(false)
  const label = getConfigFieldLabel(t, path, fieldKey)
  const pathKey = joinPath(path)
  const inputId = getInputId(pathKey)
  const lastKey = getLastStringSegment(path, fieldKey)
  const options = selectOptions[lastKey]
  const modified = isConfigValueModified(value, originalValue)
  const sensitive = isSensitiveConfigPath(path)

  return (
    <div
      data-config-path-key={pathKey}
      className={cn(
        'group/config-item grid min-h-8 gap-2 py-0.5 pr-2 lg:grid-cols-[minmax(120px,180px)_minmax(0,1fr)] lg:items-center',
        getNodeClassName(depth, modified),
        getPathHighlightClassName(pathKey, highlightedPathKey),
      )}
      style={getTreeIndentStyle(depth)}
    >
      <SettingLabel
        inputId={inputId}
        label={label}
        modified={modified}
        depth={depth}
        path={path}
        onNavigateToJson={onNavigateToJson}
      />

      <div className="min-w-0">
        {typeof value === 'boolean' && (
          <div className="flex h-7 w-full items-center justify-between gap-3 rounded-sm border border-transparent bg-transparent px-2 shadow-none group-hover/config-item:border-input group-hover/config-item:bg-background hover:border-input hover:bg-background">
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
            className={compactControlClassName}
            onValueChange={nextValue => onValueChange(path, nextValue ?? 0)}
          />
        )}

        {typeof value === 'string' && options && (
          <Select value={value} disabled={disabled} onValueChange={nextValue => onValueChange(path, nextValue)}>
            <SelectTrigger id={inputId} className={compactControlClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {typeof value === 'string' && !options && sensitive && (
          <div className="relative">
            <Input
              id={inputId}
              value={value}
              disabled={disabled}
              autoComplete="off"
              data-lpignore="true"
              data-form-type="other"
              className={cn(compactControlClassName, 'pr-8', !showSensitiveValue && '[-webkit-text-security:disc]')}
              onChange={event => onValueChange(path, event.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              className="absolute right-1 top-1/2 h-5 w-5 -translate-y-1/2 cursor-pointer text-muted-foreground hover:bg-transparent hover:text-foreground"
              aria-label={showSensitiveValue ? t('actions.hideSensitiveValue') : t('actions.showSensitiveValue')}
              onClick={() => setShowSensitiveValue(current => !current)}
            >
              {showSensitiveValue ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
          </div>
        )}

        {typeof value === 'string' && !options && !sensitive && shouldUseTextarea(value) && (
          <Textarea
            id={inputId}
            value={value}
            disabled={disabled}
            rows={3}
            className="min-h-20 text-sm shadow-sm"
            onChange={event => onValueChange(path, event.target.value)}
          />
        )}

        {typeof value === 'string' && !options && !sensitive && !shouldUseTextarea(value) && (
          <Input
            id={inputId}
            value={value}
            disabled={disabled}
            className={compactControlClassName}
            onChange={event => onValueChange(path, event.target.value)}
          />
        )}

        {value == null && (
          <Input
            id={inputId}
            value=""
            disabled={disabled}
            placeholder={t('common.emptyValue')}
            className={compactControlClassName}
            onChange={event => onValueChange(path, event.target.value)}
          />
        )}
      </div>
    </div>
  )
}

function getArrayItemDisplayValue(value: unknown) {
  if (typeof value === 'string')
    return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value)
  return ''
}

function getArrayItemTitle(item: unknown, fallback: string) {
  if (!isRecord(item)) {
    const value = getArrayItemDisplayValue(item)
    return value || fallback
  }

  const titleKeys = ['displayName', 'name', 'model', 'channel', 'id', 'key']
  for (const key of titleKeys) {
    const value = getArrayItemDisplayValue(item[key])
    if (value)
      return value
  }

  return fallback
}

function ArrayItemRemoveButton({ disabled, onRemove }: {
  disabled: boolean
  onRemove: () => void
}) {
  const { t } = useTransClient('configManager')

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={disabled}
      className="h-5 w-5 shrink-0 cursor-pointer text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover/config-item:opacity-100 focus-visible:opacity-100"
      aria-label={t('actions.remove')}
      onMouseDown={event => event.preventDefault()}
      onClick={(event) => {
        event.stopPropagation()
        onRemove()
      }}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  )
}

function ArrayItemAddButton({ disabled, onAdd }: {
  disabled: boolean
  onAdd: () => void
}) {
  const { t } = useTransClient('configManager')

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={disabled}
      className="h-5 w-5 shrink-0 cursor-pointer text-muted-foreground transition-colors hover:bg-background/80 hover:text-foreground"
      aria-label={t('actions.addItem')}
      onMouseDown={event => event.preventDefault()}
      onClick={(event) => {
        event.stopPropagation()
        onAdd()
      }}
    >
      <Plus className="h-3.5 w-3.5" />
    </Button>
  )
}

function PrimitiveArrayItem({
  parentPath,
  index,
  value,
  originalValue,
  disabled,
  depth,
  highlightedPathKey,
  onValueChange,
  onNavigateToJson,
  onRemove,
}: {
  parentPath: ConfigPath
  index: number
  value: unknown
  originalValue: unknown
  disabled: boolean
  depth: number
  highlightedPathKey: string
  onValueChange: (path: ConfigPath, value: ConfigValue) => void
  onNavigateToJson: (path: ConfigPath) => void
  onRemove: () => void
}) {
  const { t } = useTransClient('configManager')
  const itemPath = [...parentPath, index]
  const pathKey = joinPath(itemPath)
  const inputId = getInputId(pathKey)
  const modified = isConfigValueModified(value, originalValue)

  return (
    <div
      data-config-path-key={pathKey}
      className={cn(
        'group/config-item grid min-h-8 gap-2 border-b border-border/70 py-0.5 pr-2 last:border-b-0 lg:grid-cols-[minmax(96px,140px)_minmax(0,1fr)] lg:items-center',
        getNodeClassName(depth, modified),
        getPathHighlightClassName(pathKey, highlightedPathKey),
      )}
      style={getTreeIndentStyle(depth)}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
          #
          {index + 1}
        </span>
        {modified && (
          <Badge variant="outline" className={cn(compactBadgeClassName, 'border-warning/30 bg-warning/10 text-warning')}>
            {t('status.modified')}
          </Badge>
        )}
        <PathJumpButton path={itemPath} onNavigateToJson={onNavigateToJson} />
      </div>

      <div className="flex min-w-0 items-center gap-1">
        {typeof value === 'boolean' && (
          <div className="flex h-7 min-w-0 flex-1 items-center justify-between gap-3 rounded-sm border border-transparent bg-transparent px-2 shadow-none group-hover/config-item:border-input group-hover/config-item:bg-background hover:border-input hover:bg-background">
            <span className="text-sm text-muted-foreground">
              {value ? t('common.enabled') : t('common.disabled')}
            </span>
            <Switch checked={value} disabled={disabled} onCheckedChange={checked => onValueChange(itemPath, checked)} />
          </div>
        )}

        {typeof value === 'number' && (
          <NumberInput
            id={inputId}
            value={value}
            disabled={disabled}
            className={compactControlClassName}
            onValueChange={nextValue => onValueChange(itemPath, nextValue ?? 0)}
          />
        )}

        {typeof value === 'string' && (
          <Input
            id={inputId}
            value={value}
            disabled={disabled}
            className={compactControlClassName}
            onChange={event => onValueChange(itemPath, event.target.value)}
          />
        )}

        {value == null && (
          <Input
            id={inputId}
            value=""
            disabled={disabled}
            placeholder={t('common.emptyValue')}
            className={compactControlClassName}
            onChange={event => onValueChange(itemPath, event.target.value)}
          />
        )}

        <ArrayItemRemoveButton disabled={disabled} onRemove={onRemove} />
      </div>
    </div>
  )
}

function ObjectArrayItem({
  parentPath,
  fieldKey,
  index,
  value,
  originalValue,
  disabled,
  depth,
  focusPath,
  highlightedPathKey,
  onValueChange,
  onNavigateToJson,
  onRemove,
}: {
  parentPath: ConfigPath
  fieldKey: string
  index: number
  value: Record<string, unknown>
  originalValue: unknown
  disabled: boolean
  depth: number
  focusPath: ConfigPath | null
  highlightedPathKey: string
  onValueChange: (path: ConfigPath, value: ConfigValue) => void
  onNavigateToJson: (path: ConfigPath) => void
  onRemove: () => void
}) {
  const { t } = useTransClient('configManager')
  const itemPath = [...parentPath, index]
  const pathKey = joinPath(itemPath)
  const originalRecord = isRecord(originalValue) ? originalValue : {}
  const modifiedCount = countModifiedLeafFields(value, originalValue)
  const modified = modifiedCount > 0
  const leafCount = countLeafFields(value)
  const fallbackTitle = t('common.arrayItem', { index: index + 1 })
  const title = getArrayItemTitle(value, fallbackTitle)
  const [open, setOpen] = useState(false)
  const focusPathKey = focusPath ? joinPath(focusPath) : ''

  useEffect(() => {
    if (isPathPrefix(itemPath, focusPath))
      setOpen(true)
  }, [focusPath, focusPathKey, pathKey])

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      data-config-path-key={pathKey}
      className={cn('border-b border-border/70 last:border-b-0', getPathHighlightClassName(pathKey, highlightedPathKey))}
    >
      <CollapsibleTrigger
        className={cn(nodeTriggerClassName, getNodeClassName(depth, modified))}
        style={getTreeIndentStyle(depth)}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
            #
            {index + 1}
          </span>
          <span className="truncate text-xs font-semibold text-foreground">{title}</span>
          {modified && (
            <Badge variant="outline" className={cn(compactBadgeClassName, 'border-warning/30 bg-warning/10 text-warning')}>
              {modifiedCount}
            </Badge>
          )}
          <PathJumpButton path={itemPath} onNavigateToJson={onNavigateToJson} />
        </div>
        <div className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
          <Badge variant="outline" className={compactBadgeClassName}>{t('panel.fieldSummary', { count: leafCount })}</Badge>
          <ArrayItemRemoveButton disabled={disabled} onRemove={onRemove} />
          <ExpandIcon open={open} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-border/70 bg-background">
        <div className="divide-y divide-border/70">
          {Object.entries(value).map(([key, itemValue]) => (
            <ConfigField
              key={`${pathKey}.${key}`}
              path={[...itemPath, key]}
              fieldKey={key}
              value={itemValue}
              originalValue={originalRecord[key]}
              disabled={disabled}
              depth={depth + 1}
              focusPath={focusPath}
              highlightedPathKey={highlightedPathKey}
              onValueChange={onValueChange}
              onNavigateToJson={onNavigateToJson}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function ArrayField({
  path,
  fieldKey,
  value,
  originalValue,
  disabled,
  depth = 0,
  focusPath,
  highlightedPathKey,
  onValueChange,
  onNavigateToJson,
}: ConfigFieldProps & { value: unknown[] }) {
  const { t } = useTransClient('configManager')
  const label = getConfigFieldLabel(t, path, fieldKey)
  const pathKey = joinPath(path)
  const sampleValue = value[0] ?? ''
  const originalArray = Array.isArray(originalValue) ? originalValue : []
  const modifiedCount = countModifiedLeafFields(value, originalValue)
  const modified = modifiedCount > 0
  const leafCount = countLeafFields(value)
  const [open, setOpen] = useState(depth < 2)
  const focusPathKey = focusPath ? joinPath(focusPath) : ''

  useEffect(() => {
    if (isPathPrefix(path, focusPath))
      setOpen(true)
  }, [focusPath, focusPathKey, pathKey])

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      data-config-path-key={pathKey}
      className={cn('group/config-node', getNodeClassName(depth, modified), getPathHighlightClassName(pathKey, highlightedPathKey))}
    >
      <CollapsibleTrigger
        className={nodeTriggerClassName}
        style={getTreeIndentStyle(depth)}
      >
        <SettingLabel label={label} modified={modified} depth={depth} path={path} onNavigateToJson={onNavigateToJson} />
        <div className="flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground">
          <Badge variant="secondary" className={compactBadgeClassName}>{t('common.itemCount', { count: value.length })}</Badge>
          <Badge variant="outline" className={compactBadgeClassName}>{t('panel.fieldSummary', { count: leafCount })}</Badge>
          <ArrayItemAddButton
            disabled={disabled}
            onAdd={() => onValueChange(path, [...value, createEmptyValue(sampleValue)])}
          />
          <ExpandIcon open={open} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-border/70 bg-muted/10">
        {value.length === 0 && (
          <div className="m-2 rounded-md border border-dashed border-border bg-background px-3 py-3 text-center text-sm text-muted-foreground">
            {t('common.emptyArray')}
          </div>
        )}
        {value.map((item, index) => {
          const itemPathKey = `${pathKey}-${index}`
          const removeItem = () => onValueChange(path, value.filter((_, itemIndex) => itemIndex !== index))

          if (isRecord(item)) {
            return (
              <ObjectArrayItem
                key={itemPathKey}
                parentPath={path}
                fieldKey={fieldKey}
                index={index}
                value={item}
                originalValue={originalArray[index]}
                disabled={disabled}
                depth={depth + 1}
                focusPath={focusPath}
                highlightedPathKey={highlightedPathKey}
                onValueChange={onValueChange}
                onNavigateToJson={onNavigateToJson}
                onRemove={removeItem}
              />
            )
          }

          if (!Array.isArray(item)) {
            return (
              <PrimitiveArrayItem
                key={itemPathKey}
                parentPath={path}
                index={index}
                value={item}
                originalValue={originalArray[index]}
                disabled={disabled}
                depth={depth + 1}
                highlightedPathKey={highlightedPathKey}
                onValueChange={onValueChange}
                onNavigateToJson={onNavigateToJson}
                onRemove={removeItem}
              />
            )
          }

          return (
            <ConfigField
              key={itemPathKey}
              path={[...path, index]}
              fieldKey={`${fieldKey}.${index}`}
              value={item}
              originalValue={originalArray[index]}
              disabled={disabled}
              depth={depth + 1}
              focusPath={focusPath}
              highlightedPathKey={highlightedPathKey}
              onValueChange={onValueChange}
              onNavigateToJson={onNavigateToJson}
            />
          )
        })}
      </CollapsibleContent>
    </Collapsible>
  )
}

function ObjectField({
  path,
  fieldKey,
  value,
  originalValue,
  disabled,
  depth = 0,
  focusPath,
  highlightedPathKey,
  onValueChange,
  onNavigateToJson,
}: ConfigFieldProps & { value: Record<string, unknown> }) {
  const { t } = useTransClient('configManager')
  const label = getConfigFieldLabel(t, path, fieldKey)
  const entries = useMemo(() => Object.entries(value), [value])
  const originalRecord = isRecord(originalValue) ? originalValue : {}
  const pathKey = joinPath(path)
  const modifiedCount = countModifiedLeafFields(value, originalValue)
  const modified = modifiedCount > 0
  const leafCount = countLeafFields(value)
  const [open, setOpen] = useState(depth < 2)
  const focusPathKey = focusPath ? joinPath(focusPath) : ''

  useEffect(() => {
    if (isPathPrefix(path, focusPath))
      setOpen(true)
  }, [focusPath, focusPathKey, pathKey])

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      data-config-path-key={pathKey}
      className={cn('group/config-node', getNodeClassName(depth, modified), getPathHighlightClassName(pathKey, highlightedPathKey))}
    >
      <CollapsibleTrigger
        className={nodeTriggerClassName}
        style={getTreeIndentStyle(depth)}
      >
        <SettingLabel label={label} modified={modified} depth={depth} path={path} onNavigateToJson={onNavigateToJson} />
        <div className="flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground">
          <Badge variant="secondary" className={compactBadgeClassName}>{t('panel.fieldSummary', { count: leafCount })}</Badge>
          {modifiedCount > 0 && <Badge variant="outline" className={cn(compactBadgeClassName, 'border-warning/30 bg-warning/10 text-warning')}>{modifiedCount}</Badge>}
          <ExpandIcon open={open} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-border/70">
        {entries.length === 0 && (
          <div className="m-2 rounded-md border border-dashed border-border bg-background px-3 py-3 text-center text-sm text-muted-foreground">
            {t('common.emptyObject')}
          </div>
        )}
        <div className="divide-y divide-border/70">
          {entries.map(([key, itemValue]) => (
            <ConfigField
              key={`${pathKey}.${key}`}
              path={[...path, key]}
              fieldKey={key}
              value={itemValue}
              originalValue={originalRecord[key]}
              disabled={disabled}
              depth={depth + 1}
              focusPath={focusPath}
              highlightedPathKey={highlightedPathKey}
              onValueChange={onValueChange}
              onNavigateToJson={onNavigateToJson}
            />
          ))}
        </div>
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
