import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { MediaGroupRepository, MediaType } from '@yikart/mongodb'

@Injectable()
export class MediaGroupService {
  constructor(private readonly mediaGroupRepository: MediaGroupRepository) { }
  async create(
    userId: string,
    inData: { title: string, type: MediaType, desc?: string },
  ) {
    const res = await this.mediaGroupRepository.create({
      userId,
      ...inData,
    })
    return res
  }

  async del(id: string): Promise<boolean> {
    const res = await this.mediaGroupRepository.delete(id)
    return !!res
  }

  async updateInfo(
    id: string,
    newData: { title?: string, desc?: string },
  ) {
    const res = await this.mediaGroupRepository.update(id, newData)
    return res
  }

  async getInfo(id: string) {
    const res = await this.mediaGroupRepository.getInfo(id)
    return res
  }

  async getList(
    page: TableDto,
    filter: {
      userId: string
      title?: string
      type?: MediaType
    },
  ) {
    const res = await this.mediaGroupRepository.getList(filter, page)
    return res
  }
}
