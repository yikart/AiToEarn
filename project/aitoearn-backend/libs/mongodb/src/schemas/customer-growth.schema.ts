import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { DEFAULT_SCHEMA_OPTIONS } from '../mongodb.constants'
import { WithTimestampSchema } from './timestamp.schema'

export type CustomerRadarDocumentPayload = Record<string, unknown>

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'global_knowledge' })
export class GlobalKnowledge extends WithTimestampSchema {
  id: string

  @Prop({ required: true, index: true })
  userId: string

  @Prop({ required: true })
  title: string

  @Prop({ required: true, index: true })
  category: string

  @Prop({ required: true, index: true })
  scope: string

  @Prop({ required: true })
  summary: string

  @Prop({ required: true })
  replyUse: string

  @Prop({ required: true, default: true, index: true })
  enabled: boolean

  @Prop({ required: true, type: [String], default: [] })
  tags: string[]
}

export const GlobalKnowledgeSchema = SchemaFactory.createForClass(GlobalKnowledge)
GlobalKnowledgeSchema.index({ userId: 1, updatedAt: -1 })

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'customer_radar_workspace' })
export class CustomerRadarWorkspace extends WithTimestampSchema {
  id: string

  @Prop({ required: true, index: true, unique: true })
  userId: string

  @Prop({ required: true, type: Object, default: {} })
  profile: CustomerRadarDocumentPayload

  @Prop({ required: true, type: Object, default: {} })
  automationRun: CustomerRadarDocumentPayload

  @Prop({ required: true, type: [Object], default: [] })
  leads: CustomerRadarDocumentPayload[]

  @Prop({ required: true, type: [Object], default: [] })
  customerRecords: CustomerRadarDocumentPayload[]

  @Prop({ required: true, type: [Object], default: [] })
  replyCandidates: CustomerRadarDocumentPayload[]

  @Prop({ required: true, type: [Object], default: [] })
  executionLogs: CustomerRadarDocumentPayload[]

  @Prop({ required: true, type: [Object], default: [] })
  automationTasks: CustomerRadarDocumentPayload[]

  @Prop({ required: true, type: [Object], default: [] })
  taskRuns: CustomerRadarDocumentPayload[]

  @Prop({ required: true, type: [Object], default: [] })
  socialAccounts: CustomerRadarDocumentPayload[]

  @Prop({ required: true, type: [Object], default: [] })
  platformCapabilities: CustomerRadarDocumentPayload[]

  @Prop({ required: false, default: '' })
  ownedPostWorkId?: string

  @Prop({ required: false, default: 'xhs' })
  ownedPostPlatform?: string

  @Prop({ required: false, default: '' })
  ownedPostXsecToken?: string

  @Prop({ required: false, default: false })
  liveExecutionEnabled?: boolean
}

export const CustomerRadarWorkspaceSchema = SchemaFactory.createForClass(CustomerRadarWorkspace)

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'system_settings' })
export class SystemSetting extends WithTimestampSchema {
  id: string

  @Prop({ required: true, index: true, unique: true })
  key: string

  @Prop({ required: true, type: Object, default: {} })
  value: Record<string, unknown>

  @Prop({ required: false })
  updatedBy?: string
}

export const SystemSettingSchema = SchemaFactory.createForClass(SystemSetting)
