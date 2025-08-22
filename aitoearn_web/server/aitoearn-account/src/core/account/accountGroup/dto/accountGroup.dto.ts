import { Expose } from 'class-transformer'
import { IsArray, IsJSON, IsNumber, IsOptional, IsString } from 'class-validator'

export class UserIdDto {
  @IsString({ message: '用户ID不能为空' })
  @Expose()
  userId: string
}

export class CreateAccountGroupDto extends UserIdDto {
  @IsString({ message: '组名称不能为空' })
  @Expose()
  name: string

  @IsNumber({ allowNaN: false }, { message: '组排序必须为数字' })
  @IsOptional()
  @Expose()
  rank?: number

  @IsString({ message: 'IP' })
  @IsOptional()
  @Expose()
  ip?: string

  @IsString({ message: '地址' })
  @IsOptional()
  @Expose()
  location?: string

  @IsString({ message: '代理IP' })
  @IsOptional()
  @Expose()
  proxyIp?: string

  @IsJSON({ message: '浏览器配置必须为JSON格式' })
  @IsOptional()
  @Expose()
  browserConfig: Record<string, any>
}

export class UpdateAccountGroupDto extends CreateAccountGroupDto {
  @IsString({ message: '组ID' })
  @Expose()
  id: string
}

export class DeleteAccountGroupDto extends UserIdDto {
  @IsArray({ message: '组ID不能为空' })
  @IsString({ each: true, message: '组ID不能为空' })
  @Expose()
  ids: string[]
}
