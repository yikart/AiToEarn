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

    schemas[type.name] = z.toJSONSchema(type.schema) as SchemaObject
    return type.name
  }
  SchemaObjectFactory.prototype['__patchedWithLoveByNestjsZod'] = true
}
