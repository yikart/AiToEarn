import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, UserType } from '@yikart/common'
import { ChatModelConfigVo, ChatService } from '../chat'
import { ImageEditModelParamsVo, ImageGenerationModelParamsVo, ImageService } from '../image'
import { VideoGenerationModelParamsVo, VideoService } from '../video'

@ApiTags('OpenSource/Me/Ai')
@Controller('ai')
export class ModelsConfigController {
  constructor(
    private readonly chatService: ChatService,
    private readonly imageService: ImageService,
    private readonly videoService: VideoService,
  ) {}

  @ApiDoc({
    summary: 'Get Image Generation Model Parameters',
    response: [ImageGenerationModelParamsVo],
  })
  @Public()
  @Get('/models/image/generation')
  async getImageGenerationModels(@GetToken() token?: TokenInfo): Promise<ImageGenerationModelParamsVo[]> {
    const response = await this.imageService.generationModelConfig({
      userId: token?.id,
      userType: UserType.User,
    })
    return response.map((item: { name: string, description: string, sizes: string[], qualities: string[], styles: string[], pricing: string, summary?: string | undefined, logo?: string | undefined, tags?: string[] | undefined, mainTag?: string | undefined, discount?: string | undefined, originPrice?: string | undefined }) => ImageGenerationModelParamsVo.create(item))
  }

  @ApiDoc({
    summary: 'Get Image Editing Model Parameters',
    response: [ImageEditModelParamsVo],
  })
  @Public()
  @Get('/models/image/edit')
  async getImageEditModels(@GetToken() token?: TokenInfo): Promise<ImageEditModelParamsVo[]> {
    const response = await this.imageService.editModelConfig({
      userId: token?.id,
      userType: UserType.User,
    })
    return response.map((item: { name: string, description: string, sizes: string[], pricing: string, maxInputImages: number, summary?: string | undefined, logo?: string | undefined, tags?: string[] | undefined, mainTag?: string | undefined, discount?: string | undefined, originPrice?: string | undefined }) => ImageEditModelParamsVo.create(item))
  }

  @ApiDoc({
    summary: 'Get Video Generation Model Parameters',
    response: [VideoGenerationModelParamsVo],
  })
  @Public()
  @Get('/models/video/generation')
  async getVideoGenerationModels(@GetToken() token?: TokenInfo): Promise<VideoGenerationModelParamsVo[]> {
    const response = await this.videoService.getVideoGenerationModelParams({
      userId: token?.id,
      userType: UserType.User,
    })
    return response.map((item: { name: string, description: string, modes: ('text2video' | 'image2video' | 'flf2video' | 'lf2video' | 'multi-image2video')[], channel: any, resolutions: string[], durations: number[], supportedParameters: string[], pricing: { price: number, resolution?: string | undefined, aspectRatio?: string | undefined, mode?: string | undefined, duration?: number | undefined, discount?: string | undefined, originPrice?: number | undefined }[], summary?: string | undefined, logo?: string | undefined, tags?: string[] | undefined, mainTag?: string | undefined, defaults?: { resolution?: string | undefined, aspectRatio?: string | undefined, mode?: string | undefined, duration?: number | undefined } | undefined }) => VideoGenerationModelParamsVo.create(item))
  }

  @ApiDoc({
    summary: 'Get Chat Model Parameters',
    response: [ChatModelConfigVo],
  })
  @Public()
  @Get('/models/chat')
  async getChatModels(@GetToken() token?: TokenInfo): Promise<ChatModelConfigVo[]> {
    const response = await this.chatService.getChatModelConfig({
      userId: token?.id,
      userType: UserType.User,
    })
    return response.map((item: { name: string, description: string, inputModalities: ('image' | 'text' | 'video' | 'audio')[], outputModalities: ('image' | 'text' | 'video' | 'audio')[], pricing: { prompt: string, completion: string, discount?: string | undefined, originPrompt?: string | undefined, originCompletion?: string | undefined, image?: string | undefined, originImage?: string | undefined, audio?: string | undefined, originAudio?: string | undefined } | { price: string, discount?: string | undefined, originPrice?: string | undefined }, summary?: string | undefined, logo?: string | undefined, tags?: string[] | undefined, mainTag?: string | undefined }) => ChatModelConfigVo.create(item))
  }
}
