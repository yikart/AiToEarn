import type { SchemaOptions } from 'mongoose'

export const DEFAULT_SCHEMA_OPTIONS: SchemaOptions = {
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  id: true,
  timestamps: true,
}
