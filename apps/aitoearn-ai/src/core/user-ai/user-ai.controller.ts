import { NatsMessagePattern } from '@common/decorators'
import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { FireflycardGenerationDto, Md2CardGenerationDto, UserAiChatDto, UserImageEditDto, UserImageGenerationDto, UserImageVariationDto, UserLogsQueryDto, UserMJTaskStatusQueryDto, UserMJVideoGenerationDto, UserVideoGenerationRequestDto, UserVideoTaskQueryDto, VideoGenerationPriceQueryDto } from './user-ai.dto'
import { UserAiService } from './user-ai.service'
import { FireflycardResponseVo, Md2CardResponseVo, MjTaskFetchResponseVo, MjVideoSubmitResponseVo, UserAiChatResponseVo, UserImageResponseVo, UserLogsResponseVo, VideoGenerationResponseVo, VideoTaskStatusResponseVo } from './user-ai.vo'

@Controller()
export class UserAiController {
  constructor(
    private readonly userAiService: UserAiService,
  ) {}

  @NatsMessagePattern('ai.user.chat')
  async userAiChat(@Payload() data: UserAiChatDto): Promise<UserAiChatResponseVo> {
    const response = await this.userAiService.userAiChat(data)
    return UserAiChatResponseVo.create(response)
  }

  @NatsMessagePattern('ai.user.logs')
  async getUserLogs(@Payload() data: UserLogsQueryDto): Promise<UserLogsResponseVo> {
    const response = await this.userAiService.getUserLogs(data)
    return UserLogsResponseVo.create(response)
  }

  @NatsMessagePattern('ai.user.image.generations')
  async userImageGeneration(@Payload() data: UserImageGenerationDto): Promise<UserImageResponseVo> {
    const response = await this.userAiService.userImageGeneration(data)
    return UserImageResponseVo.create(response)
  }

  @NatsMessagePattern('ai.user.image.edits')
  async userImageEdit(@Payload() data: UserImageEditDto): Promise<UserImageResponseVo> {
    const response = await this.userAiService.userImageEdit(data)
    return UserImageResponseVo.create(response)
  }

  @NatsMessagePattern('ai.user.image.variations')
  async userImageVariation(@Payload() data: UserImageVariationDto): Promise<UserImageResponseVo> {
    const response = await this.userAiService.userImageVariation(data)
    return UserImageResponseVo.create(response)
  }

  @NatsMessagePattern('ai.user.mj.submit.video')
  async userMjSubmitVideo(@Payload() data: UserMJVideoGenerationDto): Promise<MjVideoSubmitResponseVo> {
    const response = await this.userAiService.userMjSubmitVideo(data)
    return MjVideoSubmitResponseVo.create(response)
  }

  @NatsMessagePattern('ai.user.mj.task.fetch')
  async userMjTaskFetch(@Payload() data: UserMJTaskStatusQueryDto): Promise<MjTaskFetchResponseVo> {
    const response = await this.userAiService.userMjTaskFetch(data)
    return MjTaskFetchResponseVo.create(response)
  }

  @NatsMessagePattern('ai.user.video.generations')
  async userVideoGeneration(@Payload() data: UserVideoGenerationRequestDto): Promise<VideoGenerationResponseVo> {
    const response = await this.userAiService.userVideoGeneration(data)
    return VideoGenerationResponseVo.create(response)
  }

  @NatsMessagePattern('ai.user.video.generations.price')
  async getVideoGenerationPrice(@Payload() data: VideoGenerationPriceQueryDto) {
    return await this.userAiService.getVideoGenerationPrice(data)
  }

  @NatsMessagePattern('ai.user.video.task.query')
  async getVideoTaskStatus(@Payload() data: UserVideoTaskQueryDto): Promise<VideoTaskStatusResponseVo> {
    const response = await this.userAiService.getVideoTaskStatus(data)
    return VideoTaskStatusResponseVo.create(response)
  }

  @NatsMessagePattern('ai.user.md2card.generate')
  async generateMd2Card(@Payload() data: Md2CardGenerationDto): Promise<Md2CardResponseVo> {
    const response = await this.userAiService.generateMd2Card(data)
    return Md2CardResponseVo.create(response)
  }

  @NatsMessagePattern('ai.user.fireflycard.generate')
  async generateFireflycard(@Payload() data: FireflycardGenerationDto): Promise<FireflycardResponseVo> {
    const response = await this.userAiService.generateFireflycard(data)
    return FireflycardResponseVo.create(response)
  }
}
