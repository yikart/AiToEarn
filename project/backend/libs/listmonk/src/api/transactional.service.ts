import { Injectable } from '@nestjs/common'
import { TransactionalMessage } from '../interfaces'
import { BaseService } from './base.service'

@Injectable()
export class TransactionalService extends BaseService {
  async sendTransactionalMessage(data: TransactionalMessage): Promise<boolean> {
    return this.request<boolean>(
      '/api/tx',
      {
        method: 'POST',
        data,
      },
    )
  }
}
