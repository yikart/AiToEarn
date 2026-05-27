import type { Type } from '@nestjs/common'
import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { z } from 'zod'
import { isZodDto } from './zod-dto.util'

interface SchemaObjectFactoryInstance {
  exploreModelSchema: (type: unknown, schemas: Record<string, SchemaObject>, schemaRefsStack?: string[]) => string
  isLazyTypeFunc: (type: unknown) => boolean
  __patchedWithLoveByNestjsZod?: boolean
}

const requireFromHere = createRequire(__filename)
const swaggerPackageJsonPath = requireFromHere.resolve('@nestjs/swagger/package.json')
const { SchemaObjectFactory } = requireFromHere(
  join(dirname(swaggerPackageJsonPath), 'dist/services/schema-object-factory.js'),
) as {
  SchemaObjectFactory: {
    prototype: SchemaObjectFactoryInstance
  }
}

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
    this: SchemaObjectFactoryInstance | undefined,
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

    schemas[type.name] = z.toJSONSchema(type.schema, zodToJsonSchemaOptions) as SchemaObject
    return type.name
  }
  SchemaObjectFactory.prototype.__patchedWithLoveByNestjsZod = true
}
