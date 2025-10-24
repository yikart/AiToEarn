import { Injectable, Logger } from '@nestjs/common'
import { AxiosRequestConfig } from 'axios'
import { InternalApi } from '../api'

@Injectable()
export class ContentInternalApi extends InternalApi {
  override logger = new Logger(ContentInternalApi.name)

  constructor() {
    super()
  }

  async delMaterial(id: string) {
    const url = `/internal/publishing/materials/${id}`
    const config: AxiosRequestConfig = {
      method: 'DELETE',
    }
    const res = await this.request<boolean>(
      url,
      config,
    )
    return res
  }
}
