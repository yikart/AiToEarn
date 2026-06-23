const DRAFT_PROMPT_LIMIT_PREFIX = '重要：'
const DRAFT_PROMPT_LIMIT_SEPARATOR = '，'

export const DRAFT_TITLE_NO_EMOJI_LIMIT = '标题一定不要加表情。'

interface DraftPromptLimitTextOptions {
  prefix?: string
  separator?: string
}

interface CaptionPromptPriorityOptions {
  userRequirementTitle: string
  systemRequirementTitle: string
}

interface StripCaptionPromptSystemRequirementOptions {
  userRequirementTitle?: string
  systemRequirementTitle?: string
  systemRequirementPrefix?: string
}

const DRAFT_PROMPT_LIMIT_PATTERNS = [
  /^标题字数限制：.+$/,
  /^描述字数限制：.+$/,
  /^话题数量限制：.+$/,
  /^标题字数不超过.+$/,
  /^描述字数不超过.+$/,
  /^话题数量不超过.+$/,
  /^标题一定不要加表情。?$/,
]

const CAPTION_PROMPT_SYSTEM_REQUIREMENT_PREFIXES = ['重要：', 'Important:', 'Important :', 'Wichtig:', '중요:']
const CAPTION_PROMPT_USER_SECTION_TITLE_PATTERNS = [
  /用户文案要求/,
  /User Caption Requirements/i,
  /Benutzeranforderungen/i,
  /Exigences utilisateur/i,
  /ユーザー文案要件/,
  /사용자 문안 요구사항/,
]
const CAPTION_PROMPT_SYSTEM_SECTION_TITLE_PATTERNS = [
  /默认提示词/,
  /Default Prompt/i,
  /Standard-Prompt/i,
  /Prompt par défaut/i,
  /デフォルトプロンプト/,
  /기본 프롬프트/,
]
const CAPTION_PROMPT_SECTION_TITLE_WRAPPER_PATTERN = /^(?:【.+】|\[.+\])$/
const CAPTION_PROMPT_SYSTEM_LIMIT_PATTERNS = [
  /标题字数/,
  /描述字数/,
  /话题数量/,
  /标题一定不要加表情/,
  /Title must be no more/i,
  /Description must be no more/i,
  /Use no more than .* topics/i,
  /Do not use emoji in the title/i,
  /Der Titel darf höchstens/i,
  /Die Beschreibung darf höchstens/i,
  /höchstens .* Themen/i,
  /Keine Emojis im Titel/i,
  /Le titre ne doit pas dépasser/i,
  /La description ne doit pas dépasser/i,
  /au maximum .* sujets/i,
  /emoji dans le titre/i,
  /タイトルは.*文字以内/,
  /説明は.*文字以内/,
  /トピックは.*個以内/,
  /タイトルに絵文字/,
  /제목은 .*자 이내/,
  /설명은 .*자 이내/,
  /주제는 최대 .*개/,
  /제목에는 이모지/,
]

function getLastDraftPromptLimitMarkerIndex(prompt: string) {
  return Math.max(
    prompt.lastIndexOf(`\n\n${DRAFT_PROMPT_LIMIT_PREFIX}`),
    prompt.lastIndexOf(`\r\n\r\n${DRAFT_PROMPT_LIMIT_PREFIX}`),
  )
}

function getDraftPromptLimitMarkerLength(prompt: string, markerIndex: number) {
  return prompt.startsWith(`\r\n\r\n${DRAFT_PROMPT_LIMIT_PREFIX}`, markerIndex)
    ? `\r\n\r\n${DRAFT_PROMPT_LIMIT_PREFIX}`.length
    : `\n\n${DRAFT_PROMPT_LIMIT_PREFIX}`.length
}

function isDraftPromptLimit(limit: string) {
  return DRAFT_PROMPT_LIMIT_PATTERNS.some(pattern => pattern.test(limit))
}

function normalizePromptLineBreaks(prompt: string) {
  return prompt.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

function isCaptionPromptSectionTitle(line: string, patterns: RegExp[]) {
  const title = line.trim()
  return CAPTION_PROMPT_SECTION_TITLE_WRAPPER_PATTERN.test(title)
    && patterns.some(pattern => pattern.test(title))
}

function getFirstBlankLineMatch(prompt: string) {
  return /\n\s*\n/.exec(prompt)
}

function getCaptionPromptSectionText(lines: string[], startIndex: number, endIndex: number) {
  return lines.slice(startIndex + 1, endIndex).join('\n').trim()
}

function isSystemRequirementBlock(prompt: string, prefixes: string[]) {
  if (!prefixes.some(prefix => prompt.startsWith(prefix)))
    return false

  return CAPTION_PROMPT_SYSTEM_LIMIT_PATTERNS.reduce((count, pattern) => (
    pattern.test(prompt) ? count + 1 : count
  ), 0) >= 2
}

function stripLeadingSystemRequirementBlock(prompt: string, prefixes: string[]) {
  const blankLineMatch = getFirstBlankLineMatch(prompt)
  if (!blankLineMatch)
    return isSystemRequirementBlock(prompt, prefixes) ? '' : null

  const firstBlock = prompt.slice(0, blankLineMatch.index).trim()
  if (!isSystemRequirementBlock(firstBlock, prefixes))
    return null

  return prompt.slice(blankLineMatch.index + blankLineMatch[0].length).trim()
}

export function buildDraftPromptLimitText(limits: string[], options: DraftPromptLimitTextOptions = {}) {
  const normalizedLimits = limits.map(limit => limit.trim()).filter(Boolean)
  if (normalizedLimits.length === 0)
    return ''

  const prefix = options.prefix ?? DRAFT_PROMPT_LIMIT_PREFIX
  const separator = options.separator ?? DRAFT_PROMPT_LIMIT_SEPARATOR
  return `${prefix}${normalizedLimits.join(separator)}`
}

export function buildPromptWithDraftLimits(
  basePrompt: string,
  limits: string[],
  options: DraftPromptLimitTextOptions = {},
) {
  const limitText = buildDraftPromptLimitText(limits, options)
  if (!limitText)
    return basePrompt

  return `${basePrompt}\n\n${limitText}`
}

export function mergeCaptionPromptWithSystemRequirement(
  captionPrompt: string,
  systemRequirement: string,
  options?: CaptionPromptPriorityOptions,
) {
  const normalizedSystemRequirement = systemRequirement.trim()
  const normalizedCaptionPrompt = captionPrompt.trim()

  if (!normalizedSystemRequirement)
    return normalizedCaptionPrompt

  if (!normalizedCaptionPrompt)
    return normalizedSystemRequirement

  if (!options)
    return `${normalizedSystemRequirement}\n\n${normalizedCaptionPrompt}`

  return [
    `${options.userRequirementTitle.trim()}\n${normalizedCaptionPrompt}`,
    `${options.systemRequirementTitle.trim()}\n${normalizedSystemRequirement}`,
  ].filter(Boolean).join('\n\n')
}

export function stripCaptionPromptSystemRequirement(
  captionPrompt: string,
  options: StripCaptionPromptSystemRequirementOptions = {},
) {
  const normalizedCaptionPrompt = normalizePromptLineBreaks(captionPrompt).trim()
  if (!normalizedCaptionPrompt)
    return ''

  const lines = normalizedCaptionPrompt.split('\n')
  const userRequirementTitle = options.userRequirementTitle?.trim()
  const systemRequirementTitle = options.systemRequirementTitle?.trim()

  if (userRequirementTitle && systemRequirementTitle) {
    const userTitleIndex = lines.findIndex(line => line.trim() === userRequirementTitle)
    const systemTitleIndex = lines.findIndex((line, index) => index > userTitleIndex && line.trim() === systemRequirementTitle)
    if (userTitleIndex >= 0 && systemTitleIndex > userTitleIndex)
      return getCaptionPromptSectionText(lines, userTitleIndex, systemTitleIndex)

    if (userTitleIndex >= 0)
      return lines.slice(userTitleIndex + 1).join('\n').trim()
  }

  const userTitleIndex = lines.findIndex(line => isCaptionPromptSectionTitle(line, CAPTION_PROMPT_USER_SECTION_TITLE_PATTERNS))
  const systemTitleIndex = lines.findIndex((line, index) => (
    index > userTitleIndex && isCaptionPromptSectionTitle(line, CAPTION_PROMPT_SYSTEM_SECTION_TITLE_PATTERNS)
  ))
  if (userTitleIndex >= 0 && systemTitleIndex > userTitleIndex)
    return getCaptionPromptSectionText(lines, userTitleIndex, systemTitleIndex)

  if (userTitleIndex >= 0)
    return lines.slice(userTitleIndex + 1).join('\n').trim()

  const systemRequirementPrefixes = [
    options.systemRequirementPrefix?.trim(),
    ...CAPTION_PROMPT_SYSTEM_REQUIREMENT_PREFIXES,
  ].filter((prefix): prefix is string => Boolean(prefix))

  const captionPromptWithoutSystemRequirement = stripLeadingSystemRequirementBlock(
    normalizedCaptionPrompt,
    systemRequirementPrefixes,
  )
  if (captionPromptWithoutSystemRequirement !== null)
    return captionPromptWithoutSystemRequirement

  return normalizedCaptionPrompt
}

export function stripDraftPromptLimits(prompt: string) {
  const trimmedPrompt = prompt.trimEnd()
  const normalizedPrompt = normalizePromptLineBreaks(trimmedPrompt).trim()
  const promptWithoutLeadingLimits = stripLeadingSystemRequirementBlock(
    normalizedPrompt,
    CAPTION_PROMPT_SYSTEM_REQUIREMENT_PREFIXES,
  )
  if (promptWithoutLeadingLimits !== null)
    return promptWithoutLeadingLimits

  const markerIndex = getLastDraftPromptLimitMarkerIndex(trimmedPrompt)
  if (markerIndex < 0)
    return prompt

  const markerLength = getDraftPromptLimitMarkerLength(trimmedPrompt, markerIndex)
  const limits = trimmedPrompt
    .slice(markerIndex + markerLength)
    .split(DRAFT_PROMPT_LIMIT_SEPARATOR)
    .map(limit => limit.trim())
    .filter(Boolean)

  if (limits.length === 0 || limits.some(limit => !isDraftPromptLimit(limit)))
    return prompt

  return trimmedPrompt.slice(0, markerIndex)
}
