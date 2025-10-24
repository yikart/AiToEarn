import { Expose, Type } from 'class-transformer'
import { IsNumber, IsOptional, IsString } from 'class-validator'
import { UserIdDto } from '../../bilibili/dto/bilibili.dto'

export class GetAuthUrlDto extends UserIdDto {
  @IsString({ message: '类型 pc h5' })
  @Expose()
  readonly type: 'h5' | 'pc'

  @IsString({ message: '空间ID' })
  @Expose()
  readonly spaceId: string
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

export class AccountIdDto {
  @IsString({ message: '账号ID' })
  @Expose()
  readonly accountId: string
}

export class GetPohotListDto extends AccountIdDto {
  @IsString({ message: '游标，用于分页，值为作品id。分页查询时，传上一页create_time最小的photo_id。第一页不传此参数。' })
  @IsOptional()
  @Expose()
  readonly cursor?: string

  @IsNumber(
    { allowNaN: false },
    {
      message:
        '数量，默认为20,最大不超过200',
    },
  )
  @Type(() => Number)
  @IsOptional()
  @Expose()
  readonly count?: number
}
