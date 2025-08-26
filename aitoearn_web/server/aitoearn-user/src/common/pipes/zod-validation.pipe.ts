import { isZodDto, ZodDto, zodValidate } from '@common/utils'
import { ArgumentMetadata, PipeTransform, ValidationPipe } from '@nestjs/common'
import { ZodType } from 'zod/v4'

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
