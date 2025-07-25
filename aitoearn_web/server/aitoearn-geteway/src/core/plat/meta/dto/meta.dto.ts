import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsEnum, IsString } from 'class-validator'

enum SubMetaPlatform {
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  THREADS = 'threads',
}
export class GetAuthUrlDto {
  @ApiProperty({ title: '平台名称', required: true })
  @IsEnum(SubMetaPlatform, { message: '平台名称不能为空' })
  @Expose()
  readonly platform: string
}

export class GetAuthInfoDto {
  @ApiProperty({ title: '任务ID', required: true })
  @IsString({ message: '任务ID不能为空' })
  @Expose()
  readonly taskId: string
}

export class CreateAccountAndSetAccessTokenDto {
  @ApiProperty({ title: '任务ID', required: true })
  @IsString({ message: '任务ID不能为空' })
  @Expose()
  readonly taskId: string

  @ApiProperty({ title: '授权码', required: true })
  @IsString({ message: '授权码不能为空' })
  @Expose()
  readonly code: string

  @ApiProperty({ title: '状态码', required: true })
  @IsString({ message: '状态码不能为空' })
  @Expose()
  readonly state: string
}
