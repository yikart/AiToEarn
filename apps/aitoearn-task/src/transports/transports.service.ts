import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'

@Injectable()
export class TransportsService {
  private readonly httpService: HttpService
  protected async aitoearnServerRequest<T>(method: 'get' | 'post', url: string, data?: unknown) {
    const res = await this.httpService.axiosRef.request<T>({
      method,
      url,
      data: data || {},
    })
    return res.data
  }
}
