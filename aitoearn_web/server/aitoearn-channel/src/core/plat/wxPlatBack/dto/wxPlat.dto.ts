import { Expose, Type } from 'class-transformer'
import {
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator'
/*
 * @Author: nevin
 * @Date: 2024-06-17 20:12:31
 * @LastEditTime: 2025-05-06 15:49:03
 * @LastEditors: nevin
 * @Description: 用户
 */
import { AddArchiveData } from '@/libs/bilibili/comment'

export class AccountIdDto {
  @IsNumber({ allowNaN: false }, { message: '账号ID' })
  @Type(() => Number)
  @Expose()
  readonly accountId: number
}

export class UserIdDto {
  @IsString({ message: '用户ID' })
  @Expose()
  readonly userId: string
}

export class GetAuthUrlDto extends UserIdDto {
  @IsString({ message: '类型 pc h5' })
  @Expose()
  readonly type: 'pc' | 'h5'

  @IsString({ message: '前缀' })
  @IsOptional()
  @Expose()
  readonly prefix?: string
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

export class GetAuthInfoDto {
  @IsString({ message: '任务ID' })
  @Expose()
  readonly taskId: string
}

export class GetHeaderDto extends AccountIdDto {
  @IsObject({ message: '数据' })
  @Expose()
  readonly body: { [key: string]: any }

  @IsBoolean({ message: '是否是表单提交' })
  @Expose()
  readonly isForm: boolean
}

export class VideoInitDto extends AccountIdDto {
  @IsNumber(
    { allowNaN: false },
    {
      message:
        '上传类型：0，1。0-多分片，1-单个小文件（不超过100M）。默认值为0',
    },
  )
  @Type(() => Number)
  @Expose()
  readonly utype: number // 0 1

  @IsString({ message: '文件名称' })
  @Expose()
  readonly name: string
}

export class AddArchiveDto extends AccountIdDto {
  @IsObject({ message: '数据' })
  @Expose()
  readonly data: AddArchiveData

  @IsString({ message: '上传token' })
  @Expose()
  readonly uploadToken: string
}
