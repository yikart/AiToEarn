/*
 * @Author: niuwenzheng
 * @Date: 2020-04-14 15:29:18
 * @LastEditors: nevin
 * @LastEditTime: 2025-01-15 14:29:42
 * @Description: 参数验证管道
 */
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validateSync } from 'class-validator';
import { plainToClass } from 'class-transformer';
import * as _ from 'lodash';

@Injectable()
export class ParamsValidationPipe implements PipeTransform<any> {
  private toValidate(metatype): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) return value;

    // 数据转换成类
    const inData: any = plainToClass(metatype, value, {
      excludeExtraneousValues: true,
    });

    const errors = validateSync(inData, {
      whitelist: true,
    });

    if (errors.length <= 0) return inData;
    console.log('------ 参数验证失败：', _.values(errors[0].constraints)[0]);

    throw new BadRequestException(
      '参数验证失败： ' + _.values(errors[0].constraints)[0],
    );
  }
}
