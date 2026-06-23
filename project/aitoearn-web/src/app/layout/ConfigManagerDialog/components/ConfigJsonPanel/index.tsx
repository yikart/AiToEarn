/**
 * ConfigJsonPanel - JSON 配置编辑区
 * 在可编辑 Textarea 上叠加字段定位按钮与行级高亮。
 */
'use client'

import type { ConfigPath, ConfigPathFocusRequest } from '../../types'
import { SlidersHorizontal } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/utils/className'
import { joinPath } from '../../utils/configPath'

interface JsonLineAction {
  charEnd: number
  charStart: number
  lineIndex: number
  path: ConfigPath
  pathKey: string
}

interface JsonContext {
  childLevel: number
  nextIndex: number
  path: ConfigPath
  type: 'array' | 'object'
}

export interface ConfigJsonPanelProps {
  disabled: boolean
  focusRequest: ConfigPathFocusRequest | null
  hasConfig: boolean
  highlightedPathKey: string
  initialScrollTop: number
  jsonText: string
  onFocusRequestHandled: (requestId: number) => void
  onJsonTextChange: (value: string) => void
  onNavigateToVisual: (path: ConfigPath) => void
  onScrollTopChange: (scrollTop: number) => void
}

const jsonLineHeight = 24
const jsonPaddingTop = 8

function readJsonKey(rawKey: string) {
  try {
    return JSON.parse(`"${rawKey}"`) as string
  }
  catch {
    return rawKey
  }
}

function getLineLevel(line: string) {
  const indentLength = line.match(/^\s*/)?.[0].length ?? 0
  return Math.floor(indentLength / 2)
}

function getCurrentContext(contexts: JsonContext[], level: number) {
  return [...contexts].reverse().find(context => context.childLevel === level)
}

function getJsonObjectLineEntry(line: string) {
  const quoteIndex = line.indexOf('"')
  if (quoteIndex < 0 || line.slice(0, quoteIndex).trim())
    return null

  let escaped = false
  for (let index = quoteIndex + 1; index < line.length; index += 1) {
    const char = line[index]
    if (escaped) {
      escaped = false
      continue
    }
    if (char === '\\') {
      escaped = true
      continue
    }
    if (char !== '"')
      continue

    let colonIndex = index + 1
    while (colonIndex < line.length && line[colonIndex].trim() === '') {
      colonIndex += 1
    }

    if (line[colonIndex] !== ':')
      return null

    return {
      rawKey: line.slice(quoteIndex + 1, index),
      valueStart: line.slice(colonIndex + 1).trim(),
    }
  }

  return null
}

function getPathLineAction(
  line: string,
  lineIndex: number,
  charStart: number,
  charEnd: number,
  contexts: JsonContext[],
): JsonLineAction | null {
  const level = getLineLevel(line)
  const trimmed = line.trim()

  while (contexts.length > 1 && contexts[contexts.length - 1].childLevel > level) {
    contexts.pop()
  }

  const entry = getJsonObjectLineEntry(line)
  if (entry) {
    const parentContext = getCurrentContext(contexts, level)
    const key = readJsonKey(entry.rawKey)
    const path = [...(parentContext?.path ?? []), key]
    const valueStart = entry.valueStart

    if (valueStart.startsWith('{')) {
      contexts.push({ childLevel: level + 1, nextIndex: 0, path, type: 'object' })
    }
    else if (valueStart.startsWith('[')) {
      contexts.push({ childLevel: level + 1, nextIndex: 0, path, type: 'array' })
    }

    return { charEnd, charStart, lineIndex, path, pathKey: joinPath(path) }
  }

  const parentContext = getCurrentContext(contexts, level)
  if (parentContext?.type !== 'array' || !trimmed || trimmed.startsWith(']') || trimmed.startsWith('}')) {
    return null
  }

  const path = [...parentContext.path, parentContext.nextIndex]
  parentContext.nextIndex += 1

  if (trimmed.startsWith('{')) {
    contexts.push({ childLevel: level + 1, nextIndex: 0, path, type: 'object' })
  }
  else if (trimmed.startsWith('[')) {
    contexts.push({ childLevel: level + 1, nextIndex: 0, path, type: 'array' })
  }

  return { charEnd, charStart, lineIndex, path, pathKey: joinPath(path) }
}

function getJsonLineActions(jsonText: string) {
  const contexts: JsonContext[] = [{ childLevel: 1, nextIndex: 0, path: [], type: 'object' }]
  const lines = jsonText.split('\n')
  const actions: JsonLineAction[] = []
  let charOffset = 0

  lines.forEach((line, lineIndex) => {
    const charStart = charOffset
    const charEnd = charStart + line.length
    const action = getPathLineAction(line, lineIndex, charStart, charEnd, contexts)
    if (action) {
      actions.push(action)
    }
    charOffset = charEnd + 1
  })

  return actions
}

function findLineAction(actions: JsonLineAction[], pathKey: string) {
  const exactAction = actions.find(action => action.pathKey === pathKey)
  if (exactAction)
    return exactAction

  return actions
    .filter(action => pathKey.startsWith(`${action.pathKey}.`))
    .sort((first, second) => second.pathKey.length - first.pathKey.length)[0]
}

export function ConfigJsonPanel({
  disabled,
  focusRequest,
  hasConfig,
  highlightedPathKey,
  initialScrollTop,
  jsonText,
  onFocusRequestHandled,
  onJsonTextChange,
  onNavigateToVisual,
  onScrollTopChange,
}: ConfigJsonPanelProps) {
  const { t } = useTransClient('configManager')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const handledFocusRequestIdRef = useRef<number | null>(null)
  const [hoveredLineIndex, setHoveredLineIndex] = useState<number | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const lineActions = useMemo(() => getJsonLineActions(jsonText), [jsonText])
  const lineCount = useMemo(() => jsonText.split('\n').length, [jsonText])
  const hoveredLineTop = hoveredLineIndex === null
    ? null
    : jsonPaddingTop + hoveredLineIndex * jsonLineHeight - scrollTop
  const highlightedAction = highlightedPathKey ? findLineAction(lineActions, highlightedPathKey) : undefined

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea || focusRequest)
      return

    textarea.scrollTop = initialScrollTop
    setScrollTop(initialScrollTop)
  }, [focusRequest, initialScrollTop])

  useEffect(() => {
    if (!focusRequest)
      return
    if (handledFocusRequestIdRef.current === focusRequest.id)
      return

    const targetAction = findLineAction(lineActions, joinPath(focusRequest.path))
    const textarea = textareaRef.current
    if (!targetAction || !textarea)
      return

    let firstFrame = 0
    let secondFrame = 0
    handledFocusRequestIdRef.current = focusRequest.id

    firstFrame = window.requestAnimationFrame(() => {
      const nextScrollTop = Math.max(0, targetAction.lineIndex * jsonLineHeight - jsonLineHeight * 4)
      textarea.setSelectionRange(targetAction.charStart, targetAction.charEnd)
      textarea.focus({ preventScroll: true })

      secondFrame = window.requestAnimationFrame(() => {
        textarea.scrollTop = nextScrollTop
        setScrollTop(nextScrollTop)
        onScrollTopChange(nextScrollTop)
        onFocusRequestHandled(focusRequest.id)
      })
    })

    return () => {
      window.cancelAnimationFrame(firstFrame)
      window.cancelAnimationFrame(secondFrame)
    }
  }, [focusRequest, lineActions, onFocusRequestHandled, onScrollTopChange])

  return (
    <div className="relative h-full min-h-[420px] rounded-md bg-muted/30">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-md">
        {hoveredLineTop !== null && (
          <div
            className="absolute left-3 right-3 h-6 rounded-sm ring-1 ring-primary/25"
            style={{
              top: `${hoveredLineTop}px`,
              backgroundColor: 'color-mix(in oklab, var(--primary) 16%, transparent)',
            }}
          />
        )}

        {highlightedAction && (
          <div
            key={`${highlightedAction.pathKey}-${focusRequest?.id ?? 0}`}
            className="absolute left-2 right-2 h-6 animate-pulse rounded-sm ring-1 ring-primary/40"
            style={{
              top: `${jsonPaddingTop + highlightedAction.lineIndex * jsonLineHeight - scrollTop}px`,
              backgroundColor: 'color-mix(in oklab, var(--primary) 18%, transparent)',
            }}
          />
        )}
      </div>

      <Textarea
        ref={textareaRef}
        value={jsonText}
        disabled={disabled || !hasConfig}
        spellCheck={false}
        className="relative z-10 h-full min-h-[420px] resize-none border-border bg-transparent pr-12 font-mono text-sm leading-6 shadow-none"
        onMouseLeave={() => setHoveredLineIndex(null)}
        onMouseMove={(event) => {
          const textarea = event.currentTarget
          const rect = textarea.getBoundingClientRect()
          const lineIndex = Math.floor((event.clientY - rect.top + textarea.scrollTop - jsonPaddingTop) / jsonLineHeight)
          setHoveredLineIndex(lineIndex >= 0 && lineIndex < lineCount ? lineIndex : null)
        }}
        onChange={(event) => {
          onJsonTextChange(event.target.value)
        }}
        onScroll={(event) => {
          const nextScrollTop = event.currentTarget.scrollTop
          setScrollTop(nextScrollTop)
          onScrollTopChange(nextScrollTop)
        }}
      />

      <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-md">
        {lineActions.map(action => (
          <Button
            key={`${action.pathKey}-${action.lineIndex}`}
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'pointer-events-auto absolute right-2 h-5 w-5 cursor-pointer text-muted-foreground opacity-0 transition-opacity hover:bg-background/80 hover:text-foreground focus-visible:opacity-100',
              hoveredLineIndex === action.lineIndex && 'opacity-100',
            )}
            style={{ top: `${jsonPaddingTop + action.lineIndex * jsonLineHeight + 1 - scrollTop}px` }}
            aria-label={t('actions.goToVisualField')}
            disabled={disabled || !hasConfig}
            onClick={() => onNavigateToVisual(action.path)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </Button>
        ))}
      </div>
    </div>
  )
}
