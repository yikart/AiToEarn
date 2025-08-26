import { Expose, Type } from 'class-transformer'
import {
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator'

export class GetAuthUrlDto {
  @IsString({ message: '类型 pc h5' })
  @Expose()
  readonly type: 'pc' | 'h5'

  @IsString({ message: '应用标识' })
  @Expose()
  readonly key: string

  @IsString({ message: '透传数据' })
  @IsOptional()
  @Expose()
  readonly stat?: string
}

export class DisposeAuthTaskDto {
  @IsString({ message: '任务ID' })
  @Expose()
  readonly taskId: string

  @IsString({ message: '授权码' })
  @Expose()
  readonly auth_code: string

  @IsNumber({ allowNaN: false }, { message: '过期时间' })
  @Type(() => Number)
  @Expose()
  readonly expires_in: number
}

export class AuthBackParamDto {
  @IsString({ message: '任务ID' })
  @Expose()
  readonly taskId: string

  @IsString({ message: '前缀' })
  @IsOptional()
  @Expose()
  readonly prefix?: string
}

export class AuthBackQueryDto {
  @IsString({ message: '授权码' })
  @Expose()
  readonly auth_code: string

  @IsNumber({ allowNaN: false }, { message: '过期时间' })
  @Type(() => Number)
  @Expose()
  readonly expires_in: number
}
