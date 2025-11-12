import type { Type } from '@nestjs/common'
import type { ReferenceObject, SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface'
import type { ZodType } from 'zod'
import { applyDecorators } from '@nestjs/common'
import { ApiBody, ApiExtraModels, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger'
import { z } from 'zod'
import { zodToJsonSchemaOptions } from '../utils'

export interface ApiDocOptions {
  /**
   * 接口摘要
   */
  summary: string

  /**
   * 接口详细描述
   */
  description?: string

  /**
   * 请求体 DTO Schema（可选）
   */
  body?: ZodType

  /**
   * 请求参数 DTO Schema（可选）
   */
  query?: ZodType

  /**
   * 响应 VO 类型
   */
  response?: Type | [Type] | ZodType
}

/**
 * Swagger 文档装饰器
 * 用于统一生成接口文档，支持分页响应和请求体验证
 *
 * @param options 装饰器选项
 */
export function ApiDoc(options: ApiDocOptions) {
  const {
    summary,
    description,
    body,
    query,
    response,
  } = options

  const responseType = Array.isArray(response) ? response[0] : response

  const decorators: MethodDecorator[] = [
    ApiOperation({
      summary,
      description,
    }),
  ]

  if (responseType && typeof responseType === 'function') {
    decorators.push(ApiExtraModels(responseType))
  }

  if (body) {
    const meta = z.globalRegistry.get(body)
    let schemaObject: SchemaObject | ReferenceObject
    if (meta && meta.id) {
      schemaObject = {
        $ref: `#/components/schemas/${meta.id}`,
      }
    }
    else {
      schemaObject = z.toJSONSchema(body, { ...zodToJsonSchemaOptions, io: 'input' }) as SchemaObject
    }
    decorators.push(
      ApiBody({
        schema: schemaObject,
      }),
    )
  }
  if (query) {
    const meta = z.globalRegistry.get(query)
    let schemaObject: SchemaObject | ReferenceObject
    if (meta && meta.id) {
      schemaObject = {
        $ref: `#/components/schemas/${meta.id}`,
      }
    }
    else {
      schemaObject = z.toJSONSchema(query, { ...zodToJsonSchemaOptions, io: 'input' }) as SchemaObject
    }
    decorators.push(
      ApiQuery({
        schema: schemaObject,
      }),
    )
  }

  let dataSchema: SchemaObject | ReferenceObject | undefined
  if (responseType) {
    if (typeof responseType === 'function') {
      dataSchema = Array.isArray(response)
        ? {
            type: 'array',
            items: {
              $ref: `#/components/schemas/${responseType.name}`,
            },
          }
        : {
            $ref: `#/components/schemas/${responseType.name}`,
          }
    }
    else {
      const meta = z.globalRegistry.get(responseType)
      let schemaObject: SchemaObject | ReferenceObject
      if (meta && meta.id) {
        schemaObject = {
          $ref: `#/components/schemas/${meta.id}`,
        }
      }
      else {
        schemaObject = z.toJSONSchema(responseType, { ...zodToJsonSchemaOptions, io: 'output' }) as SchemaObject
      }
      dataSchema = schemaObject
    }
  }

  decorators.push(
    ApiResponse({
      status: 'default',
      schema: {
        type: 'object',
        properties: {
          ...(dataSchema ? { data: dataSchema } : {}),
        },
        required: ['data'],
      },
    }),
    ApiResponse({

      status: 'error' as unknown as '5XX',
      schema: {
        type: 'object',
        properties: {
          ...(dataSchema ? { data: dataSchema } : {}),
          code: {
            type: 'number',
            description: '错误码',
          },
          message: {
            type: 'string',
            description: '错误消息',
          },
        },
        required: ['code', 'message'],
      },
    }),
  )

  return applyDecorators(...decorators)
}
