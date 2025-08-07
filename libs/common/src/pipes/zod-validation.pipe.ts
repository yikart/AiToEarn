import type { ZodDto } from '@common/utils'
import type { ArgumentMetadata, PipeTransform } from '@nestjs/common'
import type { ZodType } from 'zod'
import { isZodDto, zodValidate } from '@common/utils'
import { ValidationPipe } from '@nestjs/common'

export class ZodValidationPipe extends ValidationPipe implements PipeTransform {
  constructor(private schemaOrDto?: ZodType | ZodDto) {
    super({
      transform: true,
      whitelist: true,
      transformOptions: {
        excludeExtraneousValues: true,
      },
    })
  }

  public override transform(value: unknown, metadata: ArgumentMetadata): Promise<unknown> {
    if (this.schemaOrDto) {
      return Promise.resolve(zodValidate(value, this.schemaOrDto))
    }

    const { metatype } = metadata

    if (!isZodDto(metatype)) {
      return super.transform(value, metadata)
    }

    return Promise.resolve(zodValidate(value, metatype.schema))
  }
}
