import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const PublishOptionValuesQuerySchema = z.record(z.string(), z.unknown()).describe('发布选项取值过滤条件')

export class PublishOptionValuesQueryDto extends createZodDto(PublishOptionValuesQuerySchema) {}

export const PublishOptionCreateBodySchema = z.record(z.string(), z.unknown()).describe('发布选项创建参数')

export class PublishOptionCreateBodyDto extends createZodDto(PublishOptionCreateBodySchema) {}
