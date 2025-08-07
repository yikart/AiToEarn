import type { Type } from '@nestjs/common'
import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface'
import { SchemaObjectFactory } from '@nestjs/swagger/dist/services/schema-object-factory'
import { z } from 'zod'
import { isZodDto } from './zod-dto.util'

export const zodToJsonSchemaOptions: Parameters<typeof z.toJSONSchema>[1] = {
  uri: id => `#/components/schemas/${id}`,
  target: 'draft-7',
  unrepresentable: 'any',
  cycles: 'ref',
  override: (ctx) => {
    const _zod = ctx.zodSchema._zod
    const def = _zod.def
    if (def.type === 'date') {
      ctx.jsonSchema.type = 'string'
      ctx.jsonSchema.format = 'date-time'
    }
  },
}

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
    if (this && this.isLazyTypeFunc(type)) {
      const factory = type as () => Type<unknown>
      type = factory()
    }

    if (!isZodDto(type)) {
      return defaultExplore.call(this, type, schemas, schemaRefsStack)
    }

    schemas[type.name] = z.toJSONSchema(type.schema, zodToJsonSchemaOptions) as SchemaObject
    return type.name
  }
  // @ts-expect-error set __patchedWithLoveByNestjsZod to true
  SchemaObjectFactory.prototype.__patchedWithLoveByNestjsZod = true
}
