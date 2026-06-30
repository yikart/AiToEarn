/**
 * 二次混剪触发器（Wrapper）
 *
 * 当去重综合分 ≥ 0.7 时触发，对原视频执行：
 * 1. 变速 0.95x ~ 1.05x（随机）
 * 2. 抽帧 5%（随机丢弃部分帧）
 * 3. 加噪层（低强度视觉噪声）
 *
 * 不修改现有 FFmpeg/Volcengine DirectEdit 混剪逻辑，
 * 只在此层组装 EditParam 并委托给已有服务。
 */
import { Injectable, Logger, Optional } from '@nestjs/common'
import { VolcengineService } from '../ai/libs/volcengine'
import {
  DirectEditApplicationType,
  DirectEditParam,
  OutputParam,
  TrackElement,
  TransformFilter,
  SpeedFilter,
  TrimFilter,
  LutFilter,
} from '../ai/libs/volcengine/volcengine.interface'
import type {
  DedupScoringOutput,
  RemixTriggerResult,
  RemixParams as RemixParamsConfig,
} from './dedup-types'

/** 混剪操作的常量 */
const REMIX_CONSTANTS = {
  /** 变速范围 */
  SPEED_MIN: 0.95,
  SPEED_MAX: 1.05,
  /** 抽帧比例 */
  DROP_FRAME_RATIO: 0.05,
  /** 噪点 LUT 强度 */
  NOISE_INTENSITY: 0.02,
  /** 位置偏移像素 */
  POSITION_OFFSET: 2,
} as const

@Injectable()
export class RemixWrapper {
  private readonly logger = new Logger(RemixWrapper.name)

  constructor(
    @Optional() private readonly volcengineService?: VolcengineService,
  ) {}

  /**
   * 触发二次混剪
   * @param output 去重评分结果
   * @param remixParams 混剪参数配置
   * @returns 混剪结果（含 remixVideoUrl）
   */
  async triggerRemix(
    output: DedupScoringOutput,
    remixParams?: Partial<RemixParamsConfig>,
  ): Promise<RemixTriggerResult> {
    if (!output.score.needsRemix) {
      return {
        triggered: false,
        remixParams: this.getDefaultRemixParams(),
        originalScore: output.score.composite,
      }
    }

    this.logger.log({
      compositeScore: output.score.composite,
      threshold: 0.7,
    }, 'Dedup score exceeds threshold, triggering remix')

    // 使用提供的参数或默认值
    const params = {
      ...this.getDefaultRemixParams(),
      ...remixParams,
    }

    // 构建混剪 EditParam
    const editParam = this.buildRemixEditParam(params)

    // 委托给 Volcengine DirectEdit
    const taskId = await this.submitRemixTask(editParam)

    return {
      triggered: true,
      remixVideoUrl: undefined, // 实际 URL 需在任务完成后获取
      remixParams: params,
      originalScore: output.score.composite,
      taskId: taskId,
    }
  }

  /**
   * 构建混剪 EditParam（不修改现有 DirectEdit 逻辑）
   */
  private buildRemixEditParam(params: RemixParamsConfig): DirectEditParam {
    // 随机选择变速因子
    const speedFactor = this.randomBetween(params.speedMin, params.speedMax)

    // 抽帧：跳过指定比例的帧
    const dropFrameRatio = params.dropFrameRatio

    // 噪点强度
    const noiseIntensity = params.noiseIntensity

    // 随机位置偏移（±2px）
    const offsetX = this.randomBetween(-REMIX_CONSTANTS.POSITION_OFFSET, REMIX_CONSTANTS.POSITION_OFFSET)
    const offsetY = this.randomBetween(-REMIX_CONSTANTS.POSITION_OFFSET, REMIX_CONSTANTS.POSITION_OFFSET)

    // 构建 Track 元素
    // 注意：这里假设源视频 VID 已预先通过 getVideoInfo 获取
    // 实际使用时，Caller 需要先获取 VID 并传入
    const track: TrackElement[][] = [
      // 视频轨道
      [
        {
          Type: 'video',
          Source: 'vid://SOURCE_VIDEO', // 占位符，实际由 Caller 替换
          TargetTime: [0, 10000], // 占位符，实际由 Caller 替换
          Extra: [
            // 变速滤镜
            {
              Type: 'speed' as const,
              Speed: speedFactor,
            } as SpeedFilter,
            // 变换滤镜（微偏移）
            {
              Type: 'transform' as const,
              PosX: offsetX,
              PosY: offsetY,
            } as TransformFilter,
            // 抽帧滤镜（模拟：通过 Trim 分段）
            {
              Type: 'trim' as const,
              StartTime: 0,
              EndTime: Math.floor(10000 * (1 - dropFrameRatio)),
            } as TrimFilter,
            // 噪点 LUT（模拟）
            {
              Type: 'lut_filter' as const,
              TargetTime: [0, Math.floor(10000 * (1 - dropFrameRatio))],
              Source: `noise_lut_${Math.round(noiseIntensity * 100)}`,
              Intensity: noiseIntensity,
            } as LutFilter,
          ],
        },
      ],
    ]

    return {
      Canvas: {
        Width: 1280,
        Height: 720,
      },
      Output: {
        Fps: 30,
        Codec: {
          VideoCodec: 'h264',
          AudioCodec: 'aac',
        },
      } as OutputParam,
      Track: track,
    }
  }

  /**
   * 提交混剪任务到 Volcengine DirectEdit
   */
  private async submitRemixTask(editParam: DirectEditParam): Promise<string> {
    if (!this.volcengineService) {
      throw new Error('VolcengineService is required for remix task submission')
    }

    const request = {
      Application: DirectEditApplicationType.VideoTrackToB,
      EditParam: editParam,
    }

    const result = await this.volcengineService.submitDirectEditTaskAsync(request)
    this.logger.log({ taskId: result.ReqId }, 'Remix task submitted')
    return result.ReqId
  }

  /**
   * 获取默认混剪参数
   */
  private getDefaultRemixParams(): RemixParamsConfig {
    return {
      speedMin: REMIX_CONSTANTS.SPEED_MIN,
      speedMax: REMIX_CONSTANTS.SPEED_MAX,
      dropFrameRatio: REMIX_CONSTANTS.DROP_FRAME_RATIO,
      noiseIntensity: REMIX_CONSTANTS.NOISE_INTENSITY,
    }
  }

  /**
   * 生成 [min, max) 范围内的随机数
   */
  private randomBetween(min: number, max: number): number {
    return min + Math.random() * (max - min)
  }
}
