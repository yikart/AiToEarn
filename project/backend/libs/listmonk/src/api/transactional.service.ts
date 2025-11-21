import { Injectable } from '@nestjs/common'
import { TransactionalMessage } from '../interfaces'
import { BaseService } from './base.service'

@Injectable()
export class TransactionalService extends BaseService {
  async sendTransactionalMessage(data: TransactionalMessage): Promise<boolean> {
    const res = await this.request<boolean>(
      '/api/tx',
      {
        method: 'POST',
        data,
      },
    )
    return res
  }
}
