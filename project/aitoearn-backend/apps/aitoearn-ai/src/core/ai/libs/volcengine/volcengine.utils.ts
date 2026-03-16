import type { Ratio, Resolution } from './volcengine.interface'
import { Logger } from '@nestjs/common'

const logger = new Logger('VolcengineUtils')

/**
 * 火山引擎视频生成模型文本命令工具类
 * 用于解析和序列化模型文本命令参数
 */

// 模型文本命令参数接口
export interface ModelTextCommandParams {
  /** 视频分辨率，简写 rs */
  resolution?: Resolution
  /** 生成视频的宽高比例，简写 rt */
  ratio?: Ratio
  /** 生成视频时长，单位：秒，简写 dur */
  duration?: number
  /** 帧率，即一秒时间内视频画面数量，简写 fps */
  framespersecond?: number
  /** 生成视频是否包含水印，简写 wm */
  watermark?: boolean
  /** 种子整数，用于控制生成内容的随机性，简写 seed */
  seed?: number
  /** 是否固定摄像头，简写 cf */
  camerafixed?: boolean
}

// 参数映射表
const PARAM_MAP = {
  resolution: 'rs',
  ratio: 'rt',
  duration: 'dur',
  framespersecond: 'fps',
  watermark: 'wm',
  seed: 'seed',
  camerafixed: 'cf',
} as const

// 反向映射表
const REVERSE_PARAM_MAP = Object.fromEntries(
  Object.entries(PARAM_MAP).map(([key, value]) => [value, key]),
) as Record<string, keyof ModelTextCommandParams>

/**
 * 将模型文本命令参数序列化为字符串
 * @param params 模型文本命令参数对象
 * @returns 序列化后的命令字符串，如 "--rs 720p --rt 16:9 --dur 5"
 */
export function serializeModelTextCommand(params: ModelTextCommandParams): string {
  const commands: string[] = []

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      const shortKey = PARAM_MAP[key as keyof ModelTextCommandParams]
      if (shortKey) {
        commands.push(`--${shortKey} ${value}`)
      }
    }
  }

  return commands.join(' ')
}

/**
 * 从文本中解析模型文本命令参数
 * @param text 包含命令参数的文本，如 "小猫对着镜头打哈欠。 --rs 720p --rt 16:9 --dur 5 --fps 24 --wm true --seed 11 --cf false"
 * @returns 解析结果，包含纯文本内容和参数对象
 */
export function parseModelTextCommand(text: string): {
  prompt: string
  params: ModelTextCommandParams
} {
  // 查找命令参数的起始位置
  const commandMatch = text.match(/\s+--\w+/)
  if (!commandMatch) {
    return {
      prompt: text.trim(),
      params: {},
    }
  }

  const commandStartIndex = commandMatch.index!
  const prompt = text.substring(0, commandStartIndex).trim()
  const commandText = text.substring(commandStartIndex).trim()

  // 解析命令参数
  const params: ModelTextCommandParams = {}
  const paramRegex = /--([a-z]+)\s+(\S+)/gi
  let match = paramRegex.exec(commandText)

  while (match !== null) {
    const [, shortKey, value] = match
    const fullKey = REVERSE_PARAM_MAP[shortKey]

    if (fullKey) {
      // 根据参数类型转换值
      switch (fullKey) {
        case 'duration':
        case 'framespersecond':
        case 'seed':
          params[fullKey] = Number.parseInt(value, 10)
          break
        case 'watermark':
        case 'camerafixed':
          params[fullKey] = value.toLowerCase() === 'true'
          break
        case 'resolution':
        case 'ratio':
          params[fullKey] = value
          break
      }
    }
    match = paramRegex.exec(commandText)
  }

  return {
    prompt,
    params,
  }
}

/**
 * 媒体文件类型枚举
 */
export enum MediaType {
  Video = 'video',
  Audio = 'audio',
  Unknown = 'unknown',
}

/**
 * 根据文件扩展名判断媒体类型
 */
export function detectMediaType(filename: string): MediaType {
  const extension = filename.toLowerCase().split('.').pop() || ''

  const videoExtensions = [
    'mp4',
    'avi',
    'mov',
    'wmv',
    'flv',
    'mkv',
    'webm',
    'm4v',
    'mpg',
    'mpeg',
    '3gp',
    'f4v',
    'rmvb',
    'ts',
    'vob',
    'ogv',
  ]

  const audioExtensions = [
    'mp3',
    'wav',
    'aac',
    'm4a',
    'flac',
    'ogg',
    'wma',
    'opus',
    'aiff',
    'ape',
    'alac',
    'ac3',
    'dts',
    'amr',
    'mid',
    'midi',
  ]

  if (videoExtensions.includes(extension)) {
    return MediaType.Video
  }

  if (audioExtensions.includes(extension)) {
    return MediaType.Audio
  }

  logger.warn(`无法识别文件类型: ${filename}`)
  return MediaType.Unknown
}

/**
 * 验证音视频合并的输入是否合法
 */
export function validateVideoAudioMergeInputs(inputs: Array<{ url?: string, fileName?: string }>): {
  isValid: boolean
  error?: string
  suggestion?: string
} {
  if (inputs.length !== 2) {
    return {
      isValid: false,
      error: `音视频合并需要恰好 2 个输入文件，当前提供了 ${inputs.length} 个`,
      suggestion: '请提供一个视频文件和一个音频文件',
    }
  }

  const [first, second] = inputs

  const firstType = detectMediaType(first.url || first.fileName || '')
  const secondType = detectMediaType(second.url || second.fileName || '')

  if (firstType === MediaType.Unknown || secondType === MediaType.Unknown) {
    return {
      isValid: false,
      error: '无法识别输入文件的类型',
      suggestion: '请确保文件名包含正确的扩展名（如 .mp4, .mp3）',
    }
  }

  if (firstType === MediaType.Video && secondType === MediaType.Audio) {
    return {
      isValid: true,
    }
  }

  if (firstType === MediaType.Audio && secondType === MediaType.Video) {
    return {
      isValid: false,
      error: '输入顺序错误：第一个输入应该是视频文件，第二个应该是音频文件',
      suggestion: '请交换输入顺序，将视频文件放在第一位，音频文件放在第二位',
    }
  }

  if (firstType === MediaType.Video && secondType === MediaType.Video) {
    return {
      isValid: false,
      error: '两个输入都是视频文件',
      suggestion: '如果要合并视频和音频，第二个输入应该是音频文件。如果要拼接视频，请使用不同的 prompt（如"将两个视频拼接在一起"）',
    }
  }

  if (firstType === MediaType.Audio && secondType === MediaType.Audio) {
    return {
      isValid: false,
      error: '两个输入都是音频文件',
      suggestion: '音视频合并需要一个视频文件和一个音频文件。请至少提供一个视频文件作为画面来源',
    }
  }

  return {
    isValid: false,
    error: '未知错误',
  }
}

/**
 * 生成优化的音视频合并 Prompt
 */
export function generateOptimizedMergePrompt(inputs: Array<{ url?: string, fileName?: string }>): string {
  const validation = validateVideoAudioMergeInputs(inputs)

  if (!validation.isValid) {
    logger.warn(`输入验证失败: ${validation.error}`)
    logger.warn(`建议: ${validation.suggestion}`)
  }

  // 返回火山引擎推荐的标准格式
  return '将第一个视频的画面和第二个音频合成为一个新视频,保留视频画面,使用音频的声音'
}

/**
 * 音频格式转换建议
 */
export const AUDIO_FORMAT_RECOMMENDATIONS = {
  wav: {
    recommended: 'mp3',
    reason: 'WAV 文件较大，可能存在兼容性问题',
    command: 'ffmpeg -i input.wav -codec:a libmp3lame -b:a 192k output.mp3',
  },
  flac: {
    recommended: 'mp3',
    reason: 'FLAC 是无损格式，文件较大',
    command: 'ffmpeg -i input.flac -codec:a libmp3lame -b:a 192k output.mp3',
  },
  ape: {
    recommended: 'mp3',
    reason: 'APE 格式兼容性较差',
    command: 'ffmpeg -i input.ape -codec:a libmp3lame -b:a 192k output.mp3',
  },
  wma: {
    recommended: 'mp3',
    reason: 'WMA 格式兼容性有限',
    command: 'ffmpeg -i input.wma -codec:a libmp3lame -b:a 192k output.mp3',
  },
} as const

/**
 * 获取音频格式转换建议
 */
export function getAudioFormatRecommendation(filename: string): {
  needsConversion: boolean
  recommendation?: string
  reason?: string
  command?: string
} {
  const extension = filename.toLowerCase().split('.').pop() || ''

  if (extension in AUDIO_FORMAT_RECOMMENDATIONS) {
    const rec = AUDIO_FORMAT_RECOMMENDATIONS[extension as keyof typeof AUDIO_FORMAT_RECOMMENDATIONS]
    return {
      needsConversion: true,
      recommendation: rec.recommended,
      reason: rec.reason,
      command: rec.command,
    }
  }

  // MP3, AAC, M4A 等格式无需转换
  const goodFormats = ['mp3', 'aac', 'm4a', 'opus']
  if (goodFormats.includes(extension)) {
    return {
      needsConversion: false,
    }
  }

  return {
    needsConversion: false,
  }
}

/**
 * 解析火山引擎错误代码并提供友好提示
 */
export function parseVolcengineError(errorCode: string | number, errorMessage?: string): {
  userMessage: string
  technicalDetails: string
  suggestions: string[]
} {
  const code = String(errorCode)

  switch (code) {
    case '19020005':
      return {
        userMessage: '视频处理失败',
        technicalDetails: 'VEdit 服务内部错误',
        suggestions: [
          '检查输入文件格式是否正确（建议视频使用 MP4，音频使用 MP3）',
          '确认输入顺序：第一个是视频文件，第二个是音频文件',
          '尝试使用官方文档的原始 prompt："将输入视频和音频合成到一起"',
          '检查文件是否已上传完成并处理完毕',
          '使用 getMediaInfos 检查两个 Vid 的文件类型',
        ],
      }

    case '21020004':
      return {
        userMessage: 'VEdit 数据验证失败',
        technicalDetails: errorMessage || 'Track 配置验证不通过',
        suggestions: [
          '当前 prompt 可能不适合 VCreative 处理',
          '建议使用官方文档的标准 prompt："将输入视频和音频合成到一起"',
          '检查两个 Vid 是否都是有效的媒体文件',
          '确认第一个是视频文件，第二个是音频文件',
          '考虑使用其他方式进行音视频合并',
        ],
      }

    case '19020001':
      return {
        userMessage: '输入参数错误',
        technicalDetails: '提供的参数不符合要求',
        suggestions: [
          '检查所有必需参数是否提供',
          '确认参数格式是否正确',
          '查看 API 文档确认参数要求',
        ],
      }

    case '19020002':
      return {
        userMessage: '视频文件不存在或无法访问',
        technicalDetails: '指定的 Vid 不存在或已被删除',
        suggestions: [
          '确认视频文件已成功上传',
          '检查 Vid 是否正确',
          '等待文件处理完成后再提交任务',
        ],
      }

    default:
      return {
        userMessage: '处理失败',
        technicalDetails: errorMessage || `错误代码: ${code}`,
        suggestions: [
          '查看详细错误信息',
          '检查输入文件和参数',
          '如问题持续，请联系技术支持',
        ],
      }
  }
}
