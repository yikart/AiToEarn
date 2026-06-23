import { Injectable } from '@nestjs/common'
import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { AiAvailabilityService } from '../../../ai-availability'
import { MiniMaxConfig } from './minimax.config'
import {
  MiniMaxCreateVideoTaskRequest,
  MiniMaxCreateVideoTaskResponse,
  MiniMaxImageGenerationRequest,
  MiniMaxImageGenerationResponse,
  MiniMaxMusicGenerationRequest,
  MiniMaxMusicGenerationResponse,
  MiniMaxQueryVideoTaskResponse,
  MiniMaxRetrieveFileResponse,
  MiniMaxTextToSpeechRequest,
  MiniMaxTextToSpeechResponse,
} from './minimax.interface'

@Injectable()
export class MiniMaxService {
  private readonly httpClient: AxiosInstance

  constructor(
    private readonly config: MiniMaxConfig,
    private readonly aiAvailability: AiAvailabilityService,
  ) {
    this.httpClient = axios.create({
      baseURL: this.config.baseUrl.replace(/\/+$/, ''),
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    })
  }

  private assertSuccess(response: { base_resp?: { status_code?: number, status_msg?: string } }, fallback: string): void {
    const baseResp = response.base_resp
    if (baseResp && baseResp.status_code !== 0) {
      throw new Error(baseResp.status_msg || `${fallback} failed with status ${baseResp.status_code}`)
    }
  }

  async createImageGeneration(request: MiniMaxImageGenerationRequest): Promise<MiniMaxImageGenerationResponse> {
    return this.aiAvailability.execute(
      { provider: 'minimax', operation: 'imageGeneration', model: request.model },
      async () => {
        const response: AxiosResponse<MiniMaxImageGenerationResponse> = await this.httpClient.post(
          '/v1/image_generation',
          request,
        )
        this.assertSuccess(response.data, 'MiniMax image generation')
        return response.data
      },
    )
  }

  async createVideoTask(request: MiniMaxCreateVideoTaskRequest): Promise<MiniMaxCreateVideoTaskResponse> {
    return this.aiAvailability.execute(
      { provider: 'minimax', operation: 'createVideoTask', model: request.model },
      async () => {
        const response: AxiosResponse<MiniMaxCreateVideoTaskResponse> = await this.httpClient.post(
          '/v1/video_generation',
          request,
        )
        this.assertSuccess(response.data, 'MiniMax video task creation')
        return response.data
      },
    )
  }

  async getVideoTask(taskId: string): Promise<MiniMaxQueryVideoTaskResponse> {
    return this.aiAvailability.execute(
      { provider: 'minimax', operation: 'getVideoTask' },
      async () => {
        const response: AxiosResponse<MiniMaxQueryVideoTaskResponse> = await this.httpClient.get(
          '/v1/query/video_generation',
          { params: { task_id: taskId } },
        )
        this.assertSuccess(response.data, 'MiniMax video task query')
        return response.data
      },
    )
  }

  async retrieveFile(fileId: string): Promise<MiniMaxRetrieveFileResponse> {
    return this.aiAvailability.execute(
      { provider: 'minimax', operation: 'retrieveFile' },
      async () => {
        const response: AxiosResponse<MiniMaxRetrieveFileResponse> = await this.httpClient.get(
          '/v1/files/retrieve',
          { params: { file_id: fileId } },
        )
        this.assertSuccess(response.data, 'MiniMax file retrieve')
        return response.data
      },
    )
  }

  async textToSpeech(request: MiniMaxTextToSpeechRequest): Promise<MiniMaxTextToSpeechResponse> {
    return this.aiAvailability.execute(
      { provider: 'minimax', operation: 'textToSpeech', model: request.model },
      async () => {
        const response: AxiosResponse<MiniMaxTextToSpeechResponse> = await this.httpClient.post(
          '/v1/t2a_v2',
          request,
        )
        this.assertSuccess(response.data, 'MiniMax text to speech')
        return response.data
      },
    )
  }

  async generateMusic(request: MiniMaxMusicGenerationRequest): Promise<MiniMaxMusicGenerationResponse> {
    return this.aiAvailability.execute(
      { provider: 'minimax', operation: 'musicGeneration', model: request.model },
      async () => {
        const response: AxiosResponse<MiniMaxMusicGenerationResponse> = await this.httpClient.post(
          '/v1/music_generation',
          request,
        )
        this.assertSuccess(response.data, 'MiniMax music generation')
        return response.data
      },
    )
  }
}
