import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { NotificationTypeEmailControl, UserNotificationControl } from '../schemas'
import { BaseRepository } from './base.repository'

export interface NotificationTypeEmailControlData {
  email: boolean
}

export class UserNotificationControlRepository extends BaseRepository<UserNotificationControl> {
  constructor(
    @InjectModel(UserNotificationControl.name) model: Model<UserNotificationControl>,
  ) {
    super(model)
  }

  async findByUserId(userId: string) {
    return await this.findOne({
      userId,
      deletedAt: { $exists: false },
    })
  }

  async upsertByUserId(
    userId: string,
    controls: Record<string, NotificationTypeEmailControlData>,
  ) {
    const existing = await this.findByUserId(userId)

    if (existing) {
      const mergedControls: Record<string, NotificationTypeEmailControl> = { ...existing.controls }
      for (const [type, control] of Object.entries(controls)) {
        const existingControl = mergedControls[type] || { email: true }
        mergedControls[type] = {
          email: control.email ?? existingControl.email ?? true,
        }
      }
      const updated = await this.updateById(existing.id, { controls: mergedControls as unknown as Map<string, NotificationTypeEmailControl> })
      if (!updated) {
        throw new Error('Failed to update notification control')
      }
      return updated
    }

    const newControls: Record<string, NotificationTypeEmailControl> = {}
    for (const [type, control] of Object.entries(controls)) {
      newControls[type] = {
        email: control.email ?? true,
      }
    }
    return await this.create({ userId, controls: newControls as unknown as Map<string, NotificationTypeEmailControl> })
  }
}
