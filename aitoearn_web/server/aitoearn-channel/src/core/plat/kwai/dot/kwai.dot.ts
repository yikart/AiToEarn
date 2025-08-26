import { Expose } from 'class-transformer'
import { IsString } from 'class-validator'
import { UserIdDto } from '../../bilibili/dto/bilibili.dto'

export class GetAuthUrlDto extends UserIdDto {
  @IsString({ message: '类型 pc h5' })
  @Expose()
  readonly type: 'h5' | 'pc'
}

export class AddKwaiAccountDto extends UserIdDto {
  @IsString({ message: '授权成功后的获取的code' })
  @Expose()
  readonly code: string
}

export class GetAuthInfoDto {
  @IsString({ message: '任务ID' })
  @Expose()
  readonly taskId: string
}

export class CreateAccountAndSetAccessTokenDto {
  @IsString()
  @Expose()
  readonly taskId: string

  @IsString()
  @Expose()
  readonly code: string

  @IsString()
  @Expose()
  readonly state: string
}
