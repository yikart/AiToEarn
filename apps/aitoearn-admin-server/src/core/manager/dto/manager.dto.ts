import { Expose } from 'class-transformer'
import { IsOptional, IsString } from 'class-validator'

export class ChangePasswordDto {
  @IsString({ message: '密码' })
  @Expose()
  readonly password: string
}

export class UpdateUserInfoDto {
  @IsString({ message: '昵称' })
  @IsOptional()
  @Expose()
  readonly name?: string

  @IsString({ message: '头像' })
  @IsOptional()
  @Expose()
  avatar?: string

  @IsString({ message: '简介' })
  @IsOptional()
  @Expose()
  readonly desc?: string
}
