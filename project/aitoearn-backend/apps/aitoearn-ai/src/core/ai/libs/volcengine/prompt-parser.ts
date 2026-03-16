import { Logger } from '@nestjs/common'
import {
  AITranslationSkillParams,
  LanguageCode,
  SkillType,
  SubtitleRecognitionType,
  TranslationType,
} from './volcengine.interface'

const logger = new Logger('PromptParser')

/**
 * 语言映射表（中文关键词 -> LanguageCode）
 */
const LANGUAGE_MAP: Record<string, LanguageCode> = {
  // 中文
  中文: LanguageCode.Zh,
  汉语: LanguageCode.Zh,
  中: LanguageCode.Zh,
  chinese: LanguageCode.Zh,
  zh: LanguageCode.Zh,

  // 英文
  英文: LanguageCode.En,
  英语: LanguageCode.En,
  英: LanguageCode.En,
  english: LanguageCode.En,
  en: LanguageCode.En,

  // 日语
  日文: LanguageCode.Ja,
  日语: LanguageCode.Ja,
  日: LanguageCode.Ja,
  japanese: LanguageCode.Ja,
  ja: LanguageCode.Ja,

  // 韩语
  韩文: LanguageCode.Ko,
  韩语: LanguageCode.Ko,
  韩: LanguageCode.Ko,
  朝鲜语: LanguageCode.Ko,
  korean: LanguageCode.Ko,
  ko: LanguageCode.Ko,

  // 德语
  德文: LanguageCode.De,
  德语: LanguageCode.De,
  德: LanguageCode.De,
  german: LanguageCode.De,
  de: LanguageCode.De,

  // 法语
  法文: LanguageCode.Fr,
  法语: LanguageCode.Fr,
  法: LanguageCode.Fr,
  french: LanguageCode.Fr,
  fr: LanguageCode.Fr,

  // 俄语
  俄文: LanguageCode.Ru,
  俄语: LanguageCode.Ru,
  俄: LanguageCode.Ru,
  russian: LanguageCode.Ru,
  ru: LanguageCode.Ru,

  // 西班牙语
  西班牙文: LanguageCode.Es,
  西班牙语: LanguageCode.Es,
  西语: LanguageCode.Es,
  spanish: LanguageCode.Es,
  es: LanguageCode.Es,

  // 葡萄牙语
  葡萄牙文: LanguageCode.Pt,
  葡萄牙语: LanguageCode.Pt,
  葡语: LanguageCode.Pt,
  portuguese: LanguageCode.Pt,
  pt: LanguageCode.Pt,

  // 意大利语
  意大利文: LanguageCode.It,
  意大利语: LanguageCode.It,
  意语: LanguageCode.It,
  italian: LanguageCode.It,
  it: LanguageCode.It,

  // 印尼语
  印尼文: LanguageCode.Id,
  印尼语: LanguageCode.Id,
  印度尼西亚语: LanguageCode.Id,
  indonesian: LanguageCode.Id,
  id: LanguageCode.Id,

  // 越南语
  越南文: LanguageCode.Vi,
  越南语: LanguageCode.Vi,
  越语: LanguageCode.Vi,
  vietnamese: LanguageCode.Vi,
  vi: LanguageCode.Vi,

  // 泰语
  泰文: LanguageCode.Th,
  泰语: LanguageCode.Th,
  泰: LanguageCode.Th,
  thai: LanguageCode.Th,
  th: LanguageCode.Th,

  // 阿拉伯语
  阿拉伯文: LanguageCode.Ar,
  阿拉伯语: LanguageCode.Ar,
  阿语: LanguageCode.Ar,
  arabic: LanguageCode.Ar,
  ar: LanguageCode.Ar,

  // 土耳其语
  土耳其文: LanguageCode.Tr,
  土耳其语: LanguageCode.Tr,
  土语: LanguageCode.Tr,
  turkish: LanguageCode.Tr,
  tr: LanguageCode.Tr,
}

const DEFAULT_SOURCE: LanguageCode = LanguageCode.Zh
const DEFAULT_TARGET: LanguageCode = LanguageCode.En
// Note: Only FacialTranslation is supported, no keyword mapping needed

/**
 * from prompt extract source and target languages
 */
/**
 * 清洗并标准化语言关键词
 */
function normalizeLang(raw?: string): LanguageCode | undefined {
  if (!raw)
    return
  const key = raw
    .toLowerCase()
    .replace(/[^\w\u4E00-\u9FA5]/g, '') // 去掉标点，只保留字母/数字/中文
  return LANGUAGE_MAP[key]
}

/**
 * 从 prompt 中提取源语言和目标语言
 */
function extractLanguage(prompt: string): { source: LanguageCode, target: LanguageCode } {
  let source: LanguageCode | undefined
  let target: LanguageCode | undefined

  // 常见中英文表达
  const patterns: RegExp[] = [
    // 从中文翻译到英文 / 由A翻译成B
    /(?:从|由)\s*([^\s到成为至:：,，。]+)\s*(?:翻译)?[到成为至]\s*([^\s:：,，。]+)/,

    // 中文翻译成英文 / 中文译成英文
    /(\S+)\s*(?:翻译|译)[成为到]\s*([^\s:：,，。]+)/,

    // translate from chinese to english
    /translate\s+(?:from\s+)?(\w+)\s+(?:to|into)\s+(\w+)/i,
  ]

  for (const p of patterns) {
    const m = prompt.match(p)
    if (m) {
      source = normalizeLang(m[1])
      target = normalizeLang(m[2])
      if (source || target)
        break
    }
  }

  // 只指定目标语言：翻译为英文 / translate to english
  if (!target) {
    const targetPatterns: RegExp[] = [
      /(?:翻译|译)[为成到]\s*([^\s:：,，。]+)/,
      /translate\s+(?:to|into)\s+(\w+)/i,
    ]

    for (const p of targetPatterns) {
      const m = prompt.match(p)
      if (m) {
        target = normalizeLang(m[1])
        if (target)
          break
      }
    }
  }

  // 🔹 MCP 提示词兜底：to target language
  if (!target && /target language/i.test(prompt)) {
    target = DEFAULT_TARGET
  }

  // ✅ 默认：中文 → 英文
  source = source ?? DEFAULT_SOURCE
  target = target ?? DEFAULT_TARGET

  logger.debug(`Extracted language => source: ${source}, target: ${target}`)
  return { source, target }
}

/**
 * Extract translation type from prompt
 */
function extractTranslationType(_prompt: string): TranslationType[] {
  logger.debug('Using FacialTranslation (only supported type)')
  return [TranslationType.FacialTranslation, TranslationType.SubtitleTranslation, TranslationType.VoiceTranslation]
}

/**
 * Extract subtitle recognition type from prompt
 */
function extractSubtitleRecognitionType(prompt: string): SubtitleRecognitionType {
  const lowerPrompt = prompt.toLowerCase()

  if (lowerPrompt.includes('ocr') || lowerPrompt.includes('image')) {
    return SubtitleRecognitionType.OCR
  }

  if (lowerPrompt.includes('asr') || lowerPrompt.includes('audio') || lowerPrompt.includes('speech')) {
    return SubtitleRecognitionType.ASR
  }

  if (lowerPrompt.includes('vision') || lowerPrompt.includes('ai')) {
    return SubtitleRecognitionType.Vision
  }

  // 如果提到硬字幕相关关键词，使用 OCR
  if (lowerPrompt.includes('硬字幕') || lowerPrompt.includes('hard subtitle') || lowerPrompt.includes('hardcoded')) {
    return SubtitleRecognitionType.OCR
  }

  // Default to ASR - 大多数视频翻译场景是翻译语音内容
  return SubtitleRecognitionType.ASR
}

/**
 * Check if hard subtitle and source erasure are needed
 * (Reserved for future prompt-based override)
 */
function _extractSubtitleConfig(prompt: string) {
  const lowerPrompt = prompt.toLowerCase()

  const needHardSubtitle = lowerPrompt.includes('hard subtitle')
    || lowerPrompt.includes('burn')
    || lowerPrompt.includes('embed')

  const needEraseSource = lowerPrompt.includes('erase')
    || lowerPrompt.includes('remove')
    || needHardSubtitle

  return {
    needHardSubtitle,
    needEraseSource,
  }
}

function isTranslationPrompt(prompt: string): boolean {
  const text = prompt.toLowerCase()

  const patterns: RegExp[] = [
    // 中文翻译意图
    /翻译/,
    /译为|译成/,
    /将.*翻译/,
    /字幕.*翻译/,
    /翻译.*字幕/,

    // 英文翻译意图
    /translate/,
    /translation/,
    /subtitles?/,
    /voice/,
    /lip/,
    /facial/,
    /audio/,
  ]

  return patterns.some(p => p.test(text))
}

/**
 * Parse translation prompt
 */
export function parseTranslationPrompt(prompt: string): AITranslationSkillParams | null {
  logger.debug(`Parsing translation prompt: ${prompt}`)

  if (!isTranslationPrompt(prompt)) {
    logger.debug('Prompt does not contain translation intent')
    return null
  }

  const { source, target } = extractLanguage(prompt)

  if (!target) {
    logger.warn('Unable to extract target language from prompt')
    return null
  }

  const translationTypes = extractTranslationType(prompt)
  const recognitionType = extractSubtitleRecognitionType(prompt)

  // Build params - Facial translation config
  const params: AITranslationSkillParams = {
    TranslationConfig: {
      SourceLanguage: source || LanguageCode.Zh, // Default source: Chinese
      TargetLanguage: target,
      TranslationTypeList: translationTypes, // Always [FacialTranslation]
    },
    OperatorConfig: {
      SubtitleRecognitionConfig: {
        RecognitionType: recognitionType,
      },
    },
  }

  // Facial translation defaults: hard subtitle + erase source
  params.SubtitleConfig = {
    IsHardSubtitle: true,
    IsEraseSource: true,
    FontSize: 24,
    MarginL: 0.1,
    MarginR: 0.1,
    MarginV: 0.05,
    ShowLines: 2,
  }
  logger.debug('Applied facial translation defaults: hard subtitle + erase source')

  return params
}

/**
 * Parse VCreative (AI editing) prompt
 * Currently disabled, reserved for future use
 */
function _parseVCreativePrompt(prompt: string): { Text: string } | null {
  const lowerPrompt = prompt.toLowerCase()

  const mergeKeywords = [
    'merge',
    'combine',
    'mix',
    'audio',
    'video',
    'sound',
  ]

  const isMerge = mergeKeywords.some(keyword => lowerPrompt.includes(keyword))

  if (isMerge) {
    logger.debug('Detected merge-related prompt')

    let optimizedText = ''

    if (lowerPrompt.includes('audio') || lowerPrompt.includes('sound')) {
      optimizedText = 'Merge video visuals with audio from second input'
    }
    else if (lowerPrompt.includes('concat') || lowerPrompt.includes('join')) {
      optimizedText = prompt
    }
    else {
      optimizedText = prompt
    }

    logger.debug(`VCreative prompt optimized: ${prompt} -> ${optimizedText}`)

    return {
      Text: optimizedText,
    }
  }

  const vCreativeKeywords = [
    'concat',
    'trim',
    'cut',
    'edit',
    'image',
    'generate video',
  ]

  const isVCreative = vCreativeKeywords.some(keyword => lowerPrompt.includes(keyword))

  if (isVCreative) {
    logger.debug('Detected VCreative prompt')
    return {
      Text: prompt,
    }
  }

  return null
}

/**
 * Check if prompt is a subtitle erase task (no translation intent)
 */
function isEraseOnlyTask(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase()

  const eraseKeywords = ['remove', 'erase', 'delete', 'clear']
  const hasEraseKeyword = eraseKeywords.some(keyword => lowerPrompt.includes(keyword))

  if (!hasEraseKeyword) {
    return false
  }

  // Subtitle-related keywords
  const subtitleKeywords = ['subtitle', 'caption', 'watermark']
  const hasSubtitleKeyword = subtitleKeywords.some(keyword => lowerPrompt.includes(keyword))

  // Exclude translation intent
  const translationIntentKeywords = ['translate', 'translation']
  const hasTranslationIntent = translationIntentKeywords.some(keyword => lowerPrompt.includes(keyword))

  // Erase task: has erase + subtitle keywords, but no translation intent
  return hasSubtitleKeyword && !hasTranslationIntent
}

/**
 * Check if prompt is a highlight extraction task
 */
function isHighlightTask(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase()

  const highlightKeywords = [
    'highlight',
    'exciting',
    'best moments',
    'compilation',
    'montage',
  ]

  return highlightKeywords.some(keyword => lowerPrompt.includes(keyword))
}

/**
 * Check if prompt is a video understanding task
 */
function isVisionTask(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase()

  const visionKeywords = [
    'understand',
    'summarize',
    'summary',
    'analyze',
    'analysis',
    'describe',
    'what is',
    'about',
    'content',
    'keywords',
    'tags',
  ]

  return visionKeywords.some(keyword => lowerPrompt.includes(keyword))
}

/**
 * Check if prompt is a VCreative (AI editing) task
 */
function isVCreativeTask(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase()

  const vCreativeKeywords = [
    'concat',
    'merge',
    'combine',
    'edit',
    'trim',
    'cut',
    'splice',
    'join',
    'add music',
    'background music',
    'picture-in-picture',
    'pip',
  ]

  return vCreativeKeywords.some(keyword => lowerPrompt.includes(keyword))
}

/**
 * Parse Aideo task prompt to extract skill type and parameters
 *
 * Priority order (high to low):
 * 1. AITranslation - Translation tasks
 * 2. Erase - Subtitle/watermark removal
 * 3. Highlight - Highlight extraction
 * 4. Vision - Video understanding
 * 5. VCreative - AI editing (fallback)
 */
export function parseAideoPrompt(prompt: string): {
  skillType: SkillType
  skillParams: Record<string, unknown>
} | null {
  logger.debug(`Parsing Aideo prompt: ${prompt}`)

  // 1. Check translation task first
  const translationParams = parseTranslationPrompt(prompt)
  if (translationParams) {
    logger.debug('Detected AITranslation task')
    return {
      skillType: SkillType.AITranslation,
      skillParams: translationParams as unknown as Record<string, unknown>,
    }
  }

  // 2. Check subtitle erase task
  if (isEraseOnlyTask(prompt)) {
    logger.debug('Detected Erase task')
    return {
      skillType: SkillType.Erase,
      skillParams: {
        Mode: 'Auto',
        Auto: { Type: 'Subtitle' },
        NewVid: true,
      },
    }
  }

  // 3. Check highlight task
  if (isHighlightTask(prompt)) {
    logger.debug('Detected Highlight task')
    return {
      skillType: SkillType.Highlight,
      skillParams: {
        Text: prompt,
      },
    }
  }

  // 4. Check vision task
  if (isVisionTask(prompt)) {
    logger.debug('Detected Vision task')
    return {
      skillType: SkillType.Vision,
      skillParams: {
        Text: prompt,
      },
    }
  }

  // 5. Check VCreative task (fallback)
  if (isVCreativeTask(prompt)) {
    logger.debug('Detected VCreative task')
    return {
      skillType: SkillType.VCreative,
      skillParams: {
        Text: prompt,
      },
    }
  }

  // No match, let server decide
  logger.debug('Unable to detect skill type, server will decide')
  return null
}
