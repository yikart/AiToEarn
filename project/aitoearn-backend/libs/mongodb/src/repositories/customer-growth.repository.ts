import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import {
  CustomerRadarWorkspace,
  GlobalKnowledge,
  SystemSetting,
} from '../schemas/customer-growth.schema'
import { BaseRepository, LeanDoc } from './base.repository'

export type UpsertGlobalKnowledgeData = Pick<
  GlobalKnowledge,
  'category' | 'enabled' | 'replyUse' | 'scope' | 'summary' | 'tags' | 'title'
>

export type UpsertCustomerRadarWorkspaceData = Pick<
  CustomerRadarWorkspace,
  | 'automationRun'
  | 'automationTasks'
  | 'customerRecords'
  | 'executionLogs'
  | 'leads'
  | 'liveExecutionEnabled'
  | 'ownedPostWorkId'
  | 'ownedPostPlatform'
  | 'ownedPostXsecToken'
  | 'platformCapabilities'
  | 'profile'
  | 'replyCandidates'
  | 'socialAccounts'
  | 'taskRuns'
>

@Injectable()
export class GlobalKnowledgeRepository extends BaseRepository<GlobalKnowledge> {
  constructor(
    @InjectModel(GlobalKnowledge.name)
    private readonly globalKnowledgeModel: Model<GlobalKnowledge>,
  ) {
    super(globalKnowledgeModel)
  }

  async listByUserId(userId: string): Promise<LeanDoc<GlobalKnowledge>[]> {
    return await this.globalKnowledgeModel
      .find({ userId })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean({ virtuals: true })
      .exec() as LeanDoc<GlobalKnowledge>[]
  }

  async createForUser(userId: string, data: UpsertGlobalKnowledgeData): Promise<LeanDoc<GlobalKnowledge>> {
    return await this.create({ userId, ...data })
  }

  async updateForUser(
    userId: string,
    id: string,
    data: Partial<UpsertGlobalKnowledgeData>,
  ): Promise<LeanDoc<GlobalKnowledge> | null> {
    return await this.updateOne({ _id: id, userId }, { $set: data })
  }

  async deleteForUser(userId: string, id: string): Promise<boolean> {
    const result = await this.globalKnowledgeModel.deleteOne({ _id: id, userId }).exec()
    return result.deletedCount > 0
  }
}

@Injectable()
export class CustomerRadarWorkspaceRepository extends BaseRepository<CustomerRadarWorkspace> {
  constructor(
    @InjectModel(CustomerRadarWorkspace.name)
    private readonly customerRadarWorkspaceModel: Model<CustomerRadarWorkspace>,
  ) {
    super(customerRadarWorkspaceModel)
  }

  async getByUserId(userId: string): Promise<LeanDoc<CustomerRadarWorkspace> | null> {
    return await this.customerRadarWorkspaceModel
      .findOne({ userId })
      .lean({ virtuals: true })
      .exec() as LeanDoc<CustomerRadarWorkspace> | null
  }

  async listAllWorkspaces(): Promise<LeanDoc<CustomerRadarWorkspace>[]> {
    return await this.customerRadarWorkspaceModel
      .find({})
      .sort({ updatedAt: -1 })
      .lean({ virtuals: true })
      .exec() as LeanDoc<CustomerRadarWorkspace>[]
  }

  async upsertForUser(
    userId: string,
    data: UpsertCustomerRadarWorkspaceData,
  ): Promise<LeanDoc<CustomerRadarWorkspace> | null> {
    return await this.customerRadarWorkspaceModel
      .findOneAndUpdate(
        { userId },
        { $set: { ...data, userId } },
        { new: true, setDefaultsOnInsert: true, upsert: true },
      )
      .lean({ virtuals: true })
      .exec() as LeanDoc<CustomerRadarWorkspace> | null
  }
}

@Injectable()
export class SystemSettingRepository extends BaseRepository<SystemSetting> {
  constructor(
    @InjectModel(SystemSetting.name)
    private readonly systemSettingModel: Model<SystemSetting>,
  ) {
    super(systemSettingModel)
  }

  async getByKey(key: string): Promise<LeanDoc<SystemSetting> | null> {
    return await this.systemSettingModel
      .findOne({ key })
      .lean({ virtuals: true })
      .exec() as LeanDoc<SystemSetting> | null
  }

  async upsertByKey(
    key: string,
    value: Record<string, unknown>,
    updatedBy: string,
  ): Promise<LeanDoc<SystemSetting> | null> {
    return await this.systemSettingModel
      .findOneAndUpdate(
        { key },
        { $set: { key, updatedBy, value } },
        { new: true, setDefaultsOnInsert: true, upsert: true },
      )
      .lean({ virtuals: true })
      .exec() as LeanDoc<SystemSetting> | null
  }
}
