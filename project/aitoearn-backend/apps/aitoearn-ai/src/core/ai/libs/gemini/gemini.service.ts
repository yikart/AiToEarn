import {
  GenerateContentParameters,
  GenerateContentResponse,
  GoogleGenAI,
  MediaModality,
  Modality,
  ModalityTokenCount,
} from '@google/genai'
import { Injectable, Logger } from '@nestjs/common'
import { AiAvailabilityService } from '../../../ai-availability'
import { GeminiConfig } from './gemini.config'
import {
  GeminiGeneratedImage,
  GeminiImageGenerateRequest,
  GeminiImageGenerateResponse,
  GeminiImageSize,
  GeminiImageUsage,
  GeminiModalityTokenDetails,
} from './gemini.interface'

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name)
  private readonly genAiClient: GoogleGenAI

  constructor(
    private readonly config: GeminiConfig,
    private readonly aiAvailability: AiAvailabilityService,
  ) {
    const baseUrl = config.proxyUrl
      ? `${config.proxyUrl}/${config.baseUrl}`
      : config.baseUrl

    this.genAiClient = new GoogleGenAI({
      apiKey: config.apiKey,
      httpOptions: { baseUrl },
    })
  }

  private async withAvailability<T>(operation: string, fn: () => Promise<T>, model?: string): Promise<T> {
    return this.aiAvailability.execute(
      { provider: 'gemini', operation, model },
      fn,
    )
  }

  async generateImage(request: GeminiImageGenerateRequest): Promise<GeminiImageGenerateResponse> {
    const model = request.model || 'gemini-3.1-flash-image-preview'
    return this.withAvailability('generateImage', async () => {
      const { prompt, imageUrls = [], imageSize, aspectRatio } = request

      this.logger.debug({ prompt, imageUrlsCount: imageUrls.length, imageSize, aspectRatio }, 'Starting image generation')

      const parts: Array<{ text: string } | { inlineData: { mimeType: string, data: string } }> = []

      for (const url of imageUrls) {
        const imageData = await this.fetchImageAsBase64(url)
        parts.push({
          inlineData: {
            mimeType: imageData.mimeType,
            data: imageData.base64,
          },
        })
      }

      parts.push({ text: prompt })

      const response = await this.genAiClient.models.generateContent({
        model,
        contents: [{ role: 'user', parts }],
        config: {
          responseModalities: [Modality.IMAGE],
          imageConfig: {
            ...(imageSize && { imageSize }),
            ...(aspectRatio && { aspectRatio }),
          },
        },
      })

      const images: GeminiGeneratedImage[] = []

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if ('inlineData' in part && part.inlineData) {
            images.push({
              imageData: Buffer.from(part.inlineData.data!, 'base64'),
              mimeType: part.inlineData.mimeType || 'image/png',
            })
          }
        }
      }

      if (images.length === 0) {
        this.logger.error('No image generated from Gemini API')
        throw new Error('No image generated')
      }

      const usage: GeminiImageUsage | undefined = response.usageMetadata
        ? {
            promptTokenCount: response.usageMetadata.promptTokenCount || 0,
            candidatesTokenCount: response.usageMetadata.candidatesTokenCount || 0,
            totalTokenCount: response.usageMetadata.totalTokenCount || 0,
            inputTokenDetails: this.extractGeminiModalityTokenDetails(response.usageMetadata['promptTokensDetails'] || []),
            outputTokenDetails: this.extractGeminiModalityTokenDetails(response.usageMetadata['candidatesTokensDetails'] || []),
          }
        : undefined

      this.logger.debug({
        imageCount: images.length,
        totalSize: images.reduce((sum, img) => sum + img.imageData.length, 0),
        usage,
      }, 'Image generation completed')

      if (usage && images.length > 0 && (!usage.outputTokenDetails || !usage.outputTokenDetails.image)) {
        const imageTokens = this.calculateImageTokens(model, imageSize)
        if (imageTokens > 0) {
          const totalImageTokens = imageTokens * images.length
          usage.outputTokenDetails = {
            ...usage.outputTokenDetails,
            image: (usage.outputTokenDetails?.image || 0) + totalImageTokens,
          }
          usage.candidatesTokenCount += totalImageTokens
          usage.totalTokenCount += totalImageTokens
          this.logger.debug({ model, imageSize, imageCount: images.length, totalImageTokens }, 'Manually calculated image tokens')
        }
      }

      return { images, usage }
    }, model)
  }

  private calculateImageTokens(model: string, size?: GeminiImageSize): number {
    if (model.includes('gemini-3.1-flash')) {
      switch (size) {
        case '0.5K':
          return 747
        case '1K':
          return 1120
        case '2K':
          return 1680
        case '4K':
          return 2520
        default:
          return 1120 // Default to 1K
      }
    }
    else if (model.includes('gemini-3-pro')) {
      switch (size) {
        case '4K':
          return 2000
        case '1K':
        case '2K':
        default:
          return 1120 // 1K to 2K
      }
    }
    return 0
  }

  private extractGeminiModalityTokenDetails(details: ModalityTokenCount[]): GeminiModalityTokenDetails | undefined {
    const result: GeminiModalityTokenDetails = {}

    for (const detail of details) {
      if (typeof detail !== 'object' || detail == null) {
        continue
      }

      const detailRecord = detail
      const rawModality = detailRecord.modality
      const rawTokenCount = detailRecord.tokenCount

      if (typeof rawModality !== 'string') {
        continue
      }

      const modality = rawModality.toLowerCase()
      const tokenCount = typeof rawTokenCount === 'number' ? rawTokenCount : 0

      if (tokenCount <= 0) {
        continue
      }

      if (modality === MediaModality.TEXT) {
        result.text = (result.text || 0) + tokenCount
      }
      else if (modality === MediaModality.IMAGE) {
        result.image = (result.image || 0) + tokenCount
      }
      else if (modality === MediaModality.AUDIO) {
        result.audio = (result.audio || 0) + tokenCount
      }
      else if (modality === MediaModality.VIDEO) {
        result.video = (result.video || 0) + tokenCount
      }
    }

    return Object.keys(result).length > 0 ? result : undefined
  }

  private async fetchImageAsBase64(url: string): Promise<{ base64: string, mimeType: string }> {
    this.logger.debug({ url }, 'Fetching image as base64')
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
    }
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const buffer = Buffer.from(await response.arrayBuffer())
    return {
      base64: buffer.toString('base64'),
      mimeType: contentType,
    }
  }

  async generateContent(params: GenerateContentParameters): Promise<GenerateContentResponse> {
    return this.withAvailability('generateContent', async () => {
      return await this.genAiClient.models.generateContent(params)
    }, params.model)
  }

  async generateContentStream(params: GenerateContentParameters): Promise<AsyncGenerator<GenerateContentResponse>> {
    return await this.genAiClient.models.generateContentStream(params)
  }
}
