import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { config } from '../../config'
import { PubRecordListFilterDto } from '../dto/publish.dto'

@Injectable()
export class PublishTaskNatsApi {
  constructor(
    private readonly httpService: HttpService,
  ) { }

  async getPublishTaskList(userId: string, query: PubRecordListFilterDto) {
    const res = await this.httpService.axiosRef.post<any[]>(
      `${config.channel.baseUrl}/channel/publishTask/list`,
      { userId, ...query },
    )
    return res.data
  }
}
