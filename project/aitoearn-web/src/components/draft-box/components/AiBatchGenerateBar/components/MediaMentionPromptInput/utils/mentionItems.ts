import type { BeautifulMentionsItem } from 'lexical-beautiful-mentions'
import type { MediaMentionItem, MediaMentionNodeData, MediaMentionType } from '../types'
import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
} from 'lexical'
import { $createBeautifulMentionNode } from 'lexical-beautiful-mentions'
import { EMPTY_MEDIA_MENTION_ACTION_VALUE } from './constants'

export function getMentionMediaType(value: string): MediaMentionType | null {
  if (/^Image[1-9]$/.test(value))
    return 'image'
  if (/^Video[1-3]$/.test(value))
    return 'video'
  if (/^Audio[1-3]$/.test(value))
    return 'audio'
  return null
}

export function createMentionData(item?: MediaMentionItem): MediaMentionNodeData | undefined {
  if (!item)
    return undefined
  return {
    mediaType: item.type,
    displayName: item.displayName,
    typeLabel: item.typeLabel,
  }
}

export function buildMediaMentionItems(mediaMentions: MediaMentionItem[]): BeautifulMentionsItem[] {
  if (mediaMentions.length === 0)
    return [{ value: EMPTY_MEDIA_MENTION_ACTION_VALUE, emptyMediaAction: true }]

  return mediaMentions.map(item => ({
    value: item.value,
    displayName: item.displayName,
    mediaType: item.type,
    typeLabel: item.typeLabel,
  }))
}

function normalizeMentionSearchText(value: string) {
  return value.trim().replace(/^@/, '').toLowerCase()
}

export function mediaMentionMatchesQuery(item: MediaMentionItem, query: string) {
  const normalizedQuery = normalizeMentionSearchText(query)
  if (!normalizedQuery)
    return true

  return [item.value, item.token, item.displayName, item.file?.name, item.previewTitle].some(
    value => value?.toLowerCase().includes(normalizedQuery),
  )
}

export function isEmptyMediaMentionAction(value: string) {
  return value === EMPTY_MEDIA_MENTION_ACTION_VALUE
}

export function hasActiveMediaMentionQuery() {
  const selection = $getSelection()
  if (!$isRangeSelection(selection) || !selection.isCollapsed())
    return false

  const anchor = selection.anchor
  if (anchor.type !== 'text')
    return false

  const textBeforeCursor = anchor.getNode().getTextContent().slice(0, anchor.offset)
  return /@[^\s@]*$/.test(textBeforeCursor)
}

function splitTextByMediaMentions(text: string) {
  return text.split(/(@(?:Image[1-9]|Video[1-3]|Audio[1-3]))/g).filter(Boolean)
}

export function appendTextWithMediaMentions(
  append: (text: string, mentionValue?: string) => void,
  text: string,
) {
  splitTextByMediaMentions(text).forEach((part) => {
    const mentionValue = part.startsWith('@') ? part.slice(1) : undefined
    if (mentionValue && getMentionMediaType(mentionValue)) {
      append(part, mentionValue)
      return
    }
    append(part)
  })
}

export function setEditorTextContent(value: string, itemsByValue: Map<string, MediaMentionItem>) {
  const root = $getRoot()
  root.clear()

  const paragraph = $createParagraphNode()
  root.append(paragraph)

  value.split(/\r?\n/).forEach((line, lineIndex) => {
    if (lineIndex > 0)
      paragraph.append($createLineBreakNode())

    appendTextWithMediaMentions((text, mentionValue) => {
      if (mentionValue) {
        paragraph.append(
          $createBeautifulMentionNode(
            '@',
            mentionValue,
            createMentionData(itemsByValue.get(mentionValue)),
          ),
        )
        return
      }
      if (text)
        paragraph.append($createTextNode(text))
    }, line)
  })
}

export function getDataString(data: MediaMentionNodeData | undefined, key: string) {
  const value = data?.[key]
  return typeof value === 'string' ? value : undefined
}
