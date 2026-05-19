import { isValidObjectId } from 'mongoose'
import { z } from 'zod'

export function zObjectId(description?: string) {
  const schema = z.string().refine(v => isValidObjectId(v), { message: '无效的 ID 格式' })
  return description ? schema.describe(description) : schema
}
