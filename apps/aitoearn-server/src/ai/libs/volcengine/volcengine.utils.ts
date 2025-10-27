// 导入类型定义
import type { Ratio, Resolution } from './volcengine.interface'

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
