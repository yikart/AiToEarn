import { Injectable, Logger } from '@nestjs/common'
import { UserType } from '@yikart/common'
import { AiApi } from '../../transports/ai/ai.api'
import { ImageGenerationRequest, VideoGenerationCommonRequest } from '../../transports/ai/ai.interface'
import { VideoTaskStatusResponseVo } from './common'
import { AiModelsConfigDto, ChatModelsQueryDto, UserFireflyCardDto, UserListVideoTasksQueryDto, UserVideoTaskQueryDto, VideoGenerationModelsQueryDto } from './dto'

@Injectable()
export class AiService {
  logger = new Logger(AiService.name)
  constructor(
    private readonly aiApi: AiApi,
  ) { }

  /**
   * 用户图片生成
   * @param request 图片生成请求参数
   * @returns 图片生成响应
   */
  async userImageGeneration(request: ImageGenerationRequest) {
    return await this.aiApi.userImageGeneration(request)
  }

  async userVideoGeneration(request: VideoGenerationCommonRequest) {
    return await this.aiApi.userVideoGeneration(request)
  }

  /**
   * 查询视频任务状态
   * @param request 视频任务查询请求参数
   * @returns 视频任务状态响应
   */
  async getVideoTaskStatus(request: UserVideoTaskQueryDto): Promise<VideoTaskStatusResponseVo> {
    const res = await this.aiApi.getVideoTaskStatus(request)
    return res
  }

  /**
   * 查询视频任务状态
   * @param request 视频任务查询请求参数
   * @returns 视频任务状态响应
   */
  async listVideoTasks(request: UserListVideoTasksQueryDto & {
    userId: string
    userType: UserType
  }) {
    return await this.aiApi.listVideoTasks(request)
  }

  /**
   * Fireflycard生成卡片图片
   * @param request Fireflycard请求参数
   * @returns Fireflycard生成结果
   */
  async generateFireflycard(request: UserFireflyCardDto & {
    userId: string
    userType: UserType
  }) {
    return await this.aiApi.fireflyCard(request)
  }

  /**
   * 获取视频生成模型参数
   * @param data 查询参数
   * @returns 视频生成模型参数列表
   */
  async getVideoGenerationModels(data: VideoGenerationModelsQueryDto) {
    return await this.aiApi.getVideoGenerationModels(data)
  }

  /**
   * 获取对话模型参数
   * @param data 查询参数
   * @returns 对话模型参数列表
   */
  async getChatModels(data: ChatModelsQueryDto) {
    return await this.aiApi.getChatModels(data)
  }

  /**
   * TODO: 保存模型配置
   * @param config 模型配置
   * @returns 保存结果
   */
  async saveModelsConfig(config: AiModelsConfigDto) {
    this.logger.log(`保存模型配置: ${JSON.stringify(config)}`)
    // return await this.aiClient.saveModelsConfig(config)
  }

  async getModelsConfig() {
    // return await this.aiClient.getModelsConfig()
  }
}
