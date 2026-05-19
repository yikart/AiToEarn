import { Injectable, PipeTransform } from '@nestjs/common'
import { isValidObjectId } from 'mongoose'
import { ResponseCode } from '../enums'
import { AppException } from '../exceptions'

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string | undefined> {
  transform(value: string | undefined): string | undefined {
    if (value === undefined || value === null)
      return value
    if (!isValidObjectId(value)) {
      throw new AppException(ResponseCode.ValidationFailed)
    }
    return value
  }
}
