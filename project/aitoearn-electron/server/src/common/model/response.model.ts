import { ApiProperty } from '@nestjs/swagger';

export class ResOp<T = any> {
  @ApiProperty({ type: 'object', additionalProperties: true })
  data?: T;

  @ApiProperty({ type: 'number', default: 200 })
  code: number;

  @ApiProperty({ type: 'string', default: '请求成功' })
  msg: string;

  constructor(code: number, data: T, message = '请求成功') {
    this.code = code;
    this.data = data;
    this.msg = message;
  }

  static success<T>(data?: T, message?: string) {
    return new ResOp(200, data, message);
  }

  static error(code: number, message) {
    return new ResOp(code, {}, message);
  }
}

export class TreeResult<T> {
  @ApiProperty()
  id: number;

  @ApiProperty()
  parentId: number;

  @ApiProperty()
  children?: TreeResult<T>[];
}
