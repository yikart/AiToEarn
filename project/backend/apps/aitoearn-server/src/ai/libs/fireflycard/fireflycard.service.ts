import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { FireflycardConfig } from './fireflycard.config'

export enum FireflycardTempTypes {
  A = 'tempA', // 默认
  B = 'tempB', // 书摘
  C = 'tempC', // 透明
  Jin = 'tempJin', // 金句
  Memo = 'tempMemo', // 备忘录
  Easy = 'tempEasy', // 便当
  BlackSun = 'tempBlackSun', // 黑日
  E = 'tempE', // 框界
  Write = 'tempWrite', // 手写
  Code = 'code', // 代码
  D = 'tempD', // 图片(暂时不用)
}

export interface FireflycardOptions {
  content: string
  temp: FireflycardTempTypes
  title?: string
  style?: {
    align?: string
    backgroundName?: string
    backShadow?: string
    font?: string
    width?: number
    ratio?: string
    height?: number
    fontScale?: number
    padding?: string
    borderRadius?: string
    color?: string
    opacity?: number
    blur?: number
    backgroundAngle?: string
    lineHeights?: {
      content?: string
    }
    letterSpacings?: {
      content?: string
    }
  }
  switchConfig?: {
    showIcon?: boolean
    showDate?: boolean
    showTitle?: boolean
    showContent?: boolean
    showAuthor?: boolean
    showTextCount?: boolean
    showQRCode?: boolean
    showPageNum?: boolean
    showWatermark?: boolean
  }
}

@Injectable()
export class FireflycardService {
  private readonly logger = new Logger(FireflycardService.name)

  constructor(private readonly config: FireflycardConfig) {}

  /**
   * 生成流光卡片图片
   */
  async createImage(options: FireflycardOptions): Promise<Response> {
    const { content, temp, title = '' } = options

    const defaultStyle = {
      align: 'left',
      backgroundName: 'vertical-blue-color-29',
      backShadow: '',
      font: 'Alibaba-PuHuiTi-Regular',
      width: 440,
      ratio: '',
      height: 0,
      fontScale: 1,
      padding: '30px',
      borderRadius: '15px',
      color: '#000000',
      opacity: 1,
      blur: 0,
      backgroundAngle: '0deg',
      lineHeights: {
        content: '',
      },
      letterSpacings: {
        content: '',
      },
    }

    const defaultSwitchConfig = {
      showIcon: false,
      showDate: true,
      showTitle: !!title,
      showContent: true,
      showAuthor: false,
      showTextCount: false,
      showQRCode: false,
      showPageNum: false,
      showWatermark: false,
    }

    const body = {
      form: {
        title,
        content,
        pagination: '01',
      },
      style: { ...defaultStyle, ...options.style },
      switchConfig: { ...defaultSwitchConfig, ...options.switchConfig },
      temp,
      language: 'zh',
    }

    const response = await fetch(this.config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new AppException(ResponseCode.AiCallFailed, { error: `HTTP ${response.status}: ${errorText}` })
    }

    return response
  }
}
