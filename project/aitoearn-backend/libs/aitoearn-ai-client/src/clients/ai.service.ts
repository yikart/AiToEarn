import { Injectable } from '@nestjs/common'
import { AxiosRequestConfig } from 'axios'
import {
  CreateDraftGenerationResponse,
  CreateDraftV2Request,
  CreateImageTextDraftRequest,
  DraftGenerationTaskResponse,
  GetDraftTaskRequest,
} from '../interfaces'
import { BaseService } from './base.service'

@Injectable()
export class AiService extends BaseService {
  async createDraftV2(data: CreateDraftV2Request): Promise<CreateDraftGenerationResponse> {
    const url = `/internal/ai/draft-generation/v2`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data,
    }
    return this.request<CreateDraftGenerationResponse>(url, config)
  }

  async createImageTextDraft(data: CreateImageTextDraftRequest): Promise<CreateDraftGenerationResponse> {
    const url = `/internal/ai/draft-generation/image-text`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data,
    }
    return this.request<CreateDraftGenerationResponse>(url, config)
  }

  async getDraftTask(data: GetDraftTaskRequest): Promise<DraftGenerationTaskResponse> {
    const url = `/internal/ai/draft-generation/task`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data,
    }
    return this.request<DraftGenerationTaskResponse>(url, config)
  }
}
