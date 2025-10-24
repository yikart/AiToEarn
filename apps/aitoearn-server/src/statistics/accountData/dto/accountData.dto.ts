import { Expose, Type } from 'class-transformer'
import { IsOptional, IsString, ValidateNested } from 'class-validator'

export class AccountIdDto {
  @IsString({ message: '账号ID' })
  @Expose()
  readonly accountId: string
}

export class UserIdDto {
  @IsString({ message: '用户ID' })
  @Expose()
  readonly userId: string
}

export class GetAuthorDataByDateDto extends AccountIdDto {
  @IsString({ message: '平台' })
  @Expose()
  readonly platform: string

  @IsString({ message: '日期' })
  @Expose()
  readonly date: string
}

export class GetAccountDataLatestDto extends AccountIdDto {
  @IsString({ message: 'platform' })
  @Expose()
  readonly platform: string

  @IsString({ message: 'uid' })
  @Expose()
  readonly uid: string
}

export class GetAccountDataByParamsDto {
  @IsOptional()
  @Expose()
  readonly params: any

  @IsOptional()
  @Expose()
  readonly sort: any

  @IsOptional()
  @Expose()
  readonly pageNo: number

  @IsOptional()
  @Expose()
  readonly pageSize: number
}

export class GetAccountDataPeriodDto extends AccountIdDto {
  @IsString({ message: '平台' })
  @Expose()
  readonly platform: string

  @IsString({ message: 'uid' })
  @Expose()
  readonly uid: string

  @IsString({ message: '开始日期' })
  // @IsOptional()
  @Expose()
  readonly startDate: string

  @IsString({ message: '结束日期' })
  // @IsOptional()
  @Expose()
  readonly endDate: string
}

export class GetChannelDataLatestByUidsDto {
  @ValidateNested({ each: true })
  @Type(() => PlatformUidQueryDto)
  @Expose()
  readonly queries: PlatformUidQueryDto[]
}

export class PlatformUidQueryDto {
  @IsString({ message: '平台' })
  @Expose()
  readonly platform: string

  @IsString({ message: 'uid' })
  @Expose()
  readonly uid: string
}

export class GetChannelDataPeriodByUidsDto {
  @ValidateNested({ each: true })
  @Type(() => PlatformUidQueryDto)
  @Expose()
  readonly queries: PlatformUidQueryDto[]

  @IsString({ message: '开始日期' })
  @IsOptional()
  @Expose()
  readonly startDate?: string

  @IsString({ message: '结束日期' })
  @IsOptional()
  @Expose()
  readonly endDate?: string
}

export class NewChannelDto {
  @IsString({ message: '平台' })
  @Expose()
  readonly platform: string

  @IsString({ message: 'uid' })
  @Expose()
  readonly uid: string
}
