import { Type } from '@nestjs/common'
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface'
import { SchemaObjectFactory } from '@nestjs/swagger/dist/services/schema-object-factory'
import { z } from 'zod/v4'
import { isZodDto } from './zod-dto.util'

export function patchNestJsSwagger() {
  if ('__patchedWithLoveByNestjsZod' in SchemaObjectFactory.prototype)
    return
  const defaultExplore = SchemaObjectFactory.prototype.exploreModelSchema

  SchemaObjectFactory.prototype.exploreModelSchema = function (
    this: SchemaObjectFactory | undefined,
    type,
    schemas,
    schemaRefsStack,
  ) {
    if (this && this['isLazyTypeFunc'](type)) {
      const factory = type as () => Type<unknown>
      type = factory()
    }

    if (!isZodDto(type)) {
      return defaultExplore.call(this, type, schemas, schemaRefsStack)
    }

    schemas[type.name] = z.toJSONSchema(type.schema, {
      unrepresentable: 'any',
      override: (ctx) => {
        const _zod = ctx.zodSchema._zod
        const def = _zod.def
        if (def.type === 'date') {
          ctx.jsonSchema.type = 'string'
          ctx.jsonSchema.format = 'date-time'
        }
        if (def.type === 'custom') {
          const cls = _zod.bag.Class
          if (cls && cls['name'] === 'ObjectId') {
            ctx.jsonSchema.type = 'string'
          }
        }
      },
    }) as SchemaObject
    return type.name
  }
  SchemaObjectFactory.prototype['__patchedWithLoveByNestjsZod'] = true
}
