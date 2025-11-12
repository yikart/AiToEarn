import { Injectable, Logger } from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import { Connection, Model } from 'mongoose'
import { TaskSettlementLog } from '../schemas'

@Injectable()
export class SettlementLogRepository {
  private readonly logger = new Logger(SettlementLogRepository.name)

  constructor(
    @InjectConnection('statistics-db-connection') private readonly connection: Connection,
  ) {}

  private getModel(): Model<TaskSettlementLog> {
    return this.connection.model(TaskSettlementLog.name) as Model<TaskSettlementLog>
  }

  async createLog(doc: Partial<TaskSettlementLog>) {
    const model = this.getModel()
    const res = await model.create(doc)
    this.logger.debug(`TaskSettlementLog created: ${res.id}`)
    return res
  }
}
